from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models as models
import app.schemas as schemas
from database import get_db

routes = APIRouter(prefix="/progress", tags=["Contribution Progress"])

@routes.get("/{user_email}/{repo_name:path}/{issue_number}", response_model=schemas.ProgressResponse)
def get_progress(user_email: str, repo_name: str, issue_number: int, db: Session = Depends(get_db)):
    """Fetch saved progress for a user contributing to a specific issue."""
    progress = db.query(models.ContributionProgress).filter(
        models.ContributionProgress.user_email == user_email,
        models.ContributionProgress.repo_name == repo_name,
        models.ContributionProgress.issue_number == issue_number
    ).first()

    if not progress:
        # If no progress found, return an empty template
        return schemas.ProgressResponse(
            user_email=user_email,
            repo_name=repo_name,
            issue_number=issue_number,
            issue_summary="",
            final_approach="",
            git_commands="",
            test_results="",
            chat_history="[]",
            fork_status="pending",
            fork_vscode_url=None,
            pr_title=None,
            pr_body=None
        )
    
    return schemas.ProgressResponse(
        user_email=progress.user_email,
        repo_name=progress.repo_name,
        issue_number=progress.issue_number,
        issue_summary=progress.issue_summary or "",
        final_approach=progress.final_approach or "",
        git_commands=progress.git_commands or "",
        test_results=progress.test_results or "",
        chat_history=progress.chat_history or "[]",
        fork_status=progress.fork_status or "pending",
        fork_vscode_url=progress.fork_vscode_url,
        pr_title=progress.pr_title,
        pr_body=progress.pr_body
    )

@routes.post("/", response_model=schemas.ProgressResponse)
def save_progress(req: schemas.SaveProgressRequest, db: Session = Depends(get_db)):
    """Save or update progress for an issue contribution."""
    progress = db.query(models.ContributionProgress).filter(
        models.ContributionProgress.user_email == req.user_email,
        models.ContributionProgress.repo_name == req.repo_name,
        models.ContributionProgress.issue_number == req.issue_number
    ).first()

    if progress:
        # Update existing Record — only overwrite fields that are explicitly provided
        if req.issue_summary is not None:
            progress.issue_summary = req.issue_summary
        if req.final_approach is not None:
            progress.final_approach = req.final_approach
        if req.git_commands is not None:
            progress.git_commands = req.git_commands
        if req.test_results is not None:
            progress.test_results = req.test_results
        if req.chat_history is not None:
            progress.chat_history = req.chat_history
        if req.fork_status:
            progress.fork_status = req.fork_status
        if req.fork_vscode_url:
            progress.fork_vscode_url = req.fork_vscode_url
        if req.pr_title is not None:
            progress.pr_title = req.pr_title
        if req.pr_body is not None:
            progress.pr_body = req.pr_body
    else:
        # Create a new Record
        progress = models.ContributionProgress(
            user_email=req.user_email,
            repo_name=req.repo_name,
            issue_number=req.issue_number,
            issue_summary=req.issue_summary,
            final_approach=req.final_approach,
            git_commands=req.git_commands,
            test_results=req.test_results,
            chat_history=req.chat_history,
            fork_status=req.fork_status or "pending",
            fork_vscode_url=req.fork_vscode_url,
            pr_title=req.pr_title,
            pr_body=req.pr_body
        )
        db.add(progress)

    # Ensure Contributions entry exists to track dashboard status
    contrib = db.query(models.Contributions).filter(
        models.Contributions.user_email == req.user_email,
        models.Contributions.repo_name == req.repo_name,
        models.Contributions.issue_number == req.issue_number
    ).first()

    if contrib:
        # Only set to Currently Working if a PR hasn't already been sent
        if not contrib.pr_sent:
            contrib.status = "Currently Working"
    else:
        new_contrib = models.Contributions(
            user_email=req.user_email,
            repo_name=req.repo_name,
            issue_number=req.issue_number,
            issue_title=req.issue_title or f"Issue #{req.issue_number}",
            language=req.language or "Unknown",
            status="Currently Working",
            pr_sent=False
        )
        db.add(new_contrib)

    db.commit()
    db.refresh(progress)

    return schemas.ProgressResponse(
        user_email=progress.user_email,
        repo_name=progress.repo_name,
        issue_number=progress.issue_number,
        issue_summary=progress.issue_summary or "",
        final_approach=progress.final_approach or "",
        git_commands=progress.git_commands or "",
        test_results=progress.test_results or "",
        chat_history=progress.chat_history or "[]",
        fork_status=progress.fork_status or "pending",
        fork_vscode_url=progress.fork_vscode_url,
        pr_title=progress.pr_title,
        pr_body=progress.pr_body
    )
