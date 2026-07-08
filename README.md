# TrashApp
Agentic App for Trash identitfication and information for disposals

## Local Setup

### 1. Backend environment

Copy `env.example` to `.env` in the root directory and fill in the values:

```bash
cp env.example .env
```

### 2. Mobile app environment

Create `apps/mobile/.env.local` with your machine's local IP address.  
Find your IP on Mac:

```bash
ipconfig getifaddr en0
```

Then create the file:

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_VISION_AGENT_URL=http://<YOUR_IP>:8001
EXPO_PUBLIC_CHAT_AGENT_URL=http://<YOUR_IP>:8004
EXPO_PUBLIC_INSIGHT_AGENT_URL=http://<YOUR_IP>:8003
EXPO_PUBLIC_LOCATIONS_SERVICE_URL=http://<YOUR_IP>:8005
```

> The IP must be your machine's local network IP (not `localhost`) so the phone can reach your Mac over Wi-Fi.

### 3. Start services

```bash
docker compose up
```

### 4. Start the mobile app

```bash
cd apps/mobile
npx expo start
```
