import os
import re
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
import httpx

router = APIRouter(prefix="/api/ai", tags=["AI Concierge"])

class ConciergeRequest(BaseModel):
    message: str = Field(..., max_length=500, description="Natural language search prompt")

class ConciergeCriteria(BaseModel):
    destination: Optional[str] = None
    region: Optional[str] = None
    guests: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    category: Optional[str] = None
    amenities: List[str] = []
    preferences: List[str] = []
    sort_preference: Optional[str] = None

class ConciergeResponse(BaseModel):
    criteria: Optional[ConciergeCriteria] = None
    message: str

def parse_locally(prompt: str) -> dict:
    prompt_lower = prompt.lower()
    
    # Validation / Length Check
    if not prompt.strip() or len(prompt.strip()) < 3:
        return {
            "error": "clarification_required",
            "message": "Please type a search query describing your destination, budget, or preferred stay style."
        }
        
    if len(prompt) > 200:
        return {
            "error": "validation_error",
            "message": "Your request is too long. Please keep it under 200 characters."
        }

    # Ambiguity check: if it lacks key search qualifiers, ask for clarification
    has_destination = any(w in prompt_lower for w in [
        "srinagar", "manali", "jaipur", "udaipur", "rishikesh", "goa", "hyderabad", 
        "kochi", "ooty", "alleppey", "mumbai", "kerala", "florence", "kyoto", 
        "cape town", "ubud", "india", "italy", "japan", "france", "australia", "phuket", "costa rica"
    ])
    has_category = any(w in prompt_lower for w in ["cabin", "houseboat", "villa", "mansion", "palace", "loft", "apartment", "townhouse", "haveli", "dome", "cottage"])
    has_price = any(w in prompt_lower for w in ["under", "max", "below", "budget", "rupees", "inr", "₹", "price", "k"]) or re.search(r'\d+', prompt_lower) is not None
    has_guests = any(w in prompt_lower for w in ["guest", "people", "person", "adult", "couple", "single", "family", "for two", "for 2", "for 4", "for four"])

    if not (has_destination or has_category or has_price or has_guests):
        return {
            "error": "clarification_required",
            "message": "Tell me a little more — where would you like to go, and roughly how much would you like to spend?"
        }

    # Extract Destination
    destination = None
    destinations = [
        "Srinagar", "Manali", "Jaipur", "Udaipur", "Rishikesh", "Goa", "Hyderabad", 
        "Kochi", "Ooty", "Alleppey", "Mumbai", "Kerala", "Florence", "Kyoto", 
        "Cape Town", "Ubud", "Phuket"
    ]
    for dest in destinations:
        if dest.lower() in prompt_lower:
            destination = dest
            break

    # Extract Guests
    guests = None
    if "couple" in prompt_lower or "for two" in prompt_lower or "for 2" in prompt_lower or "two people" in prompt_lower or "2 people" in prompt_lower:
        guests = 2
    elif "single" in prompt_lower or "for one" in prompt_lower or "for 1" in prompt_lower or "1 person" in prompt_lower or "one person" in prompt_lower:
        guests = 1
    else:
        guest_match = re.search(r'(\d+)\s*(guest|people|person|adult)', prompt_lower)
        if guest_match:
            guests = int(guest_match.group(1))

    # Extract Price
    max_price = None
    # Parse '8k' or '10k' formats
    k_match = re.search(r'(?:under|max|below|budget|price|within|up to|₹)?\s*(\d+)\s*k\b', prompt_lower)
    if k_match:
        max_price = float(k_match.group(1)) * 1000.0
    else:
        # Parse exact numeric values like 'under 7000'
        num_match = re.search(r'(?:under|max|below|budget|price|within|up to|₹)\s*(\d+[\d,]*)\b', prompt_lower)
        if num_match:
            raw_num = num_match.group(1).replace(",", "")
            max_price = float(raw_num)

    # Category Mapping
    category = None
    if any(w in prompt_lower for w in ["cabin", "chalet", "timber", "mountain", "wood"]):
        category = "Cabins"
    elif any(w in prompt_lower for w in ["beach", "beachfront", "sea", "ocean", "houseboat", "lagoon", "backwater"]):
        category = "Beachfront"
    elif any(w in prompt_lower for w in ["mansion", "palace", "estate", "castle", "luxury villa"]):
        category = "Mansions"
    elif any(w in prompt_lower for w in ["loft", "apartment", "skyline", "penthouse", "studio"]):
        category = "Lofts"
    elif any(w in prompt_lower for w in ["townhouse", "haveli", "home", "cottage"]):
        category = "Townhouses"
    elif any(w in prompt_lower for w in ["dome", "geometric"]):
        category = "Domes"

    # Extract Preferences
    preferences = []
    descriptors = ["peaceful", "quiet", "luxury", "nature", "yoga", "skyline", "lake", "view", "forest", "meditation", "beach", "mountain"]
    for desc in descriptors:
        if desc in prompt_lower:
            preferences.append(desc)

    return {
        "destination": destination,
        "guests": guests,
        "max_price": max_price,
        "category": category,
        "preferences": preferences
    }

