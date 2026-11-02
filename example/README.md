# Example app

A minimal Next.js App Router app using `@tele/nextjs-ui`: `app/call/[code]/page.tsx` renders `<TeleJoinPage>`.

The route handlers under `app/api/` and `lib/tele-dev.ts` are **example only**: they stand in for your real
backend so the example can talk to a Tele API. They sign user tokens with `TELE_API_KEY` / `TELE_API_SECRET`
from the environment and identify people by a random cookie. In your app, use your own session and a Tele
server SDK, and keep the secret on the server.

```bash
cp .env.example .env.local   # fill in the key and secret; TELE_EXAMPLE_PROXY=1 turns the proxy on
npm install
npm run build && npm start   # http://localhost:3210
```

Open http://localhost:3210, press **Start a test call**, and you land on the invite page.

## End-to-end test

With the app running on port 3210:

```bash
npx playwright install chromium
npm run e2e
```

It opens an invite link, checks the preview, joins with fake camera and microphone, waits for
`phase === "live"`, and leaves.
