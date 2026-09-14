import base64
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
import httpx

import models as models
import app.schemas as schemas
from database import get_db
from app.utils.encryption import decrypt_pat
from app.main import limiter

routes = APIRouter(prefix="/repos", tags=["Repository & Issues"])

def get_github_token(email: str, db: Session) -> str:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.github_pat:
        raise HTTPException(status_code=400, detail="User's Github PAT is missing")
    return decrypt_pat(user.github_pat)

def get_github_headers(token: str):
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Vectr-OpenSource-App"
    }

def compute_repo_opportunity(stars: int, open_issues: int):
    """
    Computes de-congestion opportunity score (0-100).
    Sweet spot: 300 - 8,000 stars (active maintainers, responsive, low overcrowding).
    Mega repos (>25k stars) get lower opportunity scores due to review backlog.
    """
    if 300 <= stars <= 8000:
        base_score = 94
        congestion = "Low"
        review_time = "< 24 hours"
    elif 8000 < stars <= 25000:
        base_score = 78
        congestion = "Moderate"
        review_time = "< 3 days"
    elif stars > 25000:
        base_score = 48
        congestion = "Overcrowded"
        review_time = "> 2 weeks"
    elif stars >= 50:
        base_score = 72
        congestion = "Low"
        review_time = "< 48 hours"
    else:
        base_score = 58
        congestion = "Moderate"
        review_time = "< 5 days"

    if 5 <= open_issues <= 120:
        base_score = min(99, base_score + 5)
    elif open_issues > 400:
        base_score = max(35, base_score - 10)

    return base_score, congestion, review_time

def compute_issue_opportunity(labels: List[str], body: str):
    labels_lower = [l.lower() for l in labels]
    is_good_first = any(x in l for l in labels_lower for x in ["good first", "good-first", "beginner", "easy", "starter", "up-for-grabs", "help wanted"])
    is_doc = any("doc" in l for l in labels_lower)

    if is_good_first:
        difficulty = "Beginner"
        merge_prob = "High (96%)"
    elif is_doc:
        difficulty = "Beginner"
        merge_prob = "High (92%)"
    elif any("bug" in l for l in labels_lower):
        difficulty = "Intermediate"
        merge_prob = "Moderate (80%)"
    else:
        difficulty = "Intermediate" if len(body or "") < 1200 else "Advanced"
        merge_prob = "Moderate (72%)"

    return difficulty, merge_prob

@routes.get("/{org_name}", response_model=schemas.RepoListResponse)
@limiter.limit("60/minute")
async def get_org_repos(
    request: Request,
    org_name: str, 
    email: str,
    language: Optional[str] = Query(None, description="Filter repos by language"),
    db: Session = Depends(get_db)):
    """Fetch repositories for a selected Organization with Opportunity & Congestion scoring"""
    token = get_github_token(email, db)
    headers = get_github_headers(token)

    async with httpx.AsyncClient(timeout=15.0) as client:
        repos_url = f"https://api.github.com/orgs/{org_name}/repos?sort=updated&per_page=30"
        res = await client.get(repos_url, headers=headers)

        if res.status_code == 404:
            repos_url = f"https://api.github.com/users/{org_name}/repos?sort=updated&per_page=30"
            res = await client.get(repos_url, headers=headers)

        if res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid GitHub PAT token.")
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"Failed to fetch repos from GitHub: {res.text}")

        raw_repos = res.json()
        repos = []

        for repo in raw_repos:
            if language:
                search_language = "HTML" if language == "HTML/CSS" else language
                repo_language = repo.get("language")
                if repo_language and repo_language.lower() != search_language.lower():
                    continue

            stars = repo.get("stargazers_count", 0)
            open_issues = repo.get("open_issues_count", 0)
            opp_score, congestion, review_time = compute_repo_opportunity(stars, open_issues)

            repos.append(
                schemas.RepoItem(
                    name=repo["name"],
                    full_name=repo["full_name"],
                    description=repo.get("description"),
                    language=repo.get("language"),
                    open_issues_count=open_issues,
                    stars=stars,
                    opportunity_score=opp_score,
                    congestion_level=congestion,
                    estimated_review_time=review_time
                )
            )

        # Sort repos by opportunity_score descending
        repos.sort(key=lambda r: r.opportunity_score, reverse=True)

        return schemas.RepoListResponse(
            org_name=org_name,
            repos=repos
        )

