import re

from chat_agent.language import _preferred_language
from chat_agent.schemas import ChatResponse, ConversationMessage


DISPOSAL_METHOD_GUIDE = [
    {
        "method": "Biotonne",
        "use_for": (
            "Organic kitchen and garden waste: fruit and vegetable scraps, cooked or raw food scraps, "
            "bread, coffee grounds, filters, flowers, leaves, grass, and small branches."
        ),
        "do_not_use_for": (
            "Plastic bags, compostable plastic bio-bags, dog feces, cat litter, or small animal litter."
        ),
    },
    {
        "method": "Papiertonne",
        "use_for": "Clean paper, newspapers, envelopes, books without covers, folded cardboard, and paper bags.",
        "do_not_use_for": (
            "Dirty paper, hygiene paper, wallpaper, backing paper from self-adhesive foils, "
            "beverage cartons, or coated dairy cartons."
        ),
    },
    {
        "method": "Wertstoffinseln",
        "use_for": (
            "Empty packaging made of glass, plastic, metal, or composite materials, such as jars, "
            "non-deposit bottles, yoghurt cups, shampoo bottles, cans, aluminium trays, foils, lids, "
            "milk cartons, and beverage cartons."
        ),
        "do_not_use_for": (
            "Deposit bottles or cans, electronics, batteries, ceramics, window glass, mirrors, "
            "drinking glasses, or non-packaging household items unless an exact selected rule says so."
        ),
    },
    {
        "method": "Restmuelltonne",
        "use_for": (
            "Non-recyclable household waste without a dedicated Munich collection route, such as dirty paper, "
            "hygiene products, backing paper, and contaminated small household waste."
        ),
        "do_not_use_for": "Batteries, electronics, problem waste, recyclable packaging, paper, glass, or organic waste.",
    },
    {
        "method": "Wertstoffhof",
        "use_for": (
            "Electronics, large or special recyclable items, bulky waste, rechargeable or lithium batteries, "
            "LED lamps, larger amounts of cardboard or garden cuttings, and items that need special handling."
        ),
        "do_not_use_for": (
            "Normal daily household waste when a closer bin or Wertstoffinsel route is clearly available."
        ),
    },
    {
        "method": "Retail take-back / collection boxes",
        "use_for": (
            "Deposit bottles and cans, batteries in shops that sell batteries, and electronics where legal "
            "retail take-back is offered."
        ),
        "do_not_use_for": "General household waste.",
    },
    {
        "method": "Giftmobil / problem waste",
        "use_for": (
            "Hazardous or problem waste such as chemicals, solvents, pesticides, acids, mercury thermometers, "
            "paint-related hazardous residues, and damaged high-risk batteries when accepted."
        ),
        "do_not_use_for": "Normal residual waste, packaging, paper, or organic waste.",
    },
]

