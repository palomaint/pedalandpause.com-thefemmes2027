# Publish TheFemmes with Cloudflare Pages and a Wix domain

Use a new **Pages** project linked to the existing GitHub repository. The existing Worker can stay in place while Pages is verified. No domain transfer is needed.

## 1. Create the Pages project

In Cloudflare Workers & Pages, choose Create application, then the Pages option (sometimes labelled Get started under Pages), then connect GitHub. Select `palomaint/pedalandpause.com-thefemmes2027`.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Root directory | Leave blank (repository root) |
| Build command | `npm run build:pages` |
| Build output directory | `dist-pages` |
| Build environment variable | `NODE_VERSION=22` |

Pages uses its own deployment process: do not enter `npx wrangler deploy`. The existing `wrangler.jsonc` is for the earlier Worker only; it has no Pages output setting. Pages settings and runtime variables are managed in its dashboard.

The build packages the existing booking backend into Pages' reserved `_worker.js` entry point. `_routes.json` sends only `/api/*` through the function. Static files use `public/_headers`. No credentials are included in the bundle. Registration stays disabled until configured.

## 2. Add the Wix subdomain

After the Pages deployment succeeds, open its Custom domains section and add `thefemmes.pedalandpause.com` first. Cloudflare will show the exact CNAME target, normally your project's `*.pages.dev` address.

In Wix, open the domain's DNS records and add a CNAME with host `thefemmes` and the exact target Cloudflare supplies (no https:// or path). If that host already exists, review it before replacing anything. Preserve the main website and email records. Do not change nameservers.

Wait for Cloudflare to verify the domain and issue its HTTPS certificate, then check the site on the custom address.

## 3. Connect the booking backend

Create a Supabase project and run `database/setup.sql`. Create a Cloudflare Turnstile widget allowing the final custom hostname.

In the Pages project's Settings → Variables and Secrets, configure Production:

- `REGISTRATION_ENABLED=false` until final live testing is ready.
- `SITE_ORIGIN=https://thefemmes.pedalandpause.com` (no trailing slash).
- `SUPABASE_URL`: your project's HTTPS URL.
- `TURNSTILE_SITE_KEY`: public widget key.
- `MAY_TIER=first`
- `OCTOBER_TIER=first`

Store `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY` as encrypted secrets. Never put them in GitHub or chat. Redeploy after changing these settings. Keep Preview registration disabled and do not copy production secrets to previews.

After reviewing booking conditions and the privacy notice, set Production `REGISTRATION_ENABLED=true`, redeploy, and submit a clearly labelled test. Check the stored row, edition, room, rental preference and price. Success must mean the database acknowledged storage. Email notifications use Resend when configured below; Google Sheets sync is not implemented. Requests do not reserve seats or take payment.

## 4. Manage prices

Change the appropriate Production variable `MAY_TIER` or `OCTOBER_TIER` to `standard` after four verified introductory bookings, or `full` when capacity is exhausted, and redeploy. Reconcile payments and room occupancy manually before changing tiers.

## Verification

`npm test` checks validation, server-owned prices, mocked CAPTCHA/storage, request limits, the Cloudflare adapter and the actual self-contained Pages bundle. Live storage and CAPTCHA testing needs the configured accounts.

References:
- https://developers.cloudflare.com/pages/functions/advanced-mode/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://support.wix.com/en/article/connecting-a-wix-domain-to-an-external-site

## Email notifications

Production settings: `RESEND_API_KEY` (encrypted secret), `EMAIL_FROM` (verified sending-domain address), and `NOTIFICATION_EMAIL` (host inbox). Redeploy after setting them. Newly inserted requests send separate host and guest emails; replies to the guest acknowledgement go to the host inbox. Duplicate registration retries do not resend emails.

Email errors do not change the saved booking result. Failed sends are logged with request ID and recipient role index (0 host, 1 guest), without message content or credentials. Automatic background retries are not implemented; check Resend and Supabase if delivery fails. Test with an address you control and confirm both messages arrive.
