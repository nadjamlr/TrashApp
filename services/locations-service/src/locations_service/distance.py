# services/locations-service/src/locations_service/distance.py
import math

def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
    R = 6_371_000  # Erdradius in Metern
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlng / 2) ** 2
    return round(2 * R * math.asin(math.sqrt(a)))

def filter_and_rank(locations: list, lat: float, lng: float, radius: int) -> list:
    results = []
    for loc in locations:
        dist = haversine_m(lat, lng, loc["lat"], loc["lng"])
        if dist <= radius:
            results.append({**loc, "distance_m": dist})
    return sorted(results, key=lambda x: x["distance_m"])