@router.post("/concierge", response_model=ConciergeResponse)
async def ai_concierge(req: ConciergeRequest):
    prompt = req.message.strip()
    
    # 1. Validation / Length check
    if not prompt or len(prompt) < 3:
        return ConciergeResponse(
            message="Please type a search query describing your destination, budget, or preferred stay style."
        )
    if len(prompt) > 200:
        return ConciergeResponse(
            message="Your request is too long. Please keep it under 200 characters."
        )

    # 2. Check for Gemini or OpenAI API keys
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            system_instruction = (
                "Parse this user query into a JSON object matching this schema: "
                "{\"destination\": str|null, \"guests\": int|null, \"max_price\": float|null, \"category\": str|null, \"preferences\": [str]}.\n\n"
                "Do not invent values. Category must map to one of: \"Beachfront\", \"Cabins\", \"Lofts\", \"Townhouses\", \"Mansions\", \"Domes\".\n\n"
                "If the query is extremely ambiguous or does not contain search criteria (e.g. 'hi', 'somewhere nice'), "
                "return: {\"error\": \"clarification_required\", \"message\": \"Tell me a little more — where would you like to go, and roughly how much would you like to spend?\"}."
            )
            payload = {
                "contents": [{"parts": [{"text": f"{system_instruction}\n\nUser query: \"{prompt}\""}]}],
                "generationConfig": {"responseMimeType": "application/json"}
            }
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, timeout=8.0)
                if res.status_code == 200:
                    data = res.json()
                    text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                    import json
                    parsed_json = json.loads(text_response)
                    
                    if "error" in parsed_json:
                        return ConciergeResponse(message=parsed_json["message"])
                        
                    criteria = ConciergeCriteria(
                        destination=parsed_json.get("destination"),
                        guests=parsed_json.get("guests"),
                        max_price=parsed_json.get("max_price"),
                        category=parsed_json.get("category"),
                        preferences=parsed_json.get("preferences", [])
                    )
                    return ConciergeResponse(
                        criteria=criteria,
                        message="I have interpreted your query to match these filters."
                    )
        except Exception as e:
            # Fall back to local parser if Gemini call fails
            pass

    elif openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}"}
            system_prompt = (
                "You are an assistant. Parse the query into a JSON object matching this schema: "
                "{\"destination\": str|null, \"guests\": int|null, \"max_price\": float|null, \"category\": str|null, \"preferences\": [str]}.\n\n"
                "Do not invent values. Category must map to one of: \"Beachfront\", \"Cabins\", \"Lofts\", \"Townhouses\", \"Mansions\", \"Domes\".\n\n"
                "If the query is extremely ambiguous or does not contain search criteria (e.g. 'hi', 'somewhere nice'), "
                "return: {\"error\": \"clarification_required\", \"message\": \"Tell me a little more — where would you like to go, and roughly how much would you like to spend?\"}."
            )
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"}
            }
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json=payload, headers=headers, timeout=8.0)
                if res.status_code == 200:
                    data = res.json()
                    text_response = data["choices"][0]["message"]["content"]
                    import json
                    parsed_json = json.loads(text_response)
                    
                    if "error" in parsed_json:
                        return ConciergeResponse(message=parsed_json["message"])
                        
                    criteria = ConciergeCriteria(
                        destination=parsed_json.get("destination"),
                        guests=parsed_json.get("guests"),
                        max_price=parsed_json.get("max_price"),
                        category=parsed_json.get("category"),
                        preferences=parsed_json.get("preferences", [])
                    )
                    return ConciergeResponse(
                        criteria=criteria,
                        message="I have interpreted your query to match these filters."
                    )
        except Exception as e:
            # Fall back to local parser if OpenAI call fails
            pass

    # 3. Local NLP Fallback Parser
    local_res = parse_locally(prompt)
    if "error" in local_res:
        return ConciergeResponse(message=local_res["message"])

    criteria = ConciergeCriteria(
        destination=local_res.get("destination"),
        guests=local_res.get("guests"),
        max_price=local_res.get("max_price"),
        category=local_res.get("category"),
        preferences=local_res.get("preferences", [])
    )
    return ConciergeResponse(
        criteria=criteria,
        message="I found stays matching your preferences."
    )
