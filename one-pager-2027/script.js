/* The Femmes 2027 - page script
   ------------------------------------------------------------------
   Section 1: OFFER CONFIG  <- the only block you should need to edit
   Section 2: offer engine (states, countdown, counts, buttons, sticky bar)
   Section 3: registration form -> Google Sheets
   Section 4: tracking hooks
   After editing, bump ?v= on the <script> tag in index.html.           */
(function () {
  'use strict';

  /* =============================== 1. OFFER CONFIG =============================== */
  var OFFER = {
    // Dates are ISO strings WITH the Madrid offset (+02:00 in summer, +01:00 in winter).
    // These are the single fixed deadlines every visitor sees; the countdown is derived
    // from them, so it can never restart on refresh.
    privateOpens:    '2026-10-01T18:00:00+02:00',   // TODO confirm
    privateDeadline: '2026-10-04T18:00:00+02:00',   // TODO confirm - 72 h after privateOpens
    publicOpens:     '2026-10-06T10:00:00+02:00',   // TODO confirm - does NOT move earlier if private sells out
    confirmBy:       '2027-07-23',                  // TODO confirm - departure-confirmation date shown in terms
    minGroup:        6,                             // TODO confirm - minimum riders for the camp to run

    totalPlaces: 10,
    privatePlaces: 4,
    interestCount: 80,

    // Update these two from actual PAID deposits (Stripe dashboard / the Registrations sheet).
    // Interest registrations and page views must never change them.
    privateBooked: 0,
    totalBooked: 0,

    // Payment is by Revolut link, sent by email after a registration comes in - so these stay
    // empty and every booking button goes to the registration form with the intent pre-filled.
    // (If you ever move to a hosted checkout, paste its URLs here and the buttons switch over.)
    checkoutPrivate: '',
    checkoutPublic:  '',

    pricePrivate: 999,
    pricePublic: 1099,
    deposit: 150
  };

  /* =============================== helpers =============================== */
  var $ = function (id) { return document.getElementById(id); };
  var MADRID = 'Europe/Madrid';
  function fmtLong(iso) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: MADRID, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      .format(new Date(iso)).replace(',', '') + ' (Madrid time)';
  }
  function fmtShort(iso) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: MADRID, day: 'numeric', month: 'short' }).format(new Date(iso));
  }
  function fmtDay(iso) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: MADRID, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  }
  function eur(n) { return '\u20AC' + n.toLocaleString('en-GB'); }
  function setText(id, txt) { var el = $(id); if (el) el.textContent = txt; }
  function setHTML(id, html) { var el = $(id); if (el) el.innerHTML = html; }

  /* =============================== 4. tracking =============================== */
  // Fires to whatever analytics is on the page: Plausible, GA4 (gtag), or a GTM dataLayer.
  // Add one of those and these events start flowing; without them it is a no-op.
  function track(name, props) {
    props = props || {};
    try { if (window.plausible) window.plausible(name, { props: props }); } catch (e) {}
    try { if (window.gtag) window.gtag('event', name, props); } catch (e) {}
    try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, props)); } catch (e) {}
  }
  window.fmTrack = track;

  /* =============================== 2. offer engine =============================== */
  function offerState(now) {
    var pOpen = new Date(OFFER.privateOpens), pEnd = new Date(OFFER.privateDeadline), pubOpen = new Date(OFFER.publicOpens);
    var privateLeft = Math.max(0, OFFER.privatePlaces - OFFER.privateBooked);
    var totalLeft = Math.max(0, OFFER.totalPlaces - OFFER.totalBooked);
    if (totalLeft === 0) return 'sold_out';
    if (now >= pubOpen) return 'public_open';
    if (now < pOpen) return 'before_private';
    if (privateLeft === 0) return 'private_sold_out';
    if (now >= pEnd) return 'private_closed';
    return 'private_open';
  }

  function bookHref(tier) {
    var url = tier === 'private' ? OFFER.checkoutPrivate : OFFER.checkoutPublic;
    return url || '#register';
  }
  function bookBtn(tier, label, extraClass) {
    return '<a class="fm-btn fm-btn-primary fm-book-btn ' + (extraClass || '') + '" href="' + bookHref(tier) + '" data-tier="' + tier + '" data-track="' + tier + '_book">' + label + '</a>';
  }
  function staticLabel(text) { return '<span class="fm-card-static">' + text + '</span>'; }
  function heroToPublicTeaser() {
    setHTML('fm-hero-fine', 'The private release has closed. Remaining places open to public booking at ' + eur(OFFER.pricePublic) + ' on ' + fmtLong(OFFER.publicOpens) + '.');
    document.querySelectorAll('[data-track="hero_book"],[data-track="cta_book"]').forEach(function (b) { b.textContent = 'See the public release'; b.setAttribute('href', '#pricing'); });
  }

  function renderOffer() {
    var now = new Date();
    var state = offerState(now);
    var privateLeft = Math.max(0, OFFER.privatePlaces - OFFER.privateBooked);
    var totalLeft = Math.max(0, OFFER.totalPlaces - OFFER.totalBooked);

    // dates in copy
    document.querySelectorAll('[data-date]').forEach(function (el) { el.textContent = fmtLong(OFFER[el.getAttribute('data-date')]); });
    document.querySelectorAll('[data-date-short]').forEach(function (el) {
      var k = el.getAttribute('data-date-short'); el.textContent = k === 'confirmBy' ? fmtDay(OFFER[k]) : fmtShort(OFFER[k]);
    });
    document.querySelectorAll('[data-config]').forEach(function (el) { el.textContent = OFFER[el.getAttribute('data-config')]; });
    setText('fm-interest-count', OFFER.interestCount);

    // counts (from booking records only)
    setText('fm-private-left', privateLeft);
    setText('fm-total-left', totalLeft);
    setText('fm-total-left-2', totalLeft);

    var privateCard = $('fm-card-private'), publicCard = $('fm-card-public');
    var barOn = false, barTotal = '', barLabel = 'Reserve my place', barHref = '#pricing';

    switch (state) {
      case 'before_private':
        setText('fm-private-badge', 'Private release \u00B7 opens ' + fmtShort(OFFER.privateOpens));
        setHTML('fm-private-action', staticLabel('Opens ' + fmtLong(OFFER.privateOpens)));
        setText('fm-deadline-label', 'Private pricing opens');
        $('fm-countdown').hidden = true;
        setHTML('fm-deadline-when', 'Booking opens for the interest list on ' + fmtLong(OFFER.privateOpens) + ' and runs for 72 hours or until four places are taken.');
        setHTML('fm-public-action', staticLabel('Opens ' + fmtShort(OFFER.publicOpens)));
        setText('fm-hero-release', 'Private release \u00B7 opens ' + fmtShort(OFFER.privateOpens));
        break;

      case 'private_open':
        setText('fm-private-badge', 'Private release \u00B7 first 4 bookings');
        setHTML('fm-private-action', bookBtn('private', 'Secure my ' + eur(OFFER.pricePrivate) + ' place'));
        setText('fm-deadline-label', 'Private pricing ends in');
        $('fm-countdown').hidden = false;
        setHTML('fm-public-action', staticLabel('Opens ' + fmtShort(OFFER.publicOpens)));
        setText('fm-hero-release', 'Private release open \u00B7 first 4 bookings \u00B7 72 hours');
        barOn = true; barTotal = eur(OFFER.pricePrivate) + ' total'; barHref = bookHref('private');
        break;

      case 'private_sold_out':
        setText('fm-private-badge', 'Private release sold out');
        $('fm-private-badge').classList.add('fm-badge-muted');
        setHTML('fm-private-action', staticLabel('Private release sold out'));
        $('fm-deadline').hidden = true;
        setHTML('fm-public-copy', 'All four private-release places are taken. Remaining places open to public booking on <strong>' + fmtLong(OFFER.publicOpens) + '</strong>.');
        setHTML('fm-public-action', staticLabel('Opens ' + fmtShort(OFFER.publicOpens)));
        setText('fm-hero-release', 'Private release sold out \u00B7 public release ' + fmtShort(OFFER.publicOpens));
        heroToPublicTeaser();
        break;

      case 'private_closed':
        setText('fm-private-badge', 'Private release closed');
        $('fm-private-badge').classList.add('fm-badge-muted');
        setHTML('fm-private-action', staticLabel('Private release closed'));
        $('fm-deadline').hidden = true;
        setHTML('fm-public-copy', 'The private window has closed. Remaining places open to public booking on <strong>' + fmtLong(OFFER.publicOpens) + '</strong>.');
        setHTML('fm-public-action', staticLabel('Opens ' + fmtShort(OFFER.publicOpens)));
        setText('fm-hero-release', 'Private release closed \u00B7 public release ' + fmtShort(OFFER.publicOpens));
        heroToPublicTeaser();
        break;

      case 'public_open':
        // public price becomes the main offer; the private card steps back
        privateCard.classList.remove('fm-card-private'); privateCard.classList.add('fm-card-public');
        publicCard.classList.remove('fm-card-public'); publicCard.classList.add('fm-card-private');
        setText('fm-private-badge', 'Private release closed');
        $('fm-private-badge').classList.add('fm-badge-muted');
        setHTML('fm-private-action', staticLabel('Private release closed'));
        $('fm-deadline').hidden = true;
        $('fm-card-private').querySelector('.fm-counts').hidden = true;
        setHTML('fm-public-copy', 'Public booking is open. ' + totalLeft + ' of ' + OFFER.totalPlaces + ' camp places remain.');
        setHTML('fm-public-action', bookBtn('public', 'Reserve my ' + eur(OFFER.pricePublic) + ' place'));
        $('fm-public-counts').hidden = false;
        setText('fm-hero-release', 'Public release open \u00B7 ' + totalLeft + ' places left');
        setHTML('fm-hero-fine', 'Public release: ' + eur(OFFER.pricePublic) + ' per person, shared double room. A ' + eur(OFFER.deposit) + ' deposit reserves your place.');
        document.querySelectorAll('[data-track="hero_book"],[data-track="cta_book"]').forEach(function (b) { b.textContent = 'Reserve my ' + eur(OFFER.pricePublic) + ' place'; });
        barOn = true; barTotal = eur(OFFER.pricePublic) + ' total'; barHref = bookHref('public');
        break;

      case 'sold_out':
        setText('fm-private-badge', 'Fully booked');
        $('fm-private-badge').classList.add('fm-badge-muted');
        setHTML('fm-private-action', '<a class="fm-btn fm-btn-secondary fm-book-btn" href="#register" data-tier="waitlist" data-track="waitlist">Join the cancellation waiting list</a>');
        $('fm-deadline').hidden = true;
        setHTML('fm-public-copy', 'All ten places are booked. Join the waiting list and you\u2019re first to hear if one comes free.');
        setHTML('fm-public-action', '<a class="fm-btn fm-btn-secondary fm-book-btn" href="#register" data-tier="waitlist" data-track="waitlist">Join the cancellation waiting list</a>');
        setText('fm-hero-release', 'Fully booked \u00B7 waiting list open');
        setHTML('fm-hero-fine', 'All ten places for 2027 are taken. Join the cancellation waiting list and you\u2019re first to hear if one comes free.');
        document.querySelectorAll('[data-track="hero_book"],[data-track="cta_book"]').forEach(function (b) { b.textContent = 'Join the cancellation waiting list'; b.setAttribute('href', '#register'); b.setAttribute('data-tier', 'waitlist'); });
        setText('fm-register-h2', 'Join the cancellation waiting list.');
        setText('fm-register-lead', 'Leave your details and you\u2019re first in line if a place comes free. No payment, no obligation.');
        break;
    }

    // sticky bar (mobile only via CSS); hidden while the pricing cards or the form are on screen
    var bar = $('fm-bar');
    if (barOn) {
      $('fm-bar-total').textContent = barTotal;
      $('fm-bar-btn').setAttribute('href', barHref);
      $('fm-bar-btn').textContent = barLabel;
      document.body.classList.add('fm-bar-on'); bar.setAttribute('aria-hidden', 'false');
      if ('IntersectionObserver' in window) {
        var hideNear = new IntersectionObserver(function (entries) {
          var anyVisible = entries.some(function (e) { return e.isIntersecting; });
          bar.style.display = anyVisible ? 'none' : '';
        }, { threshold: 0.05 });
        [$('fm-card-private'), $('fm-register')].forEach(function (el) { if (el) hideNear.observe(el); });
      }
    } else {
      document.body.classList.remove('fm-bar-on'); bar.setAttribute('aria-hidden', 'true');
    }

    document.body.setAttribute('data-offer-state', state);
    return state;
  }

  function tickCountdown() {
    var el = $('fm-countdown'); if (!el || el.hidden) return;
    var ms = new Date(OFFER.privateDeadline) - new Date();
    if (ms <= 0) { renderOffer(); return; }
    var m = Math.floor(ms / 60000);
    setText('cd-d', Math.floor(m / 1440));
    setText('cd-h', Math.floor((m % 1440) / 60));
    setText('cd-m', m % 60);
  }

  var state = renderOffer();
  tickCountdown();
  // Preview any state from the browser console without editing the file, e.g.
  //   FM.offer.privateBooked = 4; FM.render()
  window.FM = { offer: OFFER, render: function () { location.reload(); } };
  try {
    var ov = sessionStorage.getItem('fm-offer-override');
    if (ov) { Object.assign(OFFER, JSON.parse(ov)); state = renderOffer(); tickCountdown(); }
  } catch (e) {}
  setInterval(tickCountdown, 30000);
  // re-evaluate state when a deadline passes while the page is open
  [OFFER.privateOpens, OFFER.privateDeadline, OFFER.publicOpens].forEach(function (iso) {
    var wait = new Date(iso) - new Date();
    if (wait > 0 && wait < 2147483647) setTimeout(function () { renderOffer(); tickCountdown(); }, wait + 500);
  });

  // booking buttons: track, and when falling back to the form, pre-set the intent
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.fm-book-btn'); if (!a) return;
    var tier = a.getAttribute('data-tier') || '';
    var href = a.getAttribute('href') || '';
    track('booking_button_click', { tier: tier, source: a.getAttribute('data-track') || '', state: state });
    if (/^https?:/.test(href)) { track('checkout_start', { tier: tier }); return; }   // Stripe link: let it navigate
    if (href === '#register' && tier) {
      var intent = $('f-intent');
      if (intent) intent.value = tier === 'private' ? 'Private release \u20AC999 - send deposit link'
                                : tier === 'public' ? 'Public release \u20AC1,099 - send deposit link'
                                : tier === 'waitlist' ? 'Cancellation waiting list' : 'Register interest';
    }
  });

  // pricing section visit (once per page view)
  if ('IntersectionObserver' in window && $('pricing')) {
    var seen = false;
    new IntersectionObserver(function (entries, obs) {
      if (!seen && entries.some(function (e) { return e.isIntersecting; })) { seen = true; track('pricing_section_view', { state: state }); obs.disconnect(); }
    }, { threshold: 0.2 }).observe($('pricing'));
  }

  /* =============================== 3. registration form =============================== */
  var ENDPOINT = 'PASTE_APPS_SCRIPT_URL_HERE';
  var form = $('fm-register'); if (!form) return;
  var status = $('fm-status'), submit = $('fm-submit');

  function show(kind, html) {
    status.className = 'fm-form-status ' + kind; status.innerHTML = html; status.hidden = false;
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (el) {
      var field = el.closest('.fm-field');
      var valid = el.type === 'checkbox' ? el.checked
                : el.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())
                : el.value.trim().length > 0;
      if (field) field.classList.toggle('fm-invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.website && form.website.value) return; // honeypot
    if (!validate()) { show('fm-err', 'A couple of fields still need filling in &mdash; they&rsquo;re marked in coral above.'); return; }
    if (ENDPOINT === 'PASTE_APPS_SCRIPT_URL_HERE') {
      show('fm-err', 'The form isn&rsquo;t connected yet. Please WhatsApp us on <a href="https://wa.me/34648565635">+34 648 565 635</a> or email <a href="mailto:info@pedalandpause.com">info@pedalandpause.com</a> and we&rsquo;ll register you by hand.');
      return;
    }
    var data = new FormData(form);
    data.set('camp', 'The Femmes 2027'); data.set('page', location.href); data.set('submitted_at', new Date().toISOString());
    data.set('offer_state', state); data.delete('website');
    submit.disabled = true; submit.textContent = 'Sending...';
    // Apps Script sends no CORS headers, so the response is opaque (no-cors). A resolved fetch means the
    // request LEFT the browser, not that the sheet accepted it. Verify with curl after every redeploy.
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) })
      .then(function () {
        track('form_submitted', { intent: data.get('intent') || '' });
        form.reset();
        show('fm-ok', '<strong>Thank you &mdash; we have your details.</strong> Paloma will email you within 24 hours on weekdays with a Revolut link for the &euro;150 deposit, plus answers to anything you asked. Your place is held once the deposit is paid. If you don&rsquo;t hear from us in that time, check your spam folder, then WhatsApp <a href="https://wa.me/34648565635">+34 648 565 635</a>.<br><br><a href="#top">&larr; Back to the top of the page</a>');
        submit.textContent = 'Sent';
      })
      .catch(function () {
        show('fm-err', 'That didn&rsquo;t go through. Please try once more, or WhatsApp us on <a href="https://wa.me/34648565635">+34 648 565 635</a> and we&rsquo;ll register you by hand.');
        submit.disabled = false; submit.textContent = 'Send my registration';
      });
  });
  form.addEventListener('input', function (e) {
    var field = e.target.closest && e.target.closest('.fm-field'); if (field) field.classList.remove('fm-invalid');
  });
})();
