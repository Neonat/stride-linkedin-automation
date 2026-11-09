# Stride — LinkedIn personal brand assistant

Stride is a hackathon prototype for students and early-career professionals who want to turn real career moments into LinkedIn posts. Set a profile and tone, capture an experience, generate a draft, review it, and explicitly publish using a connected LinkedIn account.

Built for the **LinkedIn TrailBlazer Hackathon**, in the LinkedIn Career Trailblazer Camp context, using **ChatChat by ChatAndBuild** as part of the build workflow. ChatAndBuild describes the [career-agent session and hackathon](https://www.linkedin.com/pulse/from-job-search-proof-work-creating-career-agents-linkedin-trsce). The application's landing page credits Nat Sim and labels Stride a demo/beta.

## Current workflow

| Step | Implemented scope |
| --- | --- |
| Profile and persona | Onboarding collects goals, tone and content pillars; Agnes AI builds or refreshes persona context. |
| Capture moments | Save an experience and its story bullets; the moments route can refresh the persona. |
| Find prompts | A connected Google account can read upcoming Calendar events in the browser. |
| Draft and review | Generate an editable LinkedIn draft through Agnes AI, with persona context and user-supplied facts. |
| Publish | The connected flow sends the reviewed text to LinkedIn when the user clicks Publish. |
| Explore the demo | Browse sample dashboards, streaks and collaboration screens without treating the sample content as real achievements. |

The repository mixes live integrations with demonstration flows. It does not contain a background post scheduler. The Nemotron content-safety request is **nonblocking** in the current publish flow: a flag or request failure is logged and does not prevent posting.

## Preview locally

The frontend is plain HTML, CSS and JavaScript with no bundling step. With Python 3 installed:

```sh
git clone https://github.com/Neonat/stride-linkedin-automation.git
cd stride-linkedin-automation
python3 -m http.server 8000
```

Open http://localhost:8000 and choose **Try a demo version**. This serves the static interface and sample screens. Sign-in, generation, database features and real publishing require the configured API deployment below; a static HTTP server does not provide `/api/*` routes.

## Connected deployment

The main integration is the Python serverless API in [`api/`](api/), configured by [`vercel.json`](vercel.json). The root [`requirements.txt`](requirements.txt) supplies its Python dependencies.

1. Create a Supabase project and initialise a fresh database from [`schema.sql`](schema.sql). The schema is a prototype starting point; it is not a complete production access-policy or migration package.
2. Configure the Supabase OAuth providers used by the frontend (`google` and `linkedin_oidc`) and their callback/redirect URLs for the deployment.
3. Set the server environment using [`.env.example`](.env.example) as the variable reference, then deploy the repository to Vercel with Python-function support. Keep service credentials out of static files.

| Configuration | Purpose |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Public client configuration returned by `/api/config` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side profile, persona, moment and connection data access |
| `AGNES_AI_TOKEN`, optional `AGNES_MODEL` | Persona/profile generation and post drafting; default model `agnes-2.0-flash` |
| `NVIDIA_API_SAFETY_KEY`, optional `NVIDIA_SAFETY_MODEL` | Nemotron content classification |
| LinkedIn OAuth provider token | Per-user publishing; the handler derives the person's URN from userinfo |
| `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN`, `LINKEDIN_API_VERSION` | Server-side development fallback and the legacy stats endpoint |

The example API version is the repository's recorded value, not a guarantee of present LinkedIn API availability. OAuth scopes, product access and provider configuration must match the account used for deployment. Merely copying `.env.example` does not configure Supabase or LinkedIn.

## Architecture

```text
index.html + css/ + js/app.js   Screen routing, demo content and browser integrations
api/config.py                  Public Supabase client configuration
api/profile.py, persona.py     Profile/persona generation and persistence
api/moments.py, draft.py        Career moments and Agnes AI drafts
api/safety_check.py             NVIDIA Nemotron classification
api/publish.py                  LinkedIn publishing handler
api/connections_list.py         Saved connections lookup
schema.sql                     Prototype Postgres tables and cleanup function
backend/                       Separate FastAPI mock backend
```

The separate [`backend/main.py`](backend/main.py) offers mock login (`demo` / `password`), draft generation and simulated publishing. It does not replace the serverless API: its route names and data contracts differ. To inspect that mock independently:

```sh
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/uvicorn backend.main:app --reload --port 8001
```

Open http://localhost:8001/docs for its API interface. Its successful publish response is simulated.

## Status and boundaries

- Review draft wording and factual claims yourself before using the live Publish action; that route can create a public LinkedIn post.
- Demo cards, example analytics, coauthoring and pairing screens include sample behaviour. The checked-in API only implements part of the network/collaboration design.
- Some persona/moment endpoints fall back to a shared `demo-user` when authentication is absent. Treat this as a prototype boundary when considering multiple users.
- OAuth provider tokens are currently cached in browser local storage. The interface's session-only token wording does not describe that implementation precisely.
- The checked-in [privacy page](privacy.html) and [terms page](terms.html) are product copy, not evidence that every stated control is implemented.

No production readiness, current API access or automatic moderation guarantee is implied by the demo.
