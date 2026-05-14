# Vision 10Q Trainer

A mobile-first React + Vite training app for Vision Packaging outside sales reps. It helps reps memorize, understand, and naturally use Vision's 10 discovery questions in customer conversations.

## Features

- **Learn Mode**: Flashcards with question intent, casual version, follow-ups, mistakes, and coaching.
- **Drill Mode**: Timed recall, random quiz, and purpose matching with persistent score in localStorage.
- **Conversation Mode**: Customer-type selector with a natural conversation flow using all 10 questions.
- **Roleplay Mode**: Objection handling scenario with coaching feedback.
- **Field Mode**: Mobile cheat sheet with opening line, conversation path, closing question, and copyable Salesforce note template.
- **Manager Scorecard**: Local scoring form + CSV export.

## Tech

- React 18
- Vite 5
- Static frontend only (no backend)

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## GitHub Pages deployment (recommended: Actions)

This project is configured for Pages-safe static hosting:

- `vite.config.js` uses `base: './'` so built JS/CSS assets resolve correctly under repo subpaths.
- `.github/workflows/deploy-pages.yml` builds and deploys `dist/` automatically.

### One-time GitHub setup

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.
4. Ensure your default branch is `main` (or update workflow branch trigger).
5. Push to `main` (or run the workflow manually) and wait for the `Deploy to GitHub Pages` workflow to finish.

Your site URL should be:

`https://<your-username>.github.io/<your-repo>/`

## Manual deployment option

If you prefer manual deploys, build locally and upload/publish the `dist/` folder content to your Pages publishing branch.

```bash
npm run build
```

## Usage notes / sample walkthrough

- Start in **Learn Mode** and swipe through all 10 questions.
- Switch to **Drill Mode** and complete one timed recall cycle.
- Use **Conversation Mode** before a call to rehearse by customer segment.
- Open **Field Mode** on your phone during field visits for quick prompts.
- Managers can save coaching records in **Manager Scorecard** and export to CSV.
