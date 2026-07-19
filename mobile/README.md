# Relay Mobile (Expo)

Thin client over the same Relay HTTP + SSE API.

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to your web API (use your machine LAN IP for a physical device).

See `docs/MOBILE_API.md` for the shared contract.
