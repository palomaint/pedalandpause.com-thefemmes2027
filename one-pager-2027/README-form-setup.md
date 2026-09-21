# TheFemmes 2027 — corrected site

This folder replaces the old static page. It includes Vercel API routes; opening index.html directly does not run the booking/form functions. Original files were preserved separately.

## Preview and verification

Node 20 or later; no installed packages needed.

    npm test
    npm start

Visit http://127.0.0.1:4173. Deploy this folder to Vercel as an Other/static project with no build command, root output, and Node serverless functions in api/. Do not publish secrets in HTML or script.js.

## Commercial structure

Proposed dates retained from the supplied site: private access 1 October 2026 at 18:00 Madrid, ending 4 October 2026 at 18:00. Public access now starts at that same deadline (the old 40-hour gap is removed). Dates still require owner confirmation.

The first four paid bookings during private access cost €999. As soon as four are paid, remaining places cost €1,099 and can be purchased during private access. After the deadline, all remaining places cost €1,099. Single supplement €360; deposit €150. The site’s state engine no longer strands the final six places until public opening.

Private release is a link-distribution campaign, not identity verification: anyone receiving the page/payment link can forward it. If verified list-only access is required, implement authenticated invitations before publishing; this folder does not claim to enforce list membership.

## Revolut payment links — IMPORTANT

The current private-release deposit link is saved in lib/payment-draft.json and used as the default allocation unless REVOLUT_ALLOCATIONS overrides it:
https://checkout.revolut.com/pay/b94fa495-2c8e-4f45-a315-3da753efafa3

Owner confirmed a FOUR-payment limit on 21 September 2026. This replacement link has not been independently payment-tested. Verify €150 EUR, guest name/email collection, full booking-price description and expiry before launch. The previous ten-payment link is not used.

The standard-price link has been supplied: https://checkout.revolut.com/pay/40a996ce-4960-40ac-af51-0e7ba016b04a. Owner confirmed its six-payment limit and €150 deposit amount. These are owner confirmations; no test payment has been made. Checkout remains disabled by the launch flags and missing final terms. Do not set REVOLUT_LIMITS_CONFIRMED until all configured provider limits are checked.

Revolut documents payment-count limits:
https://developer.revolut.com/docs/guides/merchant/accept-payments/online-payments/hosted-checkout-page/payment-link

Simplest setup:
1. The four-payment link has been supplied. Label it “TheFemmes 2027 — €999 shared-room total; €150 deposit; €849 balance”.
2. Create a separate €150 link capped at SIX payments, labelled “TheFemmes 2027 — €1,099 shared-room total; €150 deposit; €949 balance”.
3. Configure provider-side expiry/deactivation for the €999 link at the private deadline. Hiding a website button does not revoke a copied Revolut URL.
4. Collect guest name and email in Revolut, and include/reference accepted terms. Confirm these are present in merchant payment records.
5. Test the provider’s count limit, declined payment, receipt and return flow. Never infer a successful payment from thanks.html.
6. Keep shared and single inventories consistent with confirmed hotel rooms. Single rooms remain enquiry-only unless a separate, properly capped allocation is configured.

If you create separate single-room payment links, SPLIT the existing caps. Do not give each room variant a four- or six-payment limit. ALL first-price links together <= 4; ALL links together <= 10. Never duplicate the same payment URL across allocations. One successful €150 payment is for ONE guest, not a couple.

Configure REVOLUT_ALLOCATIONS in Vercel as JSON. Example shape (replace standard URL):
[
 {"id":"private_shared","tier":"private","room":"shared","cap":4,"paid":0,"url":"https://checkout.revolut.com/pay/b94fa495-2c8e-4f45-a315-3da753efafa3"},
 {"id":"standard_shared","tier":"standard","room":"shared","cap":6,"paid":0,"url":"https://checkout.revolut.com/pay/40a996ce-4960-40ac-af51-0e7ba016b04a"}
]

The backend rejects caps above 4 discounted / 10 total and non-Revolut URLs. These checks VALIDATE CONFIGURATION; only the provider’s limits stop simultaneous payments from overselling. The site does not read or change limits in your Revolut account.

### Availability updates and cancellations

