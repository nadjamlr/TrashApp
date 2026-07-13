import asyncio
import json
import re
from pathlib import Path
import httpx

_HOURS_FILE = Path("/data/wertstoffhof_hours.yaml")


def _load_hours_yaml() -> dict[str, dict]:
    """Load scraped opening hours from YAML, keyed by street+number (lowercase).

    AWM addresses look like 'Am Neubruch 23, 80997 München'.
    Open Data addresses look like 'Am Neubruch 23'.
    We strip everything from the first comma to match both.
    """
    if not _HOURS_FILE.exists():
        return {}
    text = _HOURS_FILE.read_text(encoding="utf-8")
    hours: dict[str, dict] = {}
    current_addr: str | None = None
    current_hours: dict[str, str] = {}
    for line in text.splitlines():
        m_addr = re.match(r'\s+address:\s+"(.+)"', line)
        m_day = re.match(r'\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday):\s+"(.+)"', line)
        m_name = re.match(r'\s+- name:', line)
        if m_name:
            if current_addr:
                hours[current_addr] = dict(current_hours)
            current_addr = None
            current_hours = {}
        elif m_addr:
            street = m_addr.group(1).split(",")[0].strip().lower()
            current_addr = street
        elif m_day and current_addr:
            current_hours[m_day.group(1)] = m_day.group(2)
    if current_addr:
        hours[current_addr] = dict(current_hours)
    return hours

WERTSTOFFHOF_URL = "https://geoportal.muenchen.de/geoserver/gsm_wfs/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=gsm_wfs:awm_wertstoffhoefe&outputFormat=application/json&SRSNAME=EPSG:4326"
WERTSTOFFINSELN_URL = "https://geoportal.muenchen.de/geoserver/gsm_wfs/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=gsm_wfs:awm_container&outputFormat=application/json&SRSNAME=EPSG:4326"
# ISAR_SAMMELBEHAELTER: optional, kann später ergänzt werden

WERTSTOFFHOF_MATERIALS = [
    "Papier", "Glas", "Plastik", "Metall",
    "Elektroschrott", "Sperrmüll", "Grünschnitt", "Altkleider",
]

_cache: list | None = None


async def get_locations() -> list:
    global _cache
    if _cache is None:
        _cache = await _fetch_and_parse()
    return _cache


async def _fetch_and_parse() -> list:
    async with httpx.AsyncClient() as client:
        hof_resp = await client.get(WERTSTOFFHOF_URL)
        insel_resp = await client.get(WERTSTOFFINSELN_URL)

    scraped_hours = _load_hours_yaml()
    hoefe = _parse_hoefe(hof_resp.content.decode("utf-8"), scraped_hours)
    inseln = _parse_inseln(insel_resp.content.decode("utf-8"))
    return [loc for loc in hoefe + inseln if loc["lat"] is not None and loc["lng"] is not None]


def _parse_hoefe(raw: str, scraped_hours: dict[str, dict] | None = None) -> list:
    features = json.loads(raw).get("features", [])
    results = []
    for feature in features:
        props = feature.get("properties", {})
        coords = feature.get("geometry", {}).get("coordinates", [None, None])
        name = props.get("name", "Wertstoffhof")
        address = props.get("adresse", "")
        addr_key = address.split(",")[0].strip().lower()
        hours = (scraped_hours or {}).get(addr_key) or {
            "monday":    "10:30 - 19:00",
            "tuesday":   "08:00 - 18:00",
            "wednesday": "08:00 - 18:00",
            "thursday":  "08:00 - 18:00",
            "friday":    "08:00 - 18:00",
            "saturday":  "07:30 - 15:00",
            "sunday":    "closed",
        }
        results.append({
            "id":            str(feature.get("id", props.get("name", ""))),
            "name":          name,
            "address":       address,
            "lat":           coords[1],
            "lng":           coords[0],
            "materials":     WERTSTOFFHOF_MATERIALS,
            "opening_hours": hours,
            "type":          "wertstoffhof",
        })
    return results


def _parse_inseln(raw: str) -> list:
    features = json.loads(raw).get("features", [])
    results = []
    for feature in features:
        props = feature.get("properties", {})
        coords = feature.get("geometry", {}).get("coordinates", [None, None])
        material_flags = {
            "Altkleider": props.get("altkleider"),
            "LVP":        props.get("lvp"),
            "Glas braun": props.get("glas_braun"),
            "Glas grün":  props.get("glas_gruen"),
            "Glas weiß":  props.get("glas_weiss"),
        }
        results.append({
            "id":            str(feature.get("id", props.get("adresse", ""))),
            "name":          "Wertstoffinsel " + (props.get("adresse") or "").split(",")[0],
            "address":       props.get("adresse") or "",
            "lat":           coords[1],
            "lng":           coords[0],
            "materials":     [mat for mat, val in material_flags.items() if val],
            "opening_hours": {
                "monday": "07:00 - 19:00",
                "tuesday": "07:00 - 19:00",
                "wednesday": "07:00 - 19:00",
                "thursday": "07:00 - 19:00",
                "friday": "07:00 - 19:00",
                "saturday": "07:00 - 19:00",
                "sunday": "closed"},
            "type":          "wertstoffinsel",
        })
    return results


if __name__ == "__main__":
    import pprint
    results = asyncio.run(get_locations())
    pprint.pprint(results[:2])
    print(f"\nGesamt: {len(results)} Standorte")
