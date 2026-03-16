from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import models as models
import app.schemas as schemas
from database import get_db
import requests as rq
from app.utils.encryption import decrypt_pat
from typing import Optional

routes = APIRouter(prefix="/contribution", tags=["Contribution Flow"])

# Popular Orgs fallback
POPULAR_ORGS = ["facebook", "vercel", "microsoft", "google", "freeCodeCamp"]

@routes.get("/start", response_model=schemas.StartContributionResponse)
def start_contribution(
    email: str, 
    language: Optional[str] = Query(None, description="Optional. If provided, filters orgs by this language."),
    search_query: Optional[str] = Query(None, description="Optional. Seach for specific Github Orgs"),
    db: Session = Depends(get_db)):
    
    # 1. Fetch User 
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
        
    exp_level = user.experience_lvl.lower()
    
    # Prompt for Language Selection first (unless they already provided one or are searching)
    if not language and not search_query:
        # Return a list of supported or popular languages for them to choose from
        supported_languages = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "HTML/CSS", "Ruby", "Swift", "Kotlin", "PHP", "Dart", "Scala", "Shell", "Objective-C", "R", "Lua", "Perl", "Haskell", "Elixir", "Clojure", "Groovy", "MATLAB", "Assembly", "Vue", "React", "Svelte", "Angular", "SQL", "NoSQL", "Solidity", "WebAssembly"]
        return schemas.StartContributionResponse(
            next_step="SELECT_LANGUAGE",
            languages=supported_languages
        )
        
    # INTERMEDIATE / EXPERT / BEGINNER (WITH LANGUAGE): Proceed to Org Selection
    if not user.github_pat:
        raise HTTPException(status_code=400, detail="User's Github PAT is missing")
        
    pat = decrypt_pat(user.github_pat)
    headers = {
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json"
    }

    organizations = []
    
    try:
        if search_query:
            # SEARCH ORGS: https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-users
            search_url = "https://api.github.com/search/users"
            params = {
                "q": f"{search_query} type:org",
                "per_page": 10
            }
            res = rq.get(search_url, headers=headers, params=params)
            res.raise_for_status()
            
            items = res.json().get("items", [])
            for item in items:
                organizations.append(
                    schemas.OrganizationItem(
                        name=item["login"],
                        description=None, # Search API doesn't return full details
                        avatar_url=item["avatar_url"],
                        url=item["html_url"],
                        language=None
                    )
                )
        elif language:
            # FIND ORGS BY LANGUAGE (Query Github Repos by Language, then extract orgs)
            search_language = "HTML" if language == "HTML/CSS" else language
            search_url = "https://api.github.com/search/repositories"
            params = {
                "q": f"language:{search_language}",
                "sort": "stars",
                "order": "desc",
                "per_page": 100
            }
            res = rq.get(search_url, headers=headers, params=params)
            res.raise_for_status()
            
            items = res.json().get("items", [])
            seen_orgs = set()
            for item in items:
                org_name = item["owner"]["login"]
                if item["owner"]["type"] == "Organization" and org_name not in seen_orgs:
                    seen_orgs.add(org_name)
                    organizations.append(
                        schemas.OrganizationItem(
                            name=org_name,
                            description=item["owner"].get("description"), # Note: Repo search might not include org description directly
                            avatar_url=item["owner"]["avatar_url"],
                            url=item["owner"]["html_url"],
                            language=language
                        )
                    )
                    if len(organizations) >= 100:
                         break
        else:
            # DEFAULT: Return Popular Orgs
            for org_name in POPULAR_ORGS:
                res = rq.get(f"https://api.github.com/users/{org_name}", headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    organizations.append(
                        schemas.OrganizationItem(
                            name=data["login"],
                            description=data.get("description", "A popular Open Source Organization."),
                            avatar_url=data.get("avatar_url"),
                            url=data.get("html_url"),
                            language=None
                        )
                    )

        return schemas.StartContributionResponse(
            next_step="SELECT_ORG",
            organizations=organizations
        )
            
    except rq.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid GitHub PAT token.")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch data from GitHub.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching organizations: {str(e)}")

