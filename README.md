# Current deployment: Cloudflare Pages

For the Wix-owned domain, follow [CLOUDFLARE-SETUP.md](CLOUDFLARE-SETUP.md). Use `npm run build:pages` with output `dist-pages`. The Worker commands below are retained only for the earlier deployment.

# TheFemmes 2027 — Pedal & Pause

Responsive two-edition website, with a registration API for a private Supabase database. No application dependencies, trackers, secret values or payment-card collection in the browser.

## Current status

The page is built for review. Registration is disabled by default until configured. No new database/account has been created, no repository has been published, no deployment has been made and no real booking has been submitted. Payment links are deliberately not embedded: May has no confirmed links yet, and 2027 payment/cancellation conditions still need to be finalised. This implementation uses a request → host confirmation → payment flow, not an automatic inventory/checkout system.

## Review locally

Use Node 22 or newer. Run `npm start`, then open http://127.0.0.1:4174/. Run `npm test` for focused backend checks and `npm run build` to produce `dist/`. No installation is required.

## Cloudflare deployment (recommended)

Follow `CLOUDFLARE-SETUP.md`. The site now includes a Worker entrypoint, static-asset security headers and GitHub-compatible Cloudflare deployment configuration. The original Vercel route remains available as an alternative.

## GitHub and alternative Vercel hosting

Create a private GitHub repository and upload the contents of this folder, preserving its structure. Do not upload populated environment files or database exports. Source files under `public/` form the website; server-only code lives in `api/` and `lib/`.

On Vercel import the repository, select framework **Other**, use build command `npm run build` and output directory `dist`. The supplied `vercel.json` configures these and browser security headers. API functions deploy from `api/`. Select Node 22 or newer.

Vercel Hobby is restricted to personal, non-commercial use. This commercial camp website needs an eligible Vercel plan or another suitable host. The static website is portable; another host needs equivalent API functions and headers. See https://vercel.com/docs/plans/hobby.

## Connect registrations

1. Create a Supabase project in an appropriate region under your account. Run `database/setup.sql` in its SQL editor. Row-level security is enabled and anonymous/authenticated client access is revoked. Only the server service role writes submissions.
2. Create a Cloudflare Turnstile widget restricted to your website hostname. This service validates anti-bot tokens on the server, including hostname and `booking` action. Do not use test keys in production.
3. Add the variables from `.env.example` in your hosting settings. Secrets belong in server environment variables only. `SITE_ORIGIN` must be the exact HTTPS origin, without a trailing slash, e.g. `https://thefemmes.example.com`. Preview domains need separate matching settings and Turnstile hostnames.
4. Keep `REGISTRATION_ENABLED=false` until ready. Complete and review the privacy notice: controller details, actual providers, retention policy, international transfers where applicable, and handling of rights requests. The bundled notice is an initial operational description, not a legal approval.
5. Set `REGISTRATION_ENABLED=true`, redeploy, submit one clearly labelled test, and verify the row in Supabase. Check retry behaviour and error handling before launch. Never place real guest details into test fixtures.

There is no Apps Script dependency. There is no email notification or Sheet sync configured in this version. Manage registrations in Supabase's table editor, or export a CSV for your own register. Treat exported guest text as untrusted and import as text to avoid spreadsheet formula execution. The saved record separates pending review, awaiting payment, confirmed and cancelled. Only an authorised operator should mark a payment confirmed.

## Price and capacity operations

May: 15–21 May, 8 guests, first four €749 then €795. October: 22–28 October, 10 guests, first four €999 then €1,099. October private room adds €360. Casa private rooms require a quote and reduce guest capacity; shared en-suite preference is not a paid or guaranteed upgrade in this build.

Set `MAY_TIER` and `OCTOBER_TIER` independently to `first`, `standard` or `full`; redeploy when changed. These are manual public price settings, not live remaining-seat counts. The API calculates indicative prices server-side. A submitted request neither reserves a seat nor guarantees a tier. Confirm the actual allocation and room before requesting payment. Keep a per-edition record of verified payments and reduce the capacity for private Casa rooms. Do not collect payment beyond room/group capacity.

## Before accepting deposits

- Finalise deposit amounts, balance deadlines, cancellation terms and minimum departure size for both editions.
- Confirm supplier/favour arrangements and the final programme for both dates.
- Confirm the Casa room policy and the treatment of all advertised consumer prices.
- Create the appropriate May payment links; verify October links and remaining limits. A payment return page is not evidence of payment.
- Send customers their agreed total, conditions and correct payment link after reviewing their request. Record the verified payment reference and booking status.
- Configure an appropriate host-level request rate limit and monitor failed submissions. Turnstile and the honeypot reduce automated abuse but are not a guarantee against all abuse.
- Test production end to end, including real database acknowledgement. Unit tests use mocked services and do not establish that the deployed credentials are correct.

## Content and assets

Original one-pager folders remain unchanged. Images were copied from the supplied Casa and Bellver sites; the Pedal & Pause logo is supplied by the owner. Other experience previews use the three supplied promotional images, displayed in full at 16:9, and direct verified Understory links. No invented guest testimonials or live remaining-seat claims are included.

Main copy: `public/index.html`. Layout: `public/styles.css`. Form: `public/app.js`. API validation/prices: `lib/booking.js`. Browser security policy: `vercel.json`. Keep headings and buttons aligned with the supplied #fe5756 accent.

Security references: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/ and https://supabase.com/docs/guides/api/securing-your-api.
