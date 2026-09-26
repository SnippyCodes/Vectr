import os
import json
import asyncio
from sqlalchemy.orm import Session
import models
import subprocess

WORKSPACES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "workspaces")

def _sync_run_cmd(cmd: str, cwd: str = None):
    try:
        res = subprocess.run(
            cmd,
            cwd=cwd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=120,
            errors="ignore",
        )
        return res.returncode, res.stdout, res.stderr
    except Exception as e:
        return 1, "", str(e)

async def run_cmd_async(cmd: str, cwd: str = None):
    return await asyncio.to_thread(_sync_run_cmd, cmd, cwd)

def generate_tree(dir_path: str, max_depth: int = 3, current_depth: int = 0) -> str:
    """Generate a compact directory tree using stdlib os.walk."""
    if current_depth > max_depth or not os.path.exists(dir_path):
        return ""
    ignore = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build", ".next"}
    lines = []
    base_depth = dir_path.rstrip(os.sep).count(os.sep)
    for root, dirs, files in os.walk(dir_path):
        dirs[:] = [d for d in sorted(dirs) if d not in ignore]
        depth = root.count(os.sep) - base_depth
        if depth > max_depth:
            continue
        indent = "  " * depth
        rel_dir = os.path.basename(root)
        if depth > 0:
            lines.append(f"{indent}- {rel_dir}/")
        for f in sorted(files):
            lines.append(f"{indent}  - {f}")
    return "\n".join(lines[:100]) + "\n"

def get_readme_content(repo_dir: str) -> str:
    for filename in ["README.md", "readme.md", "README.txt", "README"]:
        path = os.path.join(repo_dir, filename)
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return f.read()[:2000] # Limit to 2000 chars
            except:
                pass
    return "No README content found."

async def _invoke_nova_for_analysis(repo_name: str, tree: str, readme: str) -> str:
    """Generates a deep technical context summary of the repository using the unified AI engine."""
    try:
        from app.services.ai_service import call_ai_engine

        system_prompt = (
            f"You are a Senior Software Architect analyzing the repository '{repo_name}'.\n"
            f"Based on the repository's file structure and README below, formulate a detailed but concise project context.\n"
            f"Include:\n1. Tech stack and frameworks.\n2. Key directories and their assumed roles based on standard architecture.\n"
            f"3. Any important entry points or configuration files.\n"
            f"This summary will be injected into future AI chats to help a user contribute to this exact repository.\n"
            f"Output purely the analysis, no conversational filler."
        )
        user_msg = f"FILE TREE:\n{tree}\n\nREADME EXCERPT:\n{readme}\n\nPlease provide the structural analysis."

        return call_ai_engine(
            messages=[{"role": "user", "content": user_msg}],
            system_prompt=system_prompt,
            temperature=0.3,
            max_tokens=1500,
        )
    except Exception as e:
        print(f"Error invoking AI engine for static analysis: {e}")
        return "Could not generate deep structural analysis at this time."

async def _invoke_nova_for_diff_summary(diff_str: str) -> str:
    """Generates a short concise summary of a git diff using the unified AI engine."""
    if not diff_str.strip():
        return "No significant code changes found."

    try:
        from app.services.ai_service import call_ai_engine

        system_prompt = (
            "You are an expert code reviewer.\n"
            "Formulate a highly concise, 1-2 sentence technical summary of the git diff provided.\n"
            "Focus purely on what the code changes actually accomplish without conversational filler."
        )
        user_msg = f"GIT DIFF:\n```diff\n{diff_str}\n```\n\nPlease summarize these code changes."

        return call_ai_engine(
            messages=[{"role": "user", "content": user_msg}],
            system_prompt=system_prompt,
            temperature=0.2,
            max_tokens=300,
        )
    except Exception as e:
        print(f"Error invoking AI engine for diff summary: {e}")
        return "Could not summarize the recent commit diff."