FALLBACK_SCENARIOS = [
    {
        "name": "pizza box",
        "patterns": [
            r"\bpizza\s+(box|boxes|boxen|carton|cartons|cardboard)\b",
            r"\bpizzakarton(s|e|en)?\b",
        ],
        "response_en": (
            "For a pizza box in Munich: put clean or only slightly soiled cardboard in Papiertonne. "
            "If it is greasy or food-stained, use Restmuelltonne. Put leftover food in Biotonne."
        ),
        "response_de": (
            "Ein Pizzakarton gehört in München sauber oder nur leicht verschmutzt in die Papiertonne. "
            "Wenn er fettig oder mit Essensresten verschmutzt ist, gehört er in die Restmuelltonne. "
            "Essensreste gehören in die Biotonne."
        ),
    },
    {
        "name": "broken glass",
        "patterns": [
            r"\bbroken\s+(glass|drinking\s+glass|cup|mirror)\b",
            r"\bshattered\s+glass\b",
            r"\bkaputtes\s+glas\b",
            r"\bscherben\b",
        ],
        "response_en": (
            "Broken glass is not automatically glass packaging. In Munich, empty glass bottles and jars without "
            "deposit go to Wertstoffinseln, but broken drinking glasses, mirrors, ceramics, and window glass do "
            "not. Small broken drinking glass usually belongs in Restmuelltonne; window glass, mirrors, or larger "
            "special glass should go to Wertstoffhof."
        ),
        "response_de": (
            "Kaputtes Glas ist nicht automatisch Verpackungsglas. In München gehören leere Glasflaschen und "
            "Gläser ohne Pfand zu den Wertstoffinseln, aber Trinkgläser, Spiegel, Keramik und Fensterglas nicht. "
            "Kleine Trinkglasscherben gehören meist in die Restmuelltonne; Fensterglas, Spiegel oder größere "
            "Spezialgläser zum Wertstoffhof."
        ),
    },
    {
        "name": "plastic cup packaging",
        "patterns": [
            r"\b(yoghurt|yogurt|joghurt)\s+(cup|container|becher)\b",
            r"\bplastic\s+(cup|container|packaging)\b",
        ],
        "response_en": (
            "A yogurt cup is plastic packaging. In Munich, empty plastic packaging goes to Wertstoffinseln. "
            "It should be empty, but it does not need to be perfectly rinsed."
        ),
        "response_de": (
            "Ein Joghurtbecher ist Kunststoffverpackung. In München gehört leere Kunststoffverpackung zu den "
            "Wertstoffinseln. Sie sollte leer sein, muss aber nicht perfekt ausgespült werden."
        ),
    },
    {
        "name": "old clothes",
        "patterns": [r"\bold\s+(clothes|clothing|shoes|textiles)\b", r"\baltkleider\b", r"\balte\s+kleidung\b"],
        "response_en": (
            "Old clothes should not go in Restmuelltonne if they are clean and still wearable. In Munich, use "
            "AWM Altkleidercontainer, Wertstoffhof, charity collections, or second-hand options. Only broken or "
            "heavily soiled textiles belong in Restmuelltonne."
        ),
        "response_de": (
            "Alte Kleidung gehört nicht in die Restmuelltonne, wenn sie sauber und noch tragbar ist. In München "
            "nutzt du AWM Altkleidercontainer, Wertstoffhof, soziale Sammlungen oder Second-Hand. Nur kaputte "
            "oder stark verschmutzte Textilien gehören in die Restmuelltonne."
        ),
    },
    {
        "name": "led bulb",
        "patterns": [
            r"\bled\s+(bulb|bulbs|lamp|lamps|light|lights)\b",
            r"\benergy[-\s]?saving\s+(lamp|lamps|bulb|bulbs)\b",
            r"\bled[-\s]?lampe\b",
        ],
        "response_en": (
            "LED lamps and energy-saving lamps must not go in Restmuelltonne or glass containers. In Munich, "
            "take them to Wertstoffhof; small quantities may also be accepted by Giftmobil, Wertstoffmobil, or "
            "retail take-back points."
        ),
        "response_de": (
            "LED-Lampen und Energiesparlampen gehören nicht in die Restmuelltonne und nicht in Glascontainer. "
            "In München gehören sie zum Wertstoffhof; kleine Mengen können auch bei Giftmobil, Wertstoffmobil "
            "oder passenden Rücknahmestellen abgegeben werden."
        ),
    },
    {
        "name": "medicine",
        "patterns": [r"\b(medicine|medication|pills|tablets)\b", r"\bmedikamente\b", r"\barzneimittel\b"],
        "response_en": (
            "Medicines belong in Restmuelltonne in Munich. Do not flush them down the toilet or sink. Keep them "
            "safely packed; for special or hazardous medicines, use pharmacy or medical guidance."
        ),
        "response_de": (
            "Medikamente gehören in München in die Restmuelltonne. Bitte nicht in Toilette oder Waschbecken "
            "schütten. Sicher verpacken; bei besonderen oder gefährlichen Medikamenten Apotheke oder "
            "medizinische Hinweise beachten."
        ),
    },
    {
        "name": "beverage carton",
        "patterns": [
            r"\b(milk|juice|beverage)\s+carton\b",
            r"\btetra\s?pak\b",
            r"\bmilchkarton\b",
            r"\bgetraenkekarton\b",
            r"\bgetränkekarton\b",
        ],
        "response_en": (
            "Milk cartons, beverage cartons, and other composite packaging belong at Wertstoffinseln in Munich, "
            "not in Papiertonne. Empty the packaging before disposal."
        ),
        "response_de": (
            "Milchkartons, Getränkekartons und andere Verbundverpackungen gehören in München zu den "
            "Wertstoffinseln, nicht in die Papiertonne. Vorher leeren."
        ),
    },
]

