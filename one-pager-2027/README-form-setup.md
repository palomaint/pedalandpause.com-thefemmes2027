# The Femmes 2027 - connecting the form to Google Sheets

Same pattern as the LEAD DIFFERENTLY retreat site. About ten minutes.

## 1. Create the sheet
1. Google Drive > New > Google Sheets. Name it **The Femmes 2027 registrations**.
2. Extensions > Apps Script. Delete the sample code, paste in the whole of `apps-script.gs`, save.

## 2. Deploy it as a web app
1. Deploy > New deployment > (gear icon) Web app.
2. Description: `v1`. Execute as: **Me**. Who has access: **Anyone**.
3. Deploy. Authorise when prompted (it needs Sheets + Mail).
4. Copy the **Web app URL** - it ends in `/exec`.

## 3. Wire the page
1. Open `script.js`, replace `PASTE_APPS_SCRIPT_URL_HERE` with the /exec URL.
2. In `index.html`, bump `script.js?v=1` to `?v=2` so browsers don't use a cached copy.
3. Upload / push the folder.

## 4. Verify - do not skip this
The page shows "Thank you" whenever the request *leaves the browser*, even if the endpoint
is dead (that is exactly how responses were lost on the retreat site). Prove it works:

```bash
curl -L -X POST "PASTE_/exec_URL" \
  -d "name=Curl Test&email=test@example.com&phone=+34600000000&room=Double-share&consent=Yes&camp=The Femmes 2027"
```

You should see `{"ok":true}` and a new row in the **Registrations** tab. Delete the test row.

## Every time you change apps-script.gs
Deploy > Manage deployments > pencil > Version: **New version** > Deploy.
Saving the code is not enough - the /exec URL serves only the deployed version.
Then run the curl test again.

## Columns written
submitted_at, name, email, phone, country, intent, room, level, friend, transfer, notes, consent, offer_state, camp, page

---

# The private release - how the offer engine works

Everything about the offer lives in **one config block at the top of `script.js`** (`OFFER`).
The page reads it on load and shows the right state automatically. Nothing else needs editing.

## Before publishing - fill these in

| Key | What it is | Currently |
|---|---|---|
| `privateOpens` | When the interest list can start booking | placeholder - TODO |
| `privateDeadline` | 72 h later. The countdown is derived from this; it is the same for everyone and cannot restart on refresh | placeholder - TODO |
| `publicOpens` | When public booking opens. Selling out private early does NOT bring this forward | placeholder - TODO |
| `confirmBy` / `minGroup` | Departure-confirmation date and minimum riders, shown in the booking terms | placeholder - TODO |
| `checkoutPrivate` / `checkoutPublic` | Leave empty - payment is by Revolut link, sent by email (see below) | empty |

Dates are ISO strings with the Madrid offset, e.g. `2026-10-01T18:00:00+02:00`.
All times display in Europe/Madrid regardless of where the visitor is.

## Keeping availability honest
`privateBooked` and `totalBooked` must be updated **by hand from paid deposits** (your Revolut account and the
Registrations sheet). Interest registrations and page views never touch them. When you update them,
bump `script.js?v=N` in index.html and republish.

## Offer states (automatic)
| Condition | Visitors see |
|---|---|
| now < privateOpens | "Opens [date]" - no booking button |
| private open, places left, before deadline | EUR999 button, countdown, X of 4 / Y of 10 |
| privateBooked = 4 | "Private release sold out"; public opening date stays visible |
| deadline passed | "Private release closed"; EUR999 button removed |
| now >= publicOpens | EUR1,099 becomes the main card with remaining camp places |
| totalBooked = 10 | Every button becomes "Join the cancellation waiting list" (goes to the form) |

To preview any state without waiting, temporarily set the dates/counts in `OFFER` and reload.

## Taking the deposit - Revolut, by hand
There is no online checkout. Every booking button sends the rider to the registration form with the
`intent` column pre-filled ("Private release EUR999 - send deposit link" / "Public release EUR1,099 - send
deposit link" / "Cancellation waiting list"), so you can see in the sheet exactly what each person is asking for.

The loop for each registration:
1. Registration arrives (email alert + a row in the sheet).
2. Reply by email with a **Revolut payment link for EUR150** - state the total (EUR999 or EUR1,099) and
   the balance (EUR849 / EUR949, due 23 Aug 2027) in the same email, so the deposit never looks like the price.
3. When the EUR150 lands, increase `privateBooked` and/or `totalBooked` in `script.js`, bump `?v=`, republish.
   The counts on the page - and the sold-out / closed states - follow from those two numbers only.
4. Send the confirmation. You can link `thanks.html?tier=private` (or `?tier=public`) in it - that page
   shows their total, deposit, balance, due date and what happens next.

**The caps are yours to enforce**: only ever send four private-release links, and if a fifth registration
comes in during the window, tell them it's the public price. First four deposits *paid* win - a sent link
is not a held place, and the page says so. A rider who registers but never pays does not consume a place.
Cancellations: refund via Revolut, reduce the count by one, republish.

| `checkoutPrivate` / `checkoutPublic` | Leave empty. Only used if you ever adopt a hosted checkout. |
|---|---|

## Tracking
`script.js` fires `pricing_section_view`, `booking_button_click`, `checkout_start`, `form_submitted`,
and `thanks.html` fires `deposit_paid`. They go to Plausible, GA4 (gtag) or a GTM dataLayer -
whichever is on the page. Add one script tag for your analytics tool and the funnel is live.
