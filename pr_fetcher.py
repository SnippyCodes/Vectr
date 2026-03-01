import httpx
from fastapi import HTTPException

async def fetch_prs(org_name: str, repo_name: str, pat: str):
    # API endpoint for Pull Requests
    url = f"https://api.github.com/repos/{org_name}/{repo_name}/pulls"
    
    headers = {
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    params = {
        "state": "open",    # Can be 'open', 'closed', or 'all'
        "sort": "created",
        "direction": "desc",
        "per_page": 10
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"GitHub PR Error: {response.text}"
            )

        pr_list = response.json()
        results = []

        for pr in pr_list:
            # PRs have two types of comments: 
            # 1. Issue-style comments (general discussion)
            # 2. Review comments (specific code line feedback)
            
            # Fetching general discussion messages
            comments_resp = await client.get(pr["comments_url"], headers=headers)
            comments = comments_resp.json() if comments_resp.status_code == 200 else []
            
            results.append({
                "pr_number": pr["number"],
                "title": pr["title"],
                "state": pr["state"],
                "author": pr["user"]["login"],
                "url": pr["html_url"], # Use html_url for the browser link
                "base_branch": pr["base"]["ref"],
                "body": pr["body"],
                "messages": [c["body"] for c in comments]
            })
            
        return results