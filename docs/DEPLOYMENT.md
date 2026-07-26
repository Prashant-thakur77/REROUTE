# Deploying REROUTE to Google Cloud Run

REROUTE ships as a **standalone Next.js** app in a multi-stage Docker image
(Node 22 Alpine, non-root user), deployed to **Cloud Run** (serverless,
autoscaling, scale-to-zero). This is the recommended production path.

---

## 0. Prerequisites (one-time)

```bash
# Install the gcloud CLI, then:
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable the APIs Cloud Run + Cloud Build need:
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 1. Environment variables

Two kinds:

- **Build-time (browser) vars** — `NEXT_PUBLIC_*`. Baked into the client bundle
  during `docker build`. Defaults live in the `Dockerfile` as `ARG`s; override
  per build (see below) for a different Supabase project.
- **Runtime (server-only secrets)** — `SUPABASE_SERVICE_ROLE_KEY`,
  `GOOGLE_API_KEY`, `TAVILY_API_KEY`, `OPENWEATHER_API_KEY`, `MEM0_API_KEY`,
  `UPSTASH_*`, etc. Passed to Cloud Run at deploy time via **`.env.yaml`**
  (gitignored — never commit real secrets). Format:

```yaml
SUPABASE_URL: "https://YOUR_PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY: "..."
GOOGLE_API_KEY: "..."
GOOGLE_GENERATIVE_AI_API_KEY: "..."
TAVILY_API_KEY: "..."
OPENWEATHER_API_KEY: "..."
MEM0_API_KEY: "..."
UPSTASH_REDIS_URL: "..."
UPSTASH_REDIS_TOKEN: "..."
```

(Use `.env.example` as the field list.)

## 2. One-command deploy (uses the existing script)

```bash
pnpm run deploy:gcp
```

That runs, under the hood:

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT/reroute-ai
gcloud run deploy reroute-ai \
  --image gcr.io/YOUR_PROJECT/reroute-ai \
  --platform managed --region us-central1 \
  --allow-unauthenticated \
  --env-vars-file=.env.yaml
```

> Edit the project id in the `deploy:gcp` script (`package.json`) to your own.

## 3. Deploy with a different Supabase project (override build args)

If your Supabase URL/anon key differ from the Dockerfile defaults, build with
Cloud Build substitutions or a local docker build:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY \
  -t gcr.io/YOUR_PROJECT/reroute-ai .
docker push gcr.io/YOUR_PROJECT/reroute-ai
gcloud run deploy reroute-ai --image gcr.io/YOUR_PROJECT/reroute-ai \
  --region us-central1 --allow-unauthenticated --env-vars-file=.env.yaml
```

## 4. Recommended Cloud Run settings

```bash
gcloud run services update reroute-ai --region us-central1 \
  --memory 1Gi --cpu 1 --min-instances 0 --max-instances 10 --concurrency 80
```

- **min-instances 0** → scale-to-zero (no cost when idle).
- **max-instances / concurrency** → cap and pack for burst load.
- The app is **stateless** (all state in Supabase), so horizontal autoscaling is
  safe out of the box.

## 5. Post-deploy checklist

1. Run the SQL migrations in Supabase (`supabase_alert_actions.sql`,
   `supabase_adk_tables.sql`, `supabase_forecasts_table.sql`) and confirm RLS is on.
2. Set Supabase **Auth → URL Configuration** redirect URLs to the Cloud Run URL.
3. Open the Cloud Run URL, sign in, and smoke-test: import a CSV twin → open a
   threat alert → Reroute / Generate mitigation → resolve.
4. (Optional) Map a custom domain: `gcloud run domain-mappings create`.

## Alternative: Vercel
`vercel --prod` also works (Next.js native). Set the same env vars in the Vercel
dashboard. Cloud Run is preferred here for the Docker/standalone parity and
scale-to-zero economics.