@routes.get("/{org_name}/{repo_name}/issues", response_model=schemas.IssueListResponse)
@limiter.limit("60/minute")
async def get_repo_issues(
    request: Request,
    org_name: str, 
    repo_name: str, 
    email: str,
    db: Session = Depends(get_db)):
    """Fetch open issues for a selected Repository with difficulty and merge probability"""
    token = get_github_token(email, db)
    headers = get_github_headers(token)

    async with httpx.AsyncClient(timeout=15.0) as client:
        issues_url = f"https://api.github.com/repos/{org_name}/{repo_name}/issues?state=open&per_page=30&sort=updated"
        res = await client.get(issues_url, headers=headers)

        if res.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid GitHub PAT token.")
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"Failed to fetch issues: {res.text}")

        raw_issues = res.json()
        issues = []

        for issue in raw_issues:
            if "pull_request" in issue:
                continue

            labels = [label["name"] for label in issue.get("labels", [])]
            body_text = issue.get("body", "") or ""
            diff, merge_prob = compute_issue_opportunity(labels, body_text)
            is_unclaimed = issue.get("assignee") is None and not issue.get("assignees")

            issues.append(
                schemas.IssueItem(
                    number=issue["number"],
                    title=issue["title"],
                    state=issue["state"],
                    html_url=issue["html_url"],
                    body=body_text,
                    labels=labels,
                    difficulty=diff,
                    merge_probability=merge_prob,
                    is_unclaimed=is_unclaimed
                )
            )

        return schemas.IssueListResponse(
            repo_name=f"{org_name}/{repo_name}",
            issues=issues
        )

@routes.get("/{org_name}/{repo_name}/file-tree", response_model=schemas.FileTreeResponse)
@limiter.limit("30/minute")
async def get_repo_file_tree(
    request: Request,
    org_name: str,
    repo_name: str,
    email: str,
    db: Session = Depends(get_db)):
    """Fetch the repository file tree for the in-browser Code Studio"""
    token = get_github_token(email, db)
    headers = get_github_headers(token)

    async with httpx.AsyncClient(timeout=15.0) as client:
        repo_res = await client.get(f"https://api.github.com/repos/{org_name}/{repo_name}", headers=headers)
        if repo_res.status_code != 200:
            raise HTTPException(status_code=repo_res.status_code, detail="Failed to fetch repository metadata")
        default_branch = repo_res.json().get("default_branch", "main")

        tree_url = f"https://api.github.com/repos/{org_name}/{repo_name}/git/trees/{default_branch}?recursive=1"
        res = await client.get(tree_url, headers=headers)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="Failed to fetch repository file tree")

        tree_data = res.json()
        tree = tree_data.get("tree", [])

        ignore_exts = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot", ".zip", ".tar", ".gz", ".lock"}
        filtered = []
        for item in tree:
            if item.get("type") == "blob":
                path = item.get("path", "")
                if any(ignored in path for ignored in ["node_modules/", ".git/", "vendor/", "__pycache__/"]):
                    continue
                if any(path.endswith(ext) for ext in ignore_exts):
                    continue
                filtered.append(schemas.FileTreeItem(path=path, type="blob", size=item.get("size")))
            if len(filtered) >= 150:
                break

        return schemas.FileTreeResponse(
            repo_name=f"{org_name}/{repo_name}",
            files=filtered
        )

@routes.get("/{org_name}/{repo_name}/file-content", response_model=schemas.FileContentResponse)
@limiter.limit("60/minute")
async def get_repo_file_content(
    request: Request,
    org_name: str,
    repo_name: str,
    path: str,
    email: str,
    ref: Optional[str] = None,
    db: Session = Depends(get_db)):
    """Fetch file content from GitHub repository for editing in browser"""
    token = get_github_token(email, db)
    headers = get_github_headers(token)

    params = {}
    if ref:
        params["ref"] = ref

    async with httpx.AsyncClient(timeout=15.0) as client:
        url = f"https://api.github.com/repos/{org_name}/{repo_name}/contents/{path}"
        res = await client.get(url, headers=headers, params=params)

        if res.status_code == 404:
            raise HTTPException(status_code=404, detail=f"File not found: {path}")
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"Failed to fetch file content: {res.text}")

        data = res.json()
        raw_content = data.get("content", "")
        encoding = data.get("encoding", "")

        decoded_text = ""
        if encoding == "base64":
            decoded_text = base64.b64decode(raw_content).decode("utf-8", errors="replace")
        else:
            decoded_text = raw_content

        return schemas.FileContentResponse(
            path=path,
            content=decoded_text,
            sha=data.get("sha", ""),
            size=data.get("size", len(decoded_text))
        )

