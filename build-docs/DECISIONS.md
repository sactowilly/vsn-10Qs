# Decisions

## Keep the product static

**DECISION:** Continue deploying the trainer as a static React application without a custom backend.
**RATIONALE:** The current product uses public training content and session-only interactions; a backend would add authentication, retention, availability, and operating complexity without supporting a present requirement.
**DATE:** 2026-07-27
**PARTIES:** Product owner, backend architecture audit, Codex

## Treat accessibility as a release requirement

**DECISION:** Navigation, flashcards, controls, feedback, color contrast, focus states, and responsive behavior must be keyboard- and assistive-technology-friendly.
**RATIONALE:** Flashcards and several controls in the existing app were inaccessible or visually ambiguous, which directly blocked completion of core training tasks.
**DATE:** 2026-07-27
**PARTIES:** Product owner, design audit, engineering audit, Codex

## Gate deployment on deterministic checks

**DECISION:** Pull requests and GitHub Pages deployments must use the lockfile and pass content validation, deterministic quiz tests, and a production build.
**RATIONALE:** The previous workflow resolved dependencies dynamically and could deploy incorrect quiz scoring or malformed training data without a quality gate.
**DATE:** 2026-07-27
**PARTIES:** Product owner, backend architecture audit, engineering audit, Codex
