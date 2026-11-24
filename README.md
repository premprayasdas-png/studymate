# StudyMate

StudyMate is a cross-platform student learning companion built with Expo, React Native, TypeScript, Expo Router and Firebase.

## Current features

- Firebase email/password authentication
- Personal notes with Firestore storage
- Study session tracker with daily and total study-hour summaries
- Study tools screen: planner, timetable, subject list, sample quiz, tutor starter and progress overview
- Android and web targets through Expo

## Run locally

1. Install Node.js LTS and Git.
2. Clone this repository and enter the project folder:
   ```bash
   git clone https://github.com/premprayasdas-png/studymate.git
   cd studymate
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start Expo:
   ```bash
   npx expo start
   ```
   Press `w` for web, or scan the QR code with Expo Go for Android.

## Firebase setup

The app uses Firebase Authentication and Cloud Firestore. Enable Email/Password in Firebase Authentication and create a Firestore database in the Firebase console.

Before deploying, publish the included `firestore.rules` rules to Firestore (Firebase Console → Firestore Database → Rules). These rules restrict user documents to the signed-in owner. Extend them with field validation as the data model grows. Never use Admin SDK service-account credentials in the client app.

## AI tutor and free usage

The current Tutor tab is an offline starter with a few example explanations; it is not yet connected to a generative AI model. A free-tier model API can have usage limits and terms that change. The production integration should call the model through a server-side endpoint (for example, a Cloudflare Worker) and keep the API key in server-side secrets. Do not put a Gemini, OpenAI, or other private AI key in the Expo app or commit it to Git.

## Development checks

```bash
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

## Project structure

- `src/app/index.tsx` — sign-in/sign-up and dashboard
- `src/app/notes.tsx` — notes
- `src/app/study-tracker.tsx` — study time tracking
- `src/app/study-tools.tsx` — planner, timetable, subjects, sample quiz, tutor starter and progress
- `src/app/firebaseconfig.ts` — Firebase client configuration
- `firestore.rules` — owner-scoped Firestore rules

## Roadmap

1. Complete and test planner, timetable, subjects and quiz flows.
2. Add edit/delete operations, date/time validation and richer progress charts.
3. Connect a secure free-tier AI endpoint for tutor explanations, note summaries and quiz generation.
4. Add PDF uploads, exam schedules, reminders, profile/settings and polish Android/web layouts.
5. Add automated checks and production deployment instructions.