async def analyze_and_cache_repo(repo_name: str, db: Session, bedrock_client=None) -> str:
    """Returns the cached analysis, or generates and stores one."""
    cached = db.query(models.RepoAnalysis).filter(models.RepoAnalysis.repo_name == repo_name).first()
    if cached:
        return cached.system_prompt_context

    if not os.path.exists(WORKSPACES_DIR):
        os.makedirs(WORKSPACES_DIR)

    repo_dir = os.path.join(WORKSPACES_DIR, repo_name.replace("/", "_"))

    # If repo directory exists but not cached (e.g. wiped db), just analyze it. Otherwise clone it.
    if not os.path.exists(repo_dir):
        clone_url = f"https://github.com/{repo_name}.git"
        code, out, err = await run_cmd_async(f"git clone {clone_url} {os.path.basename(repo_dir)}", cwd=WORKSPACES_DIR)
        print(f"Clone result: code={code}")
        
    tree = generate_tree(repo_dir)
    readme = get_readme_content(repo_dir)

    analysis_str = await _invoke_nova_for_analysis(repo_name, tree, readme)
    
    # Save to db
    from sqlalchemy.exc import IntegrityError
    new_analysis = models.RepoAnalysis(repo_name=repo_name, system_prompt_context=analysis_str)
    try:
        db.add(new_analysis)
        db.commit()
    except IntegrityError:
        db.rollback()
        # Another request inserted it concurrently, which is fine
        pass
    
    return analysis_str


async def evaluate_local_commits(repo_name: str, issue_number: int, user_email: str, db: Session) -> str:
    """Checks the issue branch for commits on the user's fork, produces a diff, and attempts to run tests."""
    repo_short_name = repo_name.split('/')[-1] if '/' in repo_name else repo_name
    
    # Securely retrieve PAT and GitHub Username
    github_username = None
    pat = None
    decrypted_pat = None
    try:
        import requests as req
        from app.utils.encryption import decrypt_pat
        user_record = db.query(models.User).filter(models.User.email == user_email).first()
        if user_record and user_record.github_pat:
            pat = user_record.github_pat
            decrypted_pat = decrypt_pat(pat)
            res = req.get("https://api.github.com/user", headers={"Authorization": f"Bearer {decrypted_pat}"})
            if res.status_code == 200:
                github_username = res.json().get("login")
    except Exception as e:
        print(f"Error fetching github username for evaluation route: {e}")
        
    if not github_username or not decrypted_pat:
        return ""
        
    repo_dir = os.path.join(WORKSPACES_DIR, f"{github_username}_{repo_short_name}")
    
    if not os.path.exists(repo_dir):
        # User hasn't made a Vectr-synced clone of their fork yet, let's clone it now
        if not os.path.exists(WORKSPACES_DIR):
            os.makedirs(WORKSPACES_DIR)
        clone_url = f"https://{decrypted_pat}@github.com/{github_username}/{repo_short_name}.git"
        code, out, err = await run_cmd_async(f"git clone {clone_url} {os.path.basename(repo_dir)}", cwd=WORKSPACES_DIR)
        if code != 0:
             return ""
             
    branch_name = f"fix/issue-{issue_number}"
    
    # 1. Pull latest from remote
    await run_cmd_async(f"git fetch origin", cwd=repo_dir)
    
    # Check if branch exists locally
    code, out, err = await run_cmd_async(f"git branch --list {branch_name}", cwd=repo_dir)
    if not out.strip():
        # Try to checkout the remote branch if it exists, otherwise it might not exist at all yet
        chk_code, chk_out, chk_err = await run_cmd_async(f"git checkout -b {branch_name} origin/{branch_name}", cwd=repo_dir)
        if chk_code != 0:
             # Branch doesn't exist on remote either
             return ""
    else:
        # Branch exists locally, pull latest
        await run_cmd_async(f"git checkout {branch_name}", cwd=repo_dir)
        await run_cmd_async(f"git pull origin {branch_name}", cwd=repo_dir)
         
    # 2. Get git diff with whichever branch it branched from (usually main or master)
    code, def_branch_out, err = await run_cmd_async("git symbolic-ref refs/remotes/origin/HEAD", cwd=repo_dir)
    default_branch = "main" if code != 0 else def_branch_out.strip().split('/')[-1]

    code, diff_out, err = await run_cmd_async(f"git diff {default_branch}...{branch_name}", cwd=repo_dir)
    
    if not diff_out.strip():
        # Branch exists but no commits made
        return ""
        
    # Limit diff output
    diff_str = diff_out[:3000] + ("\n...diff truncated..." if len(diff_out) > 3000 else "")
    
    # 3. Attempt to run tests if applicable
    test_results = "No local tests were able to run (or no standard testing script found in package.json / pytest)."
    if os.path.exists(os.path.join(repo_dir, "package.json")):
        with open(os.path.join(repo_dir, "package.json"), "r") as f:
            try:
                pkg = json.load(f)
                if "test" in pkg.get("scripts", {}):
                     code, t_out, t_err = await run_cmd_async("npm test --passWithNoTests", cwd=repo_dir)
                     test_results = f"Test suite ran (exit code {code}):\nSTDOUT:\n{t_out[-1000:]}\nSTDERR:\n{t_err[-1000:]}"
            except Exception:
                pass
    elif os.path.exists(os.path.join(repo_dir, "pytest.ini")) or os.path.exists(os.path.join(repo_dir, "tests")):
         code, t_out, t_err = await run_cmd_async("pytest --maxfail=1", cwd=repo_dir)
         test_results = f"Pytest suite ran (exit code {code}):\nSTDOUT:\n{t_out[-1000:]}\nSTDERR:\n{t_err[-1000:]}"
         
    # Generate an AI summary of the diff so we don't spam the chat context with 3000 chars of pure code
    try:
        diff_summary = await _invoke_nova_for_diff_summary(diff_str)
    except Exception as e:
        diff_summary = f"Summary failed: {e}. Raw diff truncated length: {len(diff_str)}"

    evaluation = (
        f"\n\n--- LOCAL COMMIT ANALYSIS ---\n"
        f"The user has created local commits on branch '{branch_name}'.\n"
        f"AI Summary of Code Changes:\n{diff_summary}\n\n"
        f"Local Unit Test Results:\n{test_results}\n\n"
        f"Whenever the user asks you to verify their local solution, strictly check the 'Local Unit Test Results' block. "
        f"If the tests passed (if they exist) and the 'AI Summary of Code Changes' matches the proposed approach, explicitly congratulate them and say the issue is solved. "
        f"If there are errors, guide them on how to fix the code."
    )
    return evaluation


