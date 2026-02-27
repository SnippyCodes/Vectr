import httpx
import asyncio
from fastapi import HTTPException

# ADDED 'repo_name' and 'pat' as arguments
async def fetch_issue(org_name: str, repo_name: str, pat: str):
    # FIXED: Added 'f' for f-string and corrected the path
    url = f"https://api.github.com/repos/{org_name}/{repo_name}/issues"
    
    headers = {
        # FIXED: Added 'f' for f-string to use the 'pat' variable
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    params = {
        "state": "open",           # FIXED: Added quotes around "open"
        "labels": "good first issue", # FIXED: GitHub API uses "labels" (plural)
        "sort": "created",
        "per_page": 50
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        global issues 
        issue = response.json()
        # Filter out Pull Requests (GitHub API treats PRs as issues)
        only_issues = [i for i in issues if "pull_request" not in i]
        print(f"Found {len(only_issues)} beginner issues in {repo_name}")
        
    

    elif response.status_code == 404:
        raise HTTPException(status_code=404, detail="Repository not found")
    else:
        # FIXED: Added f-string formatting for the error message
        raise HTTPException(status_code=response.status_code, detail=f"Github Error: {response.text}")

# Testing it for AOSSIE (using the 'adit' repository as an example)
token = "ghp_your_actual_token_here" 
# asyncio.run(fetch_issue("AOSSIE", "adit", token))