@routes.post("/submit-pr")
async def submit_pr(req: schemas.SubmitPRRequest, db: Session = Depends(get_db)):
    # 1. Verify User
    user = db.query(models.User).filter(models.User.email == req.user_email).first()
    if not user or not user.github_pat:
        raise HTTPException(status_code=404, detail="User not found or GitHub PAT missing")

    from app.utils.encryption import decrypt_pat
    decrypted_pat = decrypt_pat(user.github_pat)

    # 2. Get GitHub username
    import requests as req_http
    res = req_http.get("https://api.github.com/user", headers={"Authorization": f"Bearer {decrypted_pat}", "Accept": "application/vnd.github.v3+json"})
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid GitHub PAT token.")
    github_username = res.json().get("login")

    # 3. Locate workspace
    import os
    from app.utils.repo_analyzer import run_cmd_async, WORKSPACES_DIR
    repo_short_name = req.repo_name.split('/')[-1] if '/' in req.repo_name else req.repo_name
    repo_dir = os.path.join(WORKSPACES_DIR, f"{github_username}_{repo_short_name}")
    if not os.path.exists(repo_dir):
        raise HTTPException(status_code=404, detail="Local repository workspace not found")

    branch_name = f"fix/issue-{req.issue_number}"

    # 4. Push local branch to user's fork (origin)
    code, out, err = await run_cmd_async(f"git push origin {branch_name}", cwd=repo_dir)
    if code != 0:
        raise HTTPException(status_code=500, detail=f"Failed to push branch to GitHub: {err}")

    # 5. Get default branch of upstream repo to know where to open the PR against
    code, def_branch_out, err = await run_cmd_async("git symbolic-ref refs/remotes/upstream/HEAD", cwd=repo_dir)
    default_branch = "main"
    if code == 0:
         default_branch = def_branch_out.strip().split('/')[-1]
    else:
        # Fallback to checking origin if upstream remote isn't set
        code, def_branch_out, err = await run_cmd_async("git symbolic-ref refs/remotes/origin/HEAD", cwd=repo_dir)
        if code == 0:
             default_branch = def_branch_out.strip().split('/')[-1]

    # 6. Create PR via GitHub API
    pr_payload = {
        "title": req.title,
        "body": req.body,
        "head": f"{github_username}:{branch_name}", # User's fork namespace
        "base": default_branch
    }
    
    headers = {
        "Authorization": f"Bearer {decrypted_pat}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    pr_res = req_http.post(f"https://api.github.com/repos/{req.repo_name}/pulls", headers=headers, json=pr_payload)
    
    if pr_res.status_code not in (201, 422): # 422 means PR might already exist
        raise HTTPException(status_code=pr_res.status_code, detail=f"Failed to create PR: {pr_res.text}")

    # 7. Update Contributions DB
    contrib = db.query(models.Contributions).filter(
        models.Contributions.user_email == req.user_email,
        models.Contributions.repo_name == req.repo_name,
        models.Contributions.issue_number == req.issue_number
    ).first()

    if contrib:
        contrib.status = "Submitted"
        contrib.pr_sent = True
    else:
        new_contrib = models.Contributions(
            user_email=req.user_email,
            repo_name=req.repo_name,
            issue_number=req.issue_number,
            issue_title=req.title or f"Issue #{req.issue_number}",
            language="Unknown",
            status="Submitted",
            pr_sent=True
        )
        db.add(new_contrib)

    # Finally, mark progress DB as PR completed
    prog = db.query(models.ContributionProgress).filter(
        models.ContributionProgress.user_email == req.user_email,
        models.ContributionProgress.repo_name == req.repo_name,
        models.ContributionProgress.issue_number == req.issue_number
    ).first()
    if prog:
        prog.pr_status = "submitted"

    db.commit()

    return {"detail": "PR submitted successfully", "html_url": pr_res.json().get("html_url") if pr_res.status_code == 201 else None}

@routes.get("/draft-pr-diff")
async def get_draft_pr_diff(
    user_email: str = Query(...),
    repo_name: str = Query(...),
    issue_number: int = Query(...),
    db: Session = Depends(get_db)
):
    from app.utils.repo_analyzer import get_local_diff_stat, get_local_diff_patch
    diff_stat = await get_local_diff_stat(repo_name, issue_number, user_email, db)
    diff_patch = await get_local_diff_patch(repo_name, issue_number, user_email, db)
    return {"diff_stat": diff_stat, "diff_patch": diff_patch}

