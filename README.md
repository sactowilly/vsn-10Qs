# Vision 10Q Sales Trainer

A mobile-first practice app that helps Vision Packaging sales reps understand, recall, and naturally use the 10 discovery questions.

## Training modes

- **Learn:** Study each question's purpose, natural phrasing, follow-ups, common mistake, and coaching note.
- **Drill:** Identify the 10 framework questions among five decoys and get immediate scoring feedback.
- **Field:** Choose a customer type, follow a call-ready conversation guide, and copy a structured Salesforce note template.
- **Roleplay:** Practice realistic customer objections before revealing a recommended response and coaching.
- **Flashcards:** Build fluency with question cards and customer-response cards.

Training state is session-only and resets when the page refreshes. The app does not collect or transmit customer information.

## Technology

- React 18
- Vite 8
- Static GitHub Pages deployment
- Dependency-free Node tests and content validation

## Local development

Requires Node.js 20.19 or newer.

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run check
```

The check command validates the training datasets, runs deterministic quiz tests, and creates a production build.

## GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` validates every pull request targeting `main`. Pushes to `main` additionally publish the production `dist/` artifact to GitHub Pages.

`vite.config.js` uses a relative base path so the built assets work from the repository subpath.