async def _resolve_repo_context(repo_name: str, issue_number: int, user_email: str, db: Session):
    """Helper: resolves workspace dir, default branch, and target branch for diff operations."""
    repo_short_name = repo_name.split('/')[-1] if '/' in repo_name else repo_name
    github_username = None
    try:
        import requests as req
        from app.utils.encryption import decrypt_pat
        user_record = db.query(models.User).filter(models.User.email == user_email).first()
        if user_record and user_record.github_pat:
            decrypted_pat = decrypt_pat(user_record.github_pat)
            res = req.get("https://api.github.com/user", headers={"Authorization": f"Bearer {decrypted_pat}"})
            if res.status_code == 200:
                github_username = res.json().get("login")
    except Exception as e:
        print(f"Error fetching github username: {e}")
        
    if not github_username:
        return None, None, None
        
    repo_dir = os.path.join(WORKSPACES_DIR, f"{github_username}_{repo_short_name}")
    if not os.path.exists(repo_dir):
        return None, None, None
             
    branch_name = f"fix/issue-{issue_number}"
    code, def_branch_out, _ = await run_cmd_async("git symbolic-ref refs/remotes/origin/HEAD", cwd=repo_dir)
    default_branch = "main" if code != 0 else def_branch_out.strip().split('/')[-1]
    return repo_dir, default_branch, branch_name


async def get_local_diff_stat(repo_name: str, issue_number: int, user_email: str, db: Session) -> str:
    """Gets the git diff --stat for the user's issue branch against the default branch."""
    repo_dir, default_branch, branch_name = await _resolve_repo_context(repo_name, issue_number, user_email, db)
    if not repo_dir:
        return "No local checkout found. Make sure you have opened this issue in VS Code."

    code, diff_out, _ = await run_cmd_async(f"git diff --stat {default_branch}...{branch_name}", cwd=repo_dir)
    return diff_out.strip() if diff_out.strip() and code == 0 else "No code changes detected yet."


async def get_local_diff_patch(repo_name: str, issue_number: int, user_email: str, db: Session) -> str:
    """Gets the full git diff (patch) for the user's issue branch against the default branch."""
    repo_dir, default_branch, branch_name = await _resolve_repo_context(repo_name, issue_number, user_email, db)
    if not repo_dir:
        return ""

    code, diff_out, _ = await run_cmd_async(f"git diff {default_branch}...{branch_name}", cwd=repo_dir)
    if not diff_out.strip() or code != 0:
        return ""
    
    full_diff = diff_out.strip()
    return full_diff[:8000] + "\n\n... (diff truncated, showing first 8000 chars)" if len(full_diff) > 8000 else full_diff

