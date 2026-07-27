import json
import os
import requests
from typing import List, Dict, Optional

from dotenv import load_dotenv

def call_ai_engine(
    messages: List[Dict],
    system_prompt: Optional[str] = None,
    temperature: float = 0.5,
    max_tokens: int = 1500,
) -> str:
    """
    Unified AI engine router supporting Groq, OpenRouter, Google Gemini, Ollama, and AWS Bedrock.
    Defaults to Groq (Free & Blazing Fast) if available, or falls back gracefully.
    """
    load_dotenv(override=True)
    provider = os.getenv("AI_PROVIDER", "groq").lower().strip()

    formatted_messages = []
    if system_prompt:
        formatted_messages.append({"role": "system", "content": system_prompt})

    # Normalize messages structure (string vs Bedrock dict)
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if isinstance(content, list):
            # Extract text from list of dicts (e.g. Bedrock converse format)
            text_parts = [item.get("text", "") for item in content if isinstance(item, dict)]
            content = " ".join(text_parts) if text_parts else str(content)
        formatted_messages.append({"role": role, "content": str(content)})

    # --- 1. GROQ PROVIDER (Default / Recommended Free Option) ---
    if provider == "groq" or os.getenv("GROQ_API_KEY"):
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
        if groq_key:
            try:
                res = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": formatted_messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    timeout=45,
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"Groq API error ({res.status_code}): {res.text}")
            except Exception as e:
                print(f"Groq connection error: {e}")

    # --- 2. OPENROUTER PROVIDER (Free Models) ---
    if provider == "openrouter" or os.getenv("OPENROUTER_API_KEY"):
        or_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free").strip()
        if or_key:
            try:
                res = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {or_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://vectoropensource.me",
                        "X-Title": "Vectr AI Mentor",
                    },
                    json={
                        "model": model,
                        "messages": formatted_messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    timeout=45,
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"OpenRouter API error ({res.status_code}): {res.text}")
            except Exception as e:
                print(f"OpenRouter connection error: {e}")

    # --- 3. GOOGLE GEMINI PROVIDER (Free Tier API Key) ---
    if provider == "gemini" or os.getenv("GEMINI_API_KEY"):
        gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()
        if gemini_key:
            try:
                res = requests.post(
                    f"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    headers={
                        "Authorization": f"Bearer {gemini_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "messages": formatted_messages,
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                    timeout=45,
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    print(f"Gemini API error ({res.status_code}): {res.text}")
            except Exception as e:
                print(f"Gemini connection error: {e}")

    # --- 4. OLLAMA PROVIDER (100% Free & Local) ---
    if provider == "ollama":
        ollama_url = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/v1/chat/completions").strip()
        model = os.getenv("OLLAMA_MODEL", "llama3.2").strip()
        try:
            res = requests.post(
                ollama_url,
                headers={"Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": formatted_messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=60,
            )
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Ollama connection error: {e}")

    # --- 5. AWS BEDROCK (Optional Legacy Fallback) ---
    if provider == "bedrock" and os.getenv("AWS_ACCESS_KEY_ID"):
        try:
            import boto3

            client = boto3.client(
                service_name="bedrock-runtime",
                region_name=os.getenv("AWS_REGION", "us-east-1").strip(),
            )
            model_id = os.getenv("NOVA_MODEL_ID", "amazon.nova-lite-v1:0")

            system_payload = [{"text": system_prompt}] if system_prompt else []
            bedrock_messages = []
            for msg in formatted_messages:
                if msg["role"] != "system":
                    bedrock_messages.append(
                        {"role": msg["role"], "content": [{"text": msg["content"]}]}
                    )

            response = client.converse(
                modelId=model_id,
                messages=bedrock_messages,
                system=system_payload,
                inferenceConfig={"temperature": temperature},
            )
            return response["output"]["message"]["content"][0]["text"]
        except Exception as e:
            print(f"AWS Bedrock fallback error: {e}")

    # --- 6. DEMO / OFFLINE FALLBACK ---
    return (
        "Hello! I am Vectr AI Assistant. "
        "To enable full live AI responses, add a free API key to `backend/.env` "
        "(e.g., `GROQ_API_KEY=gsk_...` or `OPENROUTER_API_KEY=sk-or-...`)."
    )


def ask_nova_about_issues(
    catalog: List[Dict], user_message: str, chat_history: List[Dict] = None
) -> str:
    """
    Sends the GitHub Catalog as a System Prompt to the AI engine and processes the chat.
    """
    if chat_history is None:
        chat_history = []

    system_prompt = f"""
You are an AI Project Manager assisting a developer contributing to open source repositories. 
Below is a catalog of all open issues across the organization's repositories:

{json.dumps(catalog, indent=2)}

YOUR TASK:
1. Greet the user and ask what kind of work they are looking for (e.g., frontend, backend, bug fixes, features).
2. Recommend 2-3 specific issues from the catalog based on their preferences. 
3. When recommending an issue, format it clearly: **[RepoName] Issue #123:** Title.
4. If the user explicitly selects an issue, output a special exact string anywhere in your response: 
   "SELECTED_ISSUE: RepoName/#123" so the system knows they chose it. Do not use this string otherwise.
"""

    messages = chat_history + [{"role": "user", "content": user_message}]
    return call_ai_engine(messages=messages, system_prompt=system_prompt, temperature=0.5)
