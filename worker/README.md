# StudyMate multilingual AI setup

The AI Tutor calls a Cloudflare Worker so the Gemini API key is never shipped inside the Android/web app.

## 1. Deploy the Worker

1. Create or sign in to a Cloudflare account.
2. Install Wrangler locally if needed: `npm install -g wrangler`.
3. From the repository root, run `cd worker`.
4. Run `npx wrangler login`.
5. Add your Google AI Studio key as a Worker secret: `npx wrangler secret put GEMINI_API_KEY` and paste the key when prompted. Do not commit this key or put it in the Expo app.
6. Deploy: `npx wrangler deploy`.
7. Copy the Worker URL shown by Wrangler (for example, `https://studymate-ai.<your-subdomain>.workers.dev`).

## 2. Connect the Expo app

In the project root, create or edit `.env`:

```env
EXPO_PUBLIC_STUDYMATE_AI_URL=https://studymate-ai.<your-subdomain>.workers.dev
```

Replace the example URL with your real deployed Worker URL. Restart Expo after changing environment variables:

```bash
npx expo start -c
```

## 3. Test

Open Study Tools > AI Tutor. Ask a question in English, Odia, Hindi, or another supported language. Choose an answer language or leave Auto selected. The Worker uses Gemini 2.5 Flash by default; you can change `GEMINI_MODEL` in `worker/wrangler.toml`.

## Notes

- The Worker supports any language the selected Gemini model can understand and generate; the selector highlights common Indian and world languages.
- API usage may be subject to Google's current quotas, pricing, and availability. Check Google AI Studio before production use.
- CORS is open for ease of Expo development. For production, restrict allowed origins to your app's web domain where applicable and add rate limiting/authentication to the Worker.
- Never expose `GEMINI_API_KEY` in `EXPO_PUBLIC_*` variables, source files, or Git.
