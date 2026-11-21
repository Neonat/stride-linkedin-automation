# Stride

Stride is a LinkedIn personal-brand assistant prototype for students and early-career professionals. Set a profile and tone, record a career moment, generate a draft, review it, and explicitly publish through a connected LinkedIn account.

Built for the LinkedIn TrailBlazer Hackathon in the LinkedIn Career Trailblazer Camp context. The build workflow used ChatChat by ChatAndBuild. ChatAndBuild describes the [career-agent session and hackathon](https://www.linkedin.com/pulse/from-job-search-proof-work-creating-career-agents-linkedin-trsce). The landing page identifies Stride as a demo and beta.

[Workflow](#workflow) · [Stack and architecture](#stack-and-architecture) · [Preview locally](#preview-locally) · [Connected deployment](#connected-deployment) · [Prototype boundaries](#checks-and-prototype-boundaries)

## Workflow

| Step | Implemented scope |
| --- | --- |
| Profile and persona | Collect goals, tone, and content pillars. Generate or refresh persona context with Agnes AI. |
| Capture moments | Save an experience and its story bullets. Refresh the persona through the moments route. |
| Find prompts | Read upcoming Google Calendar events through a connected account in the browser. |
| Draft and review | Generate an editable LinkedIn draft with persona context and user-supplied facts. |
| Publish | Send reviewed text to LinkedIn after an explicit Publish action. |
| Explore the demo | Browse sample dashboards, streaks, and collaboration screens. |

There is no background post scheduler. The Nemotron safety request is nonblocking: the client logs a flag or a failed request and continues publishing. Demo cards and simulated collaboration flows do not establish real activity or achievements.

## Stack and architecture

| Technology | Role in Stride |
| --- | --- |
| HTML, CSS, and browser JavaScript | Run the screen navigation, demo content, draft editor, and OAuth client without a bundler. |
| Python functions on Vercel | Keep model credentials and provider requests behind `/api/*` routes. |
| Supabase Auth and Postgres | Connect Google and LinkedIn identities and store profiles, personas, moments, and connections. |
| Agnes AI | Generate profile context and drafts from supplied facts and tone. |
| NVIDIA Nemotron | Classify draft content in a separate advisory request. |
| LinkedIn REST API | Resolve the connected person's identity and publish to that account. |

The browser calls Google Calendar directly with the user's provider token. The publish function prefers the user's LinkedIn token and derives their person URN through userinfo. Server-side environment credentials provide a development fallback.

| Location | Responsibility |
| --- | --- |
| [index.html](index.html), [css/](css/), and [js/app.js](js/app.js) | Interface, demos, browser integrations, and publish orchestration |
| [api/config.py](api/config.py) | Public Supabase client configuration |
| [api/profile.py](api/profile.py), [api/persona.py](api/persona.py), and [api/moments.py](api/moments.py) | Profile context and persistence |
| [api/draft.py](api/draft.py) | Agnes draft generation |
| [api/safety_check.py](api/safety_check.py) and [api/publish.py](api/publish.py) | Advisory classification and LinkedIn publishing |
| [schema.sql](schema.sql) | Prototype database tables and cleanup function |
| [backend/](backend/) | Independent FastAPI mock backend |

## Preview locally

With Python 3 installed:

```sh
git clone https://github.com/Neonat/stride-linkedin-automation.git
cd stride-linkedin-automation
python3 -m http.server 8000
```

Open [localhost:8000](http://localhost:8000) and choose **Try a demo version**. This previews static pages and sample screens. A static HTTP server does not provide the `/api/*` routes needed for sign-in, generation, database access, or real publishing.

## Connected deployment

The main API needs Python 3.10 or later; the offline checks used Python 3.12. Its source lives in [api/](api/), with dependencies in [requirements.txt](requirements.txt) and function configuration in [vercel.json](vercel.json).

1. Create a Supabase project and initialise a fresh database from [schema.sql](schema.sql).
2. Configure the `google` and `linkedin_oidc` OAuth providers and the deployment's callback and redirect URLs.
3. Set the server environment using [.env.example](.env.example), then deploy to Vercel with Python-function support.

| Configuration | Purpose |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Public client configuration returned by `/api/config` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side access to profile, persona, moment, and connection data |
| `AGNES_AI_TOKEN`, optional `AGNES_MODEL` | Generation, with recorded default `agnes-2.0-flash` |
| `NVIDIA_API_SAFETY_KEY`, optional `NVIDIA_SAFETY_MODEL` | Content classification |
| LinkedIn OAuth provider token | Per-user identity resolution and publishing |
| `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_PERSON_URN`, `LINKEDIN_API_VERSION` | Server-side development fallback and legacy stats endpoint |

Keep service-role and model credentials out of static files. Copying the environment template does not configure OAuth providers or database policies. The schema is a prototype starting point, not a complete access-policy or migration package. Recorded API versions and model defaults need validation against the provider access available to the deployment.

## Independent mock API

The separate [backend/main.py](backend/main.py) provides mock login with `demo` and `password`, draft generation, and simulated publishing. Its routes and data contracts differ from the serverless API.

From the repository root:

```sh
python3.12 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/uvicorn backend.main:app --reload --port 8001
```

Open [localhost:8001/docs](http://localhost:8001/docs). A successful publish response from this mock creates no LinkedIn post.

## Checks and prototype boundaries

The HTTP regression tests run without provider calls:

```sh
python3.12 -B -m unittest discover -s tests -v
```

They check the preflight response contract. They do not validate live authentication, drafting, moderation, or publishing. Changes to connected behaviour need integration checks with the appropriate account.

- The live Publish route can create a public LinkedIn post. Review its factual claims before using it.
- Some persona and moment endpoints fall back to a shared `demo-user` when authentication is absent.
- OAuth provider tokens are cached in browser `localStorage`. The interface's session-only wording does not match that implementation.
- Coauthoring, pairing, and analytics screens include sample behaviour. The API implements only part of that design.
- The [privacy page](privacy.html) and [terms page](terms.html) are product copy. They do not establish that every described control is implemented.

## License

No project license is included.
