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

## GitHub Pages deployment

This repo is configured with `base: '/vsn-10Qs/'` in `vite.config.js` for GitHub Pages hosting on this repository path.

1. Build the app:
   ```bash
   npm run build
   ```
2. Publish the `dist/` folder to GitHub Pages (for example via `gh-pages` branch or Actions).
3. In GitHub repo settings, set Pages source to the branch/folder where `dist` is published.

### Example GitHub Actions flow

- Checkout
- Setup Node
- Run `npm ci`
- Run `npm run build`
- Deploy `dist/` to Pages

## Usage notes / sample walkthrough

- Start in **Learn Mode** and swipe through all 10 questions.
- Switch to **Drill Mode** and complete one timed recall cycle.
- Use **Conversation Mode** before a call to rehearse by customer segment.
- Open **Field Mode** on your phone during field visits for quick prompts.
- Managers can save coaching records in **Manager Scorecard** and export to CSV.

