# Project Lantern

A local-first Electron prototype that turns a child’s interests into explainable learning paths. It includes child onboarding, Explorer questions, personalized discovery, a Growth Map, teaching-oriented AI assistance, quizzes, a privacy-respecting parent view, offline learning packs, and regular browser tabs.

## Run

```bash
npm ci
env -u ELECTRON_RUN_AS_NODE npm start
```

Learner data is stored locally in Electron storage. The built-in tutor works without an AI connection; an optional OpenAI-compatible endpoint can be configured from Ask Lantern settings.
