import json
import re
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

ANALYZE_PROMPT = """You are MenuLens AI, an expert nutritionist and restaurant menu analyst.

Analyze this restaurant menu image and extract ALL visible dishes with nutritional estimates.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "restaurant_name": "name if visible or null",
  "cuisine_type": "Italian/Asian/American/Mexican/etc or null",
  "items": [
    {
      "name": "Dish Name",
      "description": "brief ingredient description",
      "section": "Appetizers/Mains/Desserts/Drinks/Sides/etc",
      "price": 12.99,
      "calories": 450,
      "protein_g": 35,
      "carbs_g": 42,
      "fat_g": 18,
      "fiber_g": 5,
      "allergens": ["dairy", "gluten", "nuts", "eggs", "shellfish", "fish", "soy"],
      "dietary_tags": ["vegetarian", "vegan", "keto", "paleo", "gluten-free", "low-carb"],
      "is_spicy": false,
      "confidence": "high"
    }
  ],
  "scan_notes": "any quality notes about the image or scan"
}

Rules:
- Estimate nutrition for typical restaurant portion sizes
- allergens: only include if likely present (dairy=cheese/butter/cream, gluten=bread/pasta/flour, nuts=peanuts/tree nuts, eggs, shellfish=shrimp/crab/lobster, fish=salmon/tuna/cod, soy=tofu/edamame/miso)
- dietary_tags: only include if clearly applicable based on ingredients
- confidence: "high" if dish is well described, "medium" if partial info, "low" if vague name only
- price: null if not visible
- Include ALL dishes visible in the menu, across all sections"""


async def analyze_menu(image_base64: str, media_type: str = "image/jpeg") -> dict:
    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_base64,
                    }
                },
                {
                    "type": "text",
                    "text": ANALYZE_PROMPT
                }
            ]
        }]
    )

    text = response.content[0].text
    text = re.sub(r'^```(?:json)?\s*\n?', '', text.strip(), flags=re.MULTILINE)
    text = re.sub(r'\n?```\s*$', '', text.strip(), flags=re.MULTILINE)

    return json.loads(text.strip())


def calculate_fit_score(item: dict, profile: dict) -> tuple[int, str]:
    allergens_to_avoid = set(profile.get("allergens", []))
    goal = profile.get("goal", "none")
    diet_type = profile.get("diet_type", "none")

    item_allergens = set(item.get("allergens", []))
    blocking = allergens_to_avoid & item_allergens
    if blocking:
        label = next(iter(blocking))
        return 0, f"Contains {label}"

    dietary_tags = item.get("dietary_tags", [])
    if diet_type == "vegan" and "vegan" not in dietary_tags:
        return 5, "Not vegan"
    if diet_type == "vegetarian" and "vegetarian" not in dietary_tags and "vegan" not in dietary_tags:
        return 5, "Not vegetarian"

    score = 65
    calories = item.get("calories", 500)
    protein = item.get("protein_g", 20)
    carbs = item.get("carbs_g", 40)
    fat = item.get("fat_g", 20)

    if goal == "weight_loss":
        if calories <= 350:
            score += 25
        elif calories <= 550:
            score += 10
        elif calories > 750:
            score -= 25
        if protein >= 25:
            score += 10

    elif goal == "muscle_gain":
        if protein >= 35:
            score += 30
        elif protein >= 25:
            score += 15
        elif protein < 15:
            score -= 20
        if calories >= 500:
            score += 5

    elif goal == "keto":
        if carbs <= 10:
            score += 30
        elif carbs <= 20:
            score += 15
        elif carbs > 30:
            score -= 35
        if fat >= 25:
            score += 10

    elif goal == "low_carb":
        if carbs <= 20:
            score += 25
        elif carbs <= 35:
            score += 10
        elif carbs > 50:
            score -= 20

    score = max(0, min(100, score))

    if score >= 80:
        reason = "Great match"
    elif score >= 65:
        reason = "Good match"
    elif score >= 40:
        reason = "Moderate"
    else:
        reason = "Poor match"

    return score, reason


def apply_fit_scores(menu_data: dict, profile: dict) -> dict:
    if not profile or not menu_data.get("items"):
        for item in menu_data.get("items", []):
            item["fit_score"] = 70
            item["fit_reason"] = "Set a goal in profile"
        return menu_data

    for item in menu_data["items"]:
        score, reason = calculate_fit_score(item, profile)
        item["fit_score"] = score
        item["fit_reason"] = reason

    menu_data["items"].sort(key=lambda x: x.get("fit_score", 50), reverse=True)
    return menu_data
