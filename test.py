import httpx
import asyncio
import json # ADDED: for pretty formatting
from issue_fetcher import fetch_issue 

async def test_github_pat(pat: str):
    headers = {
        "Authorization": f"token {pat}", 
        "Accept": "application/vnd.github.v3+json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.github.com/user", headers=headers)

    if response.status_code == 200:
        print(f"✅ Success! Logged in as: {response.json().get('login')}")
        
        print("Fetching Lyra issues...")
        # Capture the returned data from your fetch_issue function
        issues_data = await fetch_issue("google", "lyra", pat)
        
        # SAVE AS CLEAN JSON FILE
        with open("issues.json", "w") as f:
            json.dump(issues_data, f, indent=4)
            refined_issue = [fetch_issue.issues["url"]for refined_isuue in fetch_issue.issues] 
            refined_issue = refined_issue.replace("https://api.github.com/repos/","http://github.com/")

        
        print("🚀 Done! Check 'issues.json' for the formatted data.")
        print()
        return refined_issue
    else:
        print(f"❌ Failed! Status Code: {response.status_code}")
        return False
token_to_test = "your_actual_ghp_token_here"
asyncio.run(test_github_pat(token_to_test))