import os, re, json, urllib.parse
from datetime import datetime
import requests
import xml.etree.ElementTree as ET


def search_news(claim: str):
    query = urllib.parse.quote_plus(claim[:180])
    url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
    try:
        response = requests.get(
            url, timeout=12, headers={"User-Agent": "VeriScopeAI/1.0"}
        )
        response.raise_for_status()
        root = ET.fromstring(response.content)
        items = []
        for item in root.findall(".//item")[:6]:

            def value(tag):
                node = item.find(tag)
                return (node.text or "").strip() if node is not None else ""

            items.append(
                {
                    "title": value("title") or "Untitled",
                    "publisher": value("source") or "Google News",
                    "published": value("pubDate"),
                    "url": value("link"),
                }
            )
        return items
    except Exception:
        return []


def verify_with_gemini(claim: str, sources: list):
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "verdict": "UNVERIFIED",
            "confidence": 0,
            "reasoning": "Gemini API key is not configured. News coverage was collected where available, but an AI assessment could not be generated. Add GEMINI_API_KEY to backend/.env.",
            "ai_available": False,
        }
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    prompt = f"""You are an evidence-aware fact-checking assistant. Assess the user's claim using the supplied news search results as context. Do not invent sources or treat related coverage as proof. Choose REAL only when credible evidence supports the claim, FAKE only when credible evidence contradicts it, otherwise UNVERIFIED. Return ONLY valid JSON with keys verdict (REAL, FAKE, or UNVERIFIED), confidence (number 0 to 100), reasoning (2-4 clear sentences). Clearly state uncertainty. Claim: {claim[:8000]} News search results: {json.dumps(sources[:6], ensure_ascii=False)}"""
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    try:
        r = requests.post(
            endpoint,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json",
                },
            },
            timeout=45,
        )
        r.raise_for_status()
        raw = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(raw[raw.find("{") : raw.rfind("}") + 1])
        verdict = str(data.get("verdict", "UNVERIFIED")).upper()
        if verdict not in {"REAL", "FAKE", "UNVERIFIED"}:
            verdict = "UNVERIFIED"
        confidence = max(0, min(100, float(data.get("confidence", 0))))
        if verdict == "UNVERIFIED":
            confidence = min(confidence, 50)
        return {
            "verdict": verdict,
            "confidence": confidence,
            "reasoning": str(data.get("reasoning", "No explanation returned.")),
            "ai_available": True,
        }
    except Exception as exc:
        return {
            "verdict": "UNVERIFIED",
            "confidence": 0,
            "reasoning": f"AI verification could not be completed ({str(exc)[:180]}). Please try again later.",
            "ai_available": False,
        }


def analyze_claim(claim: str):
    sources = search_news(claim)
    assessment = verify_with_gemini(claim, sources)
    return {
        **assessment,
        "claim": claim,
        "sources": sources,
        "disclaimer": "AI-generated assessment, not definitive proof. Review original sources before sharing or acting on a claim.",
    }
