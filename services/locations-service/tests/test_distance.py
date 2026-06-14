from locations_service.distance import haversine_m, filter_and_rank


def test_haversine_same_point():
    assert haversine_m(48.137, 11.575, 48.137, 11.575) == 0


def test_haversine_known_distance():
    # Marienplatz → Olympiapark: ca. 4.5 km Luftlinie
    dist = haversine_m(48.1374, 11.5755, 48.1754, 11.5521)
    assert 4000 < dist < 5000


def test_filter_and_rank_within_radius():
    locations = [
        {"id": "1", "lat": 48.140, "lng": 11.577},  # nah
        {"id": "2", "lat": 48.200, "lng": 11.600},  # weit
    ]
    result = filter_and_rank(locations, lat=48.137, lng=11.575, radius=1000)
    assert len(result) == 1
    assert result[0]["id"] == "1"


def test_filter_and_rank_sorted_by_distance():
    locations = [
        {"id": "far",  "lat": 48.150, "lng": 11.575},
        {"id": "near", "lat": 48.139, "lng": 11.575},
    ]
    result = filter_and_rank(locations, lat=48.137, lng=11.575, radius=5000)
    assert result[0]["id"] == "near"
    assert result[1]["id"] == "far"
