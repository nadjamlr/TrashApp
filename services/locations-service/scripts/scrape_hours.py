#!/usr/bin/env python3
"""
Scraper for AWM München Wertstoffhof opening hours.
Run from the repo root:
    python services/locations-service/scripts/scrape_hours.py

Output: data/wertstoffhof_hours.yaml
"""
import re
import ssl
import urllib.request
import urllib.error
from pathlib import Path

_ssl_ctx = ssl._create_unverified_context()

BASE_URL = "https://www.awm-muenchen.de"
OVERVIEW_URL = f"{BASE_URL}/abfall-entsorgen/abgabestellen/wertstoffhoefe"
OUTPUT = Path(__file__).parents[3] / "data" / "wertstoffhof_hours.yaml"

DAYS_DE = {
    "montag":     "monday",
    "dienstag":   "tuesday",
    "mittwoch":   "wednesday",
    "donnerstag": "thursday",
    "freitag":    "friday",
    "samstag":    "saturday",
    "sonntag":    "sunday",
}

DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15, context=_ssl_ctx) as resp:
        return resp.read().decode("utf-8")


def parse_cards(html: str) -> list[dict]:
    cards = []
    for m in re.finditer(
        r'class="address_card[^"]*"[^>]*data-url="([^"]+)".*?'
        r'class="wshtitel">([^<]+)</div>.*?'
        r'class="adresse">([^<]+)</div>',
        html, re.DOTALL
    ):
        cards.append({
            "url": BASE_URL + m.group(1),
            "name": m.group(2).strip(),
            "address": m.group(3).strip(),
        })
    return cards


def parse_time(raw: str) -> str:
    """Convert '10:30 bis 19:00 Uhr' → '10:30 - 19:00'."""
    m = re.search(r"(\d{1,2}:\d{2})\s+bis\s+(\d{1,2}:\d{2})", raw)
    if m:
        return f"{m.group(1)} - {m.group(2)}"
    return raw.strip()


def expand_range(label: str) -> list[str]:
    """'Dienstag - Freitag' → ['tuesday', 'wednesday', 'thursday', 'friday']"""
    parts = [p.strip().lower() for p in re.split(r"\s*[-–]\s*", label)]
    if len(parts) == 1:
        return [DAYS_DE[parts[0]]] if parts[0] in DAYS_DE else []
    if len(parts) == 2 and parts[0] in DAYS_DE and parts[1] in DAYS_DE:
        start = DAY_ORDER.index(DAYS_DE[parts[0]])
        end = DAY_ORDER.index(DAYS_DE[parts[1]])
        return DAY_ORDER[start:end + 1]
    return []


def parse_hours(html: str) -> dict:
    hours: dict[str, str] = {d: "closed" for d in DAY_ORDER}
    for m in re.finditer(
        r'class="titel">([^<:]+):\s*<span class="zeit">([^<]+)</span>',
        html
    ):
        label = m.group(1).strip()
        time_str = parse_time(m.group(2))
        for day in expand_range(label):
            hours[day] = time_str
    return hours


def yaml_block(name: str, address: str, hours: dict) -> str:
    lines = [f'  - name: "{name}"']
    lines.append(f'    address: "{address}"')
    lines.append("    opening_hours:")
    for day in DAY_ORDER:
        lines.append(f'      {day}: "{hours[day]}"')
    return "\n".join(lines)


def main():
    print("Fetching overview...")
    overview = fetch(OVERVIEW_URL)
    cards = parse_cards(overview)
    print(f"Found {len(cards)} Wertstoffhöfe")

    blocks = []
    for card in cards:
        print(f"  Scraping: {card['name']}")
        try:
            detail = fetch(card["url"])
            hours = parse_hours(detail)
            blocks.append(yaml_block(card["name"], card["address"], hours))
        except Exception as e:
            print(f"    WARNING: failed ({e})")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        "# AWM München Wertstoffhöfe — Öffnungszeiten\n"
        "# Re-run: python services/locations-service/scripts/scrape_hours.py\n"
        "wertstoffhoefe:\n" + "\n".join(blocks) + "\n",
        encoding="utf-8"
    )
    print(f"\nGespeichert: {OUTPUT}")


if __name__ == "__main__":
    main()
