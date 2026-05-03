# 🏛️ CivicPath India AI - Election Process Education

**Challenge:** Election Process Education
**Vertical:** Civic Tech / Education

## 🎯 Problem Statement
The Indian election process is a massive, multifaceted exercise in democracy. Voters and students often struggle to find clear, neutral, and educational information about the fundamental steps involved—from registering on the Electoral Roll via Form 6 to understanding EVMs and VVPATs. There is a critical need for an accessible, strictly nonpartisan tool that explains how Indian elections work without persuading users or endorsing candidates.

## 👥 Target Users
- **First-time Voters:** Seeking to understand how to register (Form 6) and how to cast a ballot at the polling booth.
- **General Public:** Looking to clarify election terminology (e.g., Model Code of Conduct, NOTA, EVM, VVPAT).
- **Educators/Students:** Needing a safe, nonpartisan classroom resource for civic literacy regarding the Election Commission of India (ECI).

## 💡 Solution Overview
CivicPath India AI is a lightweight, accessible, full-stack web application designed to break down the Indian election process into interactive, easy-to-understand segments. It leverages Google's Gemini AI to answer specific user questions under strict nonpartisan constraints, while providing predefined journey maps, timelines, and quizzes tailored to the Indian democratic system.

## ✨ Feature List
- **Indian Election Journey:** A visual, step-by-step breakdown of the core election stages from Registration to Results Declaration.
- **Ask AI (Gemini):** A chat interface allowing users to ask natural language questions about the Indian election process, returning structured data with specific India-context notes.
- **Timeline Builder:** Dynamic milestone generator for Lok Sabha, State Assembly, Local Body, and By-elections.
- **Interactive Quiz:** An 8-question test to evaluate civic literacy on topics like the ECI, Form 6, and EVMs, with detailed explanations.
- **Educator Dashboard:** A high-level overview of common Indian election topics and the app's safety constraints.

## 🏗️ Architecture
To ensure the application remains incredibly lightweight (under 1MB) and lightning-fast:
- **Frontend:** Vanilla HTML, CSS (CSS variables, flex/grid layouts), and JavaScript. Zero frontend frameworks.
- **Backend:** Node.js with Express.js.
- **API Client:** Native Node.js `fetch` API for external Google integrations.
- **Containerization:** Optimized `Dockerfile` utilizing a minimal `node:20-slim` image.

## 🔌 API Endpoints
- `GET /api/timeline?type=[loksabha|assembly|localbody|byelection]`: Returns an array of timeline milestones.
- `GET /api/quiz`: Returns a structured array of multiple-choice quiz questions and answers based on the Indian system.
- `POST /api/chat`: Expects `{ "message": "string" }`. Returns a structured JSON AI response: `{ "isFallback", "aiData": { "topic", "answer", "steps", "indiaContext", "officialReminder", "neutralityNote" } }`.

## 🤖 Gemini Integration & Fallback Behavior
- **Integration:** The backend uses the `gemini-2.5-flash` model. Prompts are strictly structured to mandate a JSON response schema focusing on Indian election mechanics.
- **Fallback Behavior:** If `GEMINI_API_KEY` is not provided in the environment (or if the API fails), the backend seamlessly intercepts the error and returns a predefined, structured mock response. The frontend gracefully detects `isFallback: true` and displays a yellow "Fallback Mode" badge.

## 🛡️ Nonpartisan Safety Policy
Safety is built into the core architecture:
- **System Constraints:** The Gemini API is initialized with a strict system prompt forbidding candidate endorsements, party recommendations, and persuasive messaging. It must direct users to official sources.
- **Universal Reminder:** Every AI response and main application view prominently displays: *"Election rules, dates, voter lists, polling stations, and ID requirements can change. Always verify through the Election Commission of India, Voters’ Services Portal, or your official State Chief Electoral Officer website."*
- **Visual Badging:** A "Nonpartisan Education Only" badge is globally visible in the application header.

## ♿ Accessibility Features
- Semantic HTML5 structure.
- Accessible, high-contrast color palette (deep blues on clean whites).
- Skip-to-main-content link (`<a href="#main-content" class="skip-link">`).
- Dedicated `*:focus-visible` states for clear keyboard navigation.
- `aria-live="polite"` regions configured for dynamic AI chat responses and quiz feedback to support screen readers.

## 🧪 Testing Strategy
- Utilizes the native, zero-dependency `node:test` runner.
- Validates structural endpoints (`/api/quiz`, `/api/timeline`).
- Tests Edge Cases: Graceful handling of invalid timeline queries, blank chat messages (`400 Bad Request`), and verifying the structure of the India-context fallback JSON payload.
- Run tests via: `npm test`

## ☁️ Google Services Used
- **Google Gemini API:** Natural language processing and educational content generation.
- **Google Cloud Run:** Target deployment platform for the containerized application.

## 🚀 Cloud Run Deployment Steps
This repository is production-ready for Google Cloud Run.

1. **Authenticate via gcloud:**
   ```bash
   gcloud auth login
   ```
2. **Build and Submit Container:**
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/civicpath-india-ai
   ```
3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy civicpath-india-ai \
     --image gcr.io/YOUR_PROJECT_ID/civicpath-india-ai \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY=your_api_key_here
   ```

## 📌 Assumptions
- Users have basic internet connectivity.
- Educators using the dashboard do not require authenticated views.
- Users understand that this tool is a general guide, and final authoritative information rests with the Election Commission of India and state CEOs.

## 🔮 Future Improvements
- **Localization:** Support for Hindi and other regional Indian languages.
- **Voters' Services Portal API:** Potential future integration with live APIs for checking real-time electoral roll status.
- **Voice Support:** Add text-to-speech for AI explanations to improve accessibility for diverse populations across India.
