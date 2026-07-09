#!/bin/bash
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  echo "Fehler: Keine IP gefunden. Bist du mit WLAN verbunden?"
  exit 1
fi
cat > apps/mobile/.env.local << EOF
EXPO_PUBLIC_VISION_AGENT_URL=http://$IP:8001
EXPO_PUBLIC_CHAT_AGENT_URL=http://$IP:8004
EXPO_PUBLIC_INSIGHT_AGENT_URL=http://$IP:8003
EXPO_PUBLIC_LOCATIONS_SERVICE_URL=http://$IP:8005
EOF
echo "IP aktualisiert: $IP"
