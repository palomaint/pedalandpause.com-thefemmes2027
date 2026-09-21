# Publish TheFemmes on Cloudflare

## 1. Put the project in GitHub

Unzip the delivery package. Create a private GitHub repository, for example `thefemmes-2027`, and upload the project contents so `package.json`, `wrangler.jsonc` and `worker.mjs` appear at the repository root. Upload all folders as well. Do not upload `node_modules`, `.env`, `.dev.vars`, `.wrangler` or real guest data.

## 2. Connect Cloudflare

In Cloudflare, open Workers & Pages and create an application by importing a GitHub repository. Choose **Workers**, not a static-only file upload. Authorise only the needed repository.

Use these settings:

| Setting | Value |
|---|---|
| Worker/project name | `thefemmes-2027` (must match wrangler.jsonc) |
| Root directory | Repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | 22 or newer (set build variable NODE_VERSION=22 if necessary) |

Cloudflare installs the locked dependencies. Static assets are in `dist`; `/api/*` routes run in the Worker. The first deployment is safe to review: registration is closed by default. Copy its `https://...workers.dev` URL for the connection steps. Add a custom domain later if desired.

## 3. Connect your registration storage and anti-spam check

Create your Supabase project and run `database/setup.sql`. Create a Cloudflare Turnstile widget that allows the published hostname.

Under the Worker's runtime **Settings → Variables and Secrets**, add these as **secrets**, not public build variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY`

Add the following non-secret runtime values to the `vars` object in `wrangler.jsonc`, then commit and push. Keeping ordinary variables in the file avoids a later GitHub deployment overwriting dashboard-only settings:

- `SITE_ORIGIN`: the exact site origin, e.g. `https://thefemmes-2027.example.workers.dev`, with no trailing slash.
- `SUPABASE_URL`: your project's HTTPS URL.
- `TURNSTILE_SITE_KEY`: your widget's public site key.

Keep `REGISTRATION_ENABLED` set to `false` until the privacy notice and booking workflow have been reviewed. Then change it to `true`, commit and deploy. Never put a secret in `wrangler.jsonc` or paste it into chat.

## 4. Verify before sharing with guests

Submit a clearly labelled test registration on the published site. Check that the matching row appears in the database as `pending_review`, with the correct edition, room and rental preference. A success message is only returned after the database acknowledges storage. Email notification and Sheet synchronisation are not enabled in this version. Registration does not reserve a seat or take payment.

Confirm the guest's room, total price and conditions before sending their Revolut link. Mark the booking confirmed only after you verify payment. Configure host-level rate limiting for the registration endpoint and monitor submissions. Never open public read access to the database table.

## Price allocations

Change `MAY_TIER` or `OCTOBER_TIER` in `wrangler.jsonc` to `standard` after four verified introductory bookings, or `full` when capacity is exhausted, then push. Requests are not payments and must not count as confirmed seats. Reconcile room occupancy as well as guest numbers, especially for private Casa rooms.

## What has been tested locally

The shared registration logic and Cloudflare request adapter have automated checks covering validation, server-owned prices, origin checks, mocked anti-spam/database responses, method routing, size limits and disabled registration. A deployment dry run validates packaging. A live database/Turnstile test still requires your own configured accounts.

Reference: https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/