CATEGORY_ALIASES = {
    "Organic kitchen and garden waste": [
        "sandwich",
        "leftovers",
        "food scraps",
        "food waste",
        "meal scraps",
        "cooked food",
        "raw food",
        "bread",
        "bread roll",
        "belegtes brot",
        "brot",
        "broetchen",
        "brötchen",
        "obstrest",
        "gemueserest",
        "gemüserest",
        "speiserest",
        "kaffeesatz",
        "coffee grounds",
    ],
    "Small electronic devices": [
        "airpods",
        "earbuds",
        "headphones",
        "earphones",
        "charger",
        "charging cable",
        "usb cable",
        "remote control",
        "smartphone",
        "phone",
        "tablet",
        "laptop",
        "kopfhoerer",
        "kopfhörer",
        "ladekabel",
        "fernbedienung",
        "handy",
    ],
    "Batteries and button cells": [
        "battery",
        "batteries",
        "button cell",
        "aa battery",
        "aaa battery",
        "batterie",
        "batterien",
        "knopfzelle",
    ],
    "Rechargeable batteries and lithium batteries": [
        "lithium battery",
        "rechargeable battery",
        "power bank",
        "akku",
        "akkus",
        "lithium akku",
    ],
    "Paper and cardboard": [
        "clean cardboard",
        "cardboard box",
        "newspaper",
        "envelope",
        "paper bag",
        "clean paper",
        "karton",
        "pappe",
        "zeitung",
        "briefumschlag",
    ],
    "Residual household waste": [
        "dirty paper",
        "dirty cardboard",
        "used tissue",
        "hygiene paper",
        "diaper",
        "broken mug",
        "ceramic mug",
        "kaputte tasse",
        "keramik",
        "windel",
        "taschentuch",
        "verschmutztes papier",
    ],
    "Plastic packaging": [
        "plastic packaging",
        "yoghurt cup",
        "shampoo bottle",
        "detergent bottle",
        "plastic wrapper",
        "verpackungsfolie",
        "kunststoffverpackung",
        "joghurtbecher",
    ],
    "Metal packaging": [
        "aluminium foil",
        "aluminium tray",
        "metal lid",
        "tin can without deposit",
        "alufolie",
        "aluschale",
        "metalldeckel",
    ],
    "Glass packaging": [
        "glass jar",
        "jar without deposit",
        "jam jar",
        "einwegglas",
        "marmeladenglas",
    ],
    "Clothing, shoes, and textiles": [
        "clothes",
        "clothing",
        "shoes",
        "textiles",
        "shirt",
        "jeans",
        "kleidung",
        "schuhe",
        "textilien",
    ],
    "Bulky waste": [
        "furniture",
        "mattress",
        "carpet",
        "chair",
        "table",
        "sofa",
        "moebel",
        "möbel",
        "matratze",
        "teppich",
    ],
    "Paint, wall paint, and varnish": [
        "paint",
        "wall paint",
        "varnish",
        "farbe",
        "wandfarbe",
        "lack",
    ],
    "Chemicals and hazardous problem waste": [
        "chemicals",
        "solvent",
        "pesticide",
        "acid",
        "mercury thermometer",
        "hazardous waste",
        "chemikalien",
        "loesungsmittel",
        "lösungsmittel",
        "quecksilberthermometer",
    ],
    "Medicines and pharmaceuticals": [
        "medicine",
        "medication",
        "pills",
        "tablets",
        "pharmaceuticals",
        "medikamente",
        "arzneimittel",
        "tabletten",
    ],
    "E-cigarettes and vapes": [
        "vape",
        "vapes",
        "e-cigarette",
        "e-cigarettes",
        "elfbar",
        "e-zigarette",
        "einweg-e-zigarette",
    ],
}


def _disposal_method_guide_text() -> str:
    lines = []
    for entry in DISPOSAL_METHOD_GUIDE:
        lines.append(
            f"- {entry['method']}: use for {entry['use_for']} Do not use for {entry['do_not_use_for']}"
        )
    return "\n".join(lines)


def _fallback_rule_response(
    message: str,
    response_language: str | None = None,
    conversation_history: list[ConversationMessage] | None = None,
) -> ChatResponse | None:
    query = message.casefold()
    for scenario in FALLBACK_SCENARIOS:
        if any(re.search(pattern, query) for pattern in scenario["patterns"]):
            language = response_language or _preferred_language(message, conversation_history or [])
            response_key = "response_de" if language == "de" else "response_en"
            return ChatResponse(response=scenario[response_key], suggested_location=None)

    return None
