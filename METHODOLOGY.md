# 🧪 Development Methodology: The Soul Forge

This document outlines the architectural decisions and evolution of the **Shinigami OS** project, detailing the transition from a local prototype to a production-ready cloud application.

## 🏔️ Phase 1: Conceptualization & Aesthetics
The project began with a "Design-First" philosophy. The goal was to move away from generic productivity tools and create an immersive interface.
- **Decision**: Used **Glassmorphism** and **CSS Variables** for a highly customizable theme system.
- **Challenge**: Balancing high-contrast anime imagery with readability.
- **Solution**: Implemented translucent "Glass" overlays and dynamic accent colors tied to the active theme.

## 🏗️ Phase 2: Structural Migration (SQLite to Supabase)
Initially built on SQLite for simplicity, the project faced deployment blockers on Render due to binary compatibility issues (`GLIBC_2.38`).
- **Pivot**: Migrated the entire schema to **Supabase (PostgreSQL)**.
- **Benefit**: Achieved permanent persistence, solved deployment errors, and enabled SSL-secured connections.
- **Tooling**: Utilized the `pg` library with a robust Connection Pooler to handle serverless-style scaling.

## 🧠 Phase 3: Artificial Intelligence (The Zanpakuto Spirit)
Integrating Google Gemini presented significant challenges regarding API versions and SDK stability.
- **The Problem**: The standard `@google/generative-ai` SDK defaulted to `v1beta` endpoints, causing frequent 404 errors for newer models on certain API keys.
- **The Solution**: Moved away from the SDK in favor of a **Stable v1 REST API** implementation using Axios.
- **Resilience**: Implemented a "Model Fallback" system that automatically cycles through `gemini-2.5-flash`, `gemini-2.0-flash`, and `gemini-pro` until a successful connection is established.

## 🔐 Phase 4: Security & DevOps
Ensuring the safety of spiritual energy (data) and credentials was paramount.
- **Credential Leak Protection**: Implemented strict `.gitignore` rules and removed historical leaks from Git history using `git rm --cached`.
- **Environment Management**: Moved all secrets (JWT, DB URL, API Keys) to Render's encrypted environment variables.
- **CI/CD**: Established an automated pipeline where Vercel handles the React frontend and Render handles the Node.js backend, synchronized via GitHub.

## ⚔️ Key Learnings
- **Flexibility is Key**: The migration from SQLite to Postgres in mid-development proved that a decoupled database layer is essential.
- **REST > SDK**: For fast-moving APIs like Gemini, direct REST calls provide better control and easier debugging than heavy SDKs.
- **Thematic Consistency**: Every feature, from the activity heatmap to the PDF parser, was named and styled to maintain the "Soul Society" immersion.

---
*Documentation maintained by the 12th Division Research Institute.*
