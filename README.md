# Aura - Unified Multi-Provider AI Workspace

Aura is an independent AI conversational workspace and full-stack coding platform. It unifies frontier intelligence from **Anthropic** and **Google Gemini** behind a single seamless interface, providing intelligent dual-engine handover, live interactive canvas artifacts, per-user usage limits, and full database persistence with Cloud Firestore.

---

## 🏛️ Architecture & Model Routing

Aura enforces an authenticated backend routing layer so that no client browser directly calls AI provider credentials.

```text
Browser Client (React 19 + Vite)
        ↓
  /api/chat (Node.js Server / Vercel Serverless)
        ↓
  Provider Routing Layer (server/providers/router.ts)
   ├── Anthropic Adapter (MessiahGPT / claude-3-5-sonnet-20241022)
   └── Google Gemini Adapter (gemini-2.5-flash)
```

### Exact Model-Routing Invariant
For every conversation thread:
* **Turn 1 (User Message Count = 0 before sending)**: Handled by **Anthropic Provider**.
* **Turn 2 (User Message Count = 1 before sending)**: Handled by **Anthropic Provider**.
* **Turn 3+ (User Message Count >= 2 before sending)**: Handled by **Google Gemini Provider**.

> **Note**: Assistant replies are **not** counted as user messages. Gemini receives the complete conversational history including all prior responses, ensuring total memory continuity. If an Anthropic key is not configured, automatic fallback to Gemini occurs so the user never experiences conversational failure.

---

## 🛡️ Usage Limits & Cost Safeguards

Configured in `server/limits.ts` to protect API balance against runaway spend:
* `DAILY_MESSAGE_LIMIT=50`: Maximum user prompts per calendar day.
* `MONTHLY_MESSAGE_LIMIT=1000`: Maximum user prompts per calendar month.
* `MAX_MESSAGE_CHARACTERS=20000`: Hard rejection of oversized single messages.
* `MAX_CONTEXT_MESSAGES=40`: Automatic conversational context ceiling.
* **Rapid-Fire Throttle**: 1-second inter-request cooldown.
* **Circuit Breaker**: 30-second cooldown after 3 consecutive upstream provider errors.
* **Maintenance Mode Switch**: Admin toggleable from `/admin` to pause regular user requests during updates.

---

## 🔑 Environment Variables

Copy the template from `.env.example`:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | Google AI Studio Gemini API key for turn 3+ and fallbacks. |
| `ANTHROPIC_API_KEY` | Optional | Anthropic API key for turns 1 & 2. |
| `ADMIN_SECRET` | Optional | Shared admin secret for backend telemetry (`/api/admin/stats`). |
| `DAILY_MESSAGE_LIMIT` | Optional | Daily messages per user (default: `50`). |
| `MONTHLY_MESSAGE_LIMIT` | Optional | Monthly messages per user (default: `1000`). |
| `MAX_MESSAGE_CHARACTERS` | Optional | Max characters per prompt (default: `20000`). |
| `MAX_CONTEXT_MESSAGES` | Optional | Max messages in context history (default: `40`). |

---

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to open the Aura workspace.
