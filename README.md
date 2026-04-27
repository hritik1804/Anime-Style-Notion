# ⚔️ Shinigami OS (Anime Style Notion)

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.5-blue?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev)

A premium, anime-inspired workspace designed for Shinigami to chronicle their missions, train their spirits, and organize the Soul Society. Built with a focus on high-end aesthetics, dynamic animations, and AI-powered intelligence.

![App Preview](https://raw.githubusercontent.com/hritik1804/Anime-Style-Notion/main/preview.png)

## 🌌 Core Features

### 🖋️ The Chronicles (Editor)
- **Rich Text Experience**: Powered by TipTap for seamless note-taking.
- **Multimodal Integration**: Embed Training Scrolls (PDFs), imagery, and YouTube scrolls directly into your notes.
- **Public/Private Archives**: Toggle the visibility of your notes with a single click and share them with other Shinigami.

### 🤖 The Zanpakuto Spirit (AI Advisor)
- **Mission Briefings**: Instant AI summarization of your notes into tactical mission briefings.
- **Scroll Deciphering**: Upload Training Scrolls (PDFs) and let the spirit extract key techniques and knowledge using **Gemini 2.5 Flash**.
- **Tactical Feedback**: AI-driven insights to help you organize your thoughts.

### 📊 Spiritual Energy (Analytics)
- **Activity Heatmap**: Visualize your productivity with a Github-style activity tracker.
- **Rank Tracking**: Monitor your progress as you ascend through the ranks of the Gotei 13.

### 🎭 Soul Resonace (Themes)
- **Dynamic Backgrounds**: Switch between iconic characters (Aizen, Gojo, Madara, Rengoku, etc.) with custom-tailored color palettes and ambient styling.
- **Glassmorphism UI**: A sleek, translucent interface that feels alive.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TipTap, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Socket.io (Real-time sync).
- **Database**: Supabase (PostgreSQL) for permanent cloud persistence.
- **AI**: Google Gemini 2.5 API (REST Integration).
- **Deployment**: Vercel (Frontend) & Render (Backend).

## 🚀 Deployment

### Environment Variables
To initialize your own Soul Society, you need the following in your `server/.env`:
```env
DATABASE_URL=your_supabase_url
JWT_SECRET=your_secret
GEMINI_API_KEY=your_google_ai_key
PORT=5001
```

## 📜 License
Licensed under the Soul Society Archives (MIT).

---
*Created with spiritual energy by [Hritik Ranjan](https://github.com/hritik1804)*