This version uses manually reconciled counts, not a Revolut webhook. Update each allocation’s paid count, TOTAL_BOOKED, PRIVATE_BOOKED and AVAILABILITY_UPDATED_AT from completed payments; redeploy to activate environment changes. The browser refreshes every 30 seconds and shows the records’ timestamp. It never labels counts as live.

Once the fourth discounted payment completes, promptly reconcile/deploy to unlock the standard offer on the page. Until then, the capped Revolut link will refuse additional payments. This is safe but not an instantaneous automated tier switch. For fully automatic transition, add a verified Revolut order/webhook integration with persistent inventory; not implemented here.

At deadline, DEACTIVATE the discounted link first, then reconcile. If fewer than four discounted places sold, increase the standard link’s permitted payments by the unused places so all ten can sell; update JSON caps to match. Never reallocate a place while an old link remains capable of accepting payment for it. Confirm how Revolut counts refunds before changing quotas. Do not simply decrement counters for a refund.

## Required Vercel configuration

Copy names from .env.example into Vercel project settings. No environment file is served.

Checkout requires all four flags explicitly true:
- RELEASE_CONFIRMED: owner approved dates and price structure.
- PACKAGE_CONFIRMED: inclusions, guiding, room inventory and breakfast resolved.
- TERMS_CONFIRMED: full cancellation, minimum group and departure terms finalised.
- REVOLUT_LIMITS_CONFIRMED: actual payment limits, expiry and inventories match the allocations.

Set BOOKING_TERMS_URL to the real full terms page. Configure privacy information for the form. TOTAL_BOOKED and PRIVATE_BOOKED must equal allocation paid counts. A blank payment option is unavailable, not silently routed to a different offer.

## Enquiry form setup

The form includes an optional premium-carbon bike rental quote checkbox. Its bike_rental value is saved in the appended Sheet column and included in the email notification. Redeploy Apps Script after adding this field.

The form is now for questions / launch updates only. It never claims to reserve a place, and it no longer emails payment links as its booking flow.

1. Create a Google Sheet and its bound Apps Script. Paste apps-script.gs.
2. Generate a long random shared secret locally. Store the same value as FORM_SHARED_SECRET in Apps Script **Script Properties** and Vercel **environment variables**, never browser code.
3. Deploy Apps Script as a web app, execute as owner, accessible to Anyone. Store its /exec URL in Vercel APPS_SCRIPT_URL.
4. The browser submits to /api/register. Vercel validates the input and signs a short-lived request to Apps Script. The receiver verifies it, locks concurrent writes, writes to Enquiries, and acknowledges the request ID.
5. The browser shows success only after that acknowledgement. Network errors leave inputs intact. Retries carry the same ID, so a lost acknowledgement does not duplicate the stored enquiry.
6. Sheet formula injection is neutralised. Email notification failure does not turn a successfully stored enquiry into an error.
7. Configure Vercel platform rate limiting / bot protection for /api/register before a public campaign, and publish the actual privacy notice. Never put medical information into this general enquiry sheet.
8. Test a real enquiry with your own email after deployment and verify the row and acknowledgement. The UI tests do not prove your Google deployment is connected.

## Analytics

Client events: pricing_section_view, checkout_start, enquiry_received. None contains contact data. There is deliberately NO browser deposit_paid event. Measure actual payments from Revolut records, or add verified webhooks. thanks.html is an unverified return page and cannot create a receipt or booking confirmation.

## Files

index.html: content, styling, room choice and enquiry forms.
script.js: responsive navigation, release rendering, API requests.
offer.js: pure shared state/price helpers.
api/offer.js: current offer and available payment allocations.
api/checkout.js: validates state/config/option/terms and returns the configured Revolut URL.
api/register.js: acknowledged, signed enquiry relay.
lib/config.js: server-only settings and readiness checks.
apps-script.gs: idempotent Sheet receiver.
thanks.html: truthful payment-return guidance.

No deployment, payment, real submission, hotel commitment or account change was made during these edits.

## Supplied Google deployment

https://script.google.com/macros/s/AKfycbyqV81dNgl6bsB9CvVnnUYhCD7QjFHtway695tJRjRM1Ju_qoEDNkY_-IlZQJiSxWrh/exec

This URL is the server-side default in api/register.js; APPS_SCRIPT_URL can override it. Deployment URL received, but no successful submission has been verified. FORM_SHARED_SECRET must still be set privately to the same value in Vercel and Apps Script.
