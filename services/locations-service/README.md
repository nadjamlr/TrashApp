# Locations Service

Returns nearby Munich recycling sites filtered by material, sorted by distance. Optionally adds a walking or cycling route via OpenRouteService. No LLM involved.

**Endpoint:** `GET /locations`
**Port:** 8005

## Query parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| material | string | yes | Material to filter by, e.g. `Aluminium` |
| lat | float | yes | User latitude |
| lng | float | yes | User longitude |
| radius | int | no | Search radius in metres, default 3000 |
| routing | bool | no | Include route polyline, default false |

## Response

```json
{
  "locations": [
    {
      "id": "ws-001",
      "name": "Wertstoffhof Freimann",
      "address": "Freimanner Bahnhofstr. 1, 80807 München",
      "lat": 48.182,
      "lng": 11.567,
      "distance_m": 1240,
      "materials": ["Aluminium", "Glas", "Papier"],
      "opening_hours": "Mo-Fr 07:00-17:00, Sa 07:00-13:00",
      "route": null
    }
  ]
}
```

## Local start

```bash
cd services
uv run --package locations-service --link-mode=copy uvicorn locations_service.main:app --port 8005 --reload
```