@routes.post("/{org_name}/{repo_name}/commit-file", response_model=schemas.CommitFileResponse)
@limiter.limit("20/minute")
async def commit_file_to_fork(
    request: Request,
    org_name: str,
    repo_name: str,
    payload: schemas.CommitFileRequest,
    db: Session = Depends(get_db)):
    """
    Zero-Compute In-Browser Commit:
    1. Ensures user has a fork of the repo
    2. Creates feature branch on fork if not existing
    3. Commits the modified file directly to user's fork via GitHub Contents API
    """
    token = get_github_token(payload.user_email, db)
    headers = get_github_headers(token)

    async with httpx.AsyncClient(timeout=30.0) as client:
        user_res = await client.get("https://api.github.com/user", headers=headers)
        if user_res.status_code != 200:
            raise HTTPException(status_code=user_res.status_code, detail="Invalid GitHub PAT: Cannot get user profile")
        user_login = user_res.json()["login"]

        # Check if fork exists or trigger fork
        fork_check = await client.get(f"https://api.github.com/repos/{user_login}/{repo_name}", headers=headers)
        if fork_check.status_code == 404:
            fork_create = await client.post(f"https://api.github.com/repos/{org_name}/{repo_name}/forks", headers=headers)
            if fork_create.status_code not in (200, 202):
                raise HTTPException(status_code=fork_create.status_code, detail=f"Failed to fork repo: {fork_create.text}")

        # Get base repo default branch SHA
        base_repo_res = await client.get(f"https://api.github.com/repos/{org_name}/{repo_name}", headers=headers)
        default_branch = base_repo_res.json().get("default_branch", "main")

        ref_res = await client.get(f"https://api.github.com/repos/{org_name}/{repo_name}/git/ref/heads/{default_branch}", headers=headers)
        if ref_res.status_code != 200:
            raise HTTPException(status_code=ref_res.status_code, detail="Failed to get default branch ref")
        base_sha = ref_res.json()["object"]["sha"]

        branch_name = payload.branch_name.strip()
        if not branch_name:
            branch_name = "fix/vectr-patch"

        branch_check = await client.get(f"https://api.github.com/repos/{user_login}/{repo_name}/git/ref/heads/{branch_name}", headers=headers)
        if branch_check.status_code == 404:
            import asyncio
            create_ref_res = await client.post(
                f"https://api.github.com/repos/{user_login}/{repo_name}/git/refs",
                headers=headers,
                json={"ref": f"refs/heads/{branch_name}", "sha": base_sha}
            )
            if create_ref_res.status_code not in (200, 201):
                await asyncio.sleep(2)
                create_ref_res = await client.post(
                    f"https://api.github.com/repos/{user_login}/{repo_name}/git/refs",
                    headers=headers,
                    json={"ref": f"refs/heads/{branch_name}", "sha": base_sha}
                )

        file_sha = None
        file_check = await client.get(
            f"https://api.github.com/repos/{user_login}/{repo_name}/contents/{payload.file_path}?ref={branch_name}",
            headers=headers
        )
        if file_check.status_code == 200:
            file_sha = file_check.json().get("sha")
        else:
            base_file_check = await client.get(
                f"https://api.github.com/repos/{org_name}/{repo_name}/contents/{payload.file_path}",
                headers=headers
            )
            if base_file_check.status_code == 200:
                file_sha = base_file_check.json().get("sha")

        b64_content = base64.b64encode(payload.content.encode("utf-8")).decode("utf-8")
        commit_body = {
            "message": payload.commit_message or f"fix: update {payload.file_path}",
            "content": b64_content,
            "branch": branch_name
        }
        if file_sha:
            commit_body["sha"] = file_sha

        commit_res = await client.put(
            f"https://api.github.com/repos/{user_login}/{repo_name}/contents/{payload.file_path}",
            headers=headers,
            json=commit_body
        )

        if commit_res.status_code not in (200, 201):
            raise HTTPException(status_code=commit_res.status_code, detail=f"Failed to commit file to GitHub: {commit_res.text}")

        commit_data = commit_res.json()
        commit_html_url = commit_data.get("commit", {}).get("html_url")

        return schemas.CommitFileResponse(
            success=True,
            commit_url=commit_html_url,
            branch=branch_name,
            file_path=payload.file_path,
            message="File successfully committed to your fork!"
        )
