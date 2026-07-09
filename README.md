# TrashApp
Agentic App for Trash identitfication and information for disposals

## Local Setup

### 1. Backend environment

Copy `env.example` to `.env` in the root directory and fill in the values:

```bash
cp env.example .env
```

### 2. Mobile app environment

The mobile app needs your machine's local IP so the phone can reach the backend over Wi-Fi.  
Run the included script to auto-detect and write `apps/mobile/.env.local`:

```bash
./update-ip.sh
```

Re-run this script whenever you change networks (e.g. home → university). Then restart Expo.

### 3. Start services

```bash
docker compose up
```

### 4. Start the mobile app

```bash
cd apps/mobile
npx expo start
```
