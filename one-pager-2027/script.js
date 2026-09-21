(function(){
'use strict';
const $=id=>document.getElementById(id),money=n=>'€'+n.toLocaleString('en-GB');
const date=iso=>new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',weekday:'short',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(iso))+' (Madrid time)';
let current=null,refreshing=false,requestId=crypto.randomUUID();
function text(id,value){const el=$(id);if(el)el.textContent=value;}
function track(name,props={}){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,...props});}
function staticAction(id,label){const el=$(id);el.replaceChildren();const item=document.createElement('span');item.className='fm-card-static';item.textContent=label;el.append(item);}
function action(id,label){const el=$(id);el.replaceChildren();const a=document.createElement('a');a.href='#book';a.className='fm-btn fm-btn-primary';a.textContent=label;el.append(a);}
function render(c){
 current=c;
 document.body.dataset.offerState=c.state;
 const privacy=$('privacy-link');if(/^https:\/\//.test(c.privacyUrl||'')){privacy.href=c.privacyUrl;privacy.hidden=false;}
 const before=c.state==='before_private',sold=c.state==='sold_out',cheap=c.state==='private_open',listStandard=c.state==='list_standard';
 const enabled=c.bookingEnabled&&Array.isArray(c.options)&&c.options.length>0;
 const phase=before?'Private release opens '+date(c.privateOpens):sold?'Fully booked · cancellation waiting list':cheap?'Private release · first four at €999':listStandard?'Interest list access · €1,099':'Public booking · €1,099';
 text('fm-hero-release',c.releaseConfirmed?phase:'2027 release · dates being finalised');
 text('fm-private-badge',before?'First four bookings · €999':cheap?'First four bookings · €999':c.privateBooked>=4?'Four first-price places booked':'First-price release closed');
 $('fm-card-private').classList.toggle('fm-card-private',before||cheap);
 $('fm-card-public').classList.toggle('fm-card-private',listStandard||c.state==='public_open');
 text('fm-private-pay',before?'€150 deposit when booking opens. Remaining balance: €849.':'€150 deposit towards €999. Remaining balance: €849.');
 text('fm-public-copy',before?'After four €999 places are booked, the list can immediately book remaining places at €1,099.':listStandard?'The four €999 places are booked. The list can book remaining places now at €1,099.':'Standard price for remaining places: €1,099.');
 text('fm-private-left',c.availabilityUpdatedAt?Math.max(0,Math.min(4-c.privateBooked,10-c.totalBooked)):'—');
 text('fm-total-left',c.availabilityUpdatedAt?10-c.totalBooked:'—');text('fm-total-left-2',c.availabilityUpdatedAt?10-c.totalBooked:'—');
 text('fm-availability-note',c.availabilityUpdatedAt?'Booking records last updated '+date(c.availabilityUpdatedAt)+'. Availability is checked again by Revolut at payment.':'Availability will be confirmed when booking opens.');
 $('fm-deadline').hidden=sold||c.state==='public_open';
 text('fm-deadline-label',before?'Private access opens':'Private access ends');
 text('fm-deadline-when',c.releaseConfirmed?(before?date(c.privateOpens)+' — private access lasts 72 hours. ':'Private access ends '+date(c.privateDeadline)+'. ')+'Public access starts '+date(c.publicOpens)+', if places remain.':'Release dates will be confirmed before booking opens.');
 $('fm-countdown').hidden=!c.releaseConfirmed||before||sold||c.state==='public_open';
 const label=!c.releaseConfirmed?'Release being finalised':before?'Opens '+date(c.privateOpens):sold?'Fully booked':!enabled?'Booking not yet available':'View rooms & pay deposit';
 staticAction('fm-private-action',cheap||before?label:(c.privateBooked>=4?'First four places booked':'First-price release closed'));
 staticAction('fm-public-action',before?'Interest list access after the first four bookings':label);
 if(enabled)action(cheap?'fm-private-action':'fm-public-action','Choose room · €150 deposit');
 $('book').hidden=!enabled;
 const select=$('booking-room'),old=select.value;select.replaceChildren();
 for(const o of c.options||[]){const option=document.createElement('option');option.value=o.id;option.textContent=(o.room==='single'?'Single occupancy':'Shared room')+' · '+money(o.total)+' total';select.append(option);}
 if([...select.options].some(o=>o.value===old))select.value=old;
 updateBookingSummary();
 const terms=$('booking-terms-link');if(/^https:\/\//.test(c.termsUrl||'')){terms.href=c.termsUrl;terms.hidden=false;text('fm-terms-pending','Read the complete booking terms, including cancellation and departure-confirmation conditions, before paying.');}else{terms.hidden=true;}
 document.querySelectorAll('[data-track="hero_book"],[data-track="cta_book"],.fm-nav-cta').forEach(a=>{a.href=sold?'#register':'#pricing';a.textContent=sold?'Join waiting list':enabled?'Prices & booking':'See prices & release';});
 text('fm-hero-fine',sold?'All ten places are booked. Enquire about the cancellation waiting list.':'Ten places. First four paid bookings: €999; remaining places: €1,099. Shared room, €150 deposit towards the total.');
 if(sold){text('fm-register-h2','Join the cancellation waiting list.');text('fm-register-lead','Leave your details for cancellation updates. This does not reserve a place.');$('f-intent').value='Cancellation waiting list';}
 text('fm-bar-total',money(cheap?999:1099)+' total');$('fm-bar-btn').href='#book';$('fm-bar-btn').textContent='Choose room';
 $('fm-bar').hidden=!enabled;document.body.classList.toggle('fm-bar-on',enabled);$('fm-bar').setAttribute('aria-hidden',String(!enabled));
 tick();
}
function updateBookingSummary(){const o=current?.options?.find(o=>o.id===$('booking-room').value);text('booking-summary',o?money(o.total)+' total · '+money(o.deposit)+' deposit today · '+money(o.total-o.deposit)+' remaining, due 23 August 2027.':'');}
function tick(){if(!current||$('fm-countdown').hidden)return;const m=Math.max(0,Math.ceil((Date.parse(current.privateDeadline)-Date.now())/60000));text('cd-d',Math.floor(m/1440));text('cd-h',Math.floor(m%1440/60));text('cd-m',m%60);}
async function refresh(){if(refreshing)return;refreshing=true;try{const r=await fetch('/api/offer',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const c=await r.json();if(!['before_private','private_open','list_standard','public_open','sold_out'].includes(c.state))throw Error();render(c);}catch{current=null;staticAction('fm-private-action','Contact us for booking availability');staticAction('fm-public-action','Contact us for booking availability');text('fm-private-left','—');text('fm-total-left','—');$('book').hidden=true;$('fm-bar').hidden=true;document.body.classList.remove('fm-bar-on');text('fm-hero-release','TheFemmes 2027 · enquire about availability');$('fm-countdown').hidden=true;}finally{refreshing=false;}}
$('booking-room').addEventListener('change',updateBookingSummary);
$('booking-form').addEventListener('submit',async e=>{e.preventDefault();if(!$('booking-form').reportValidity())return;const b=$('checkout-button');b.disabled=true;text('checkout-status','Checking your offer…');try{const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({option:$('booking-room').value,termsAccepted:$('accept-terms').checked}),signal:AbortSignal.timeout(8000)});const data=await r.json();if(!r.ok||!data.ok||!FemmesOffer.validLink(data.url))throw Error(data.error||'Payment is unavailable. Please try again.');track('checkout_start',{total:data.total,currency:'EUR'});window.location.assign(data.url);}catch(err){text('checkout-status',err.message);b.disabled=false;await refresh();}});
const menu=document.querySelector('.fm-menu-toggle');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));$('fm-nav-links').classList.toggle('is-open',open);});
document.querySelectorAll('.fm-nav a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');$('fm-nav-links').classList.remove('is-open');}));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');$('fm-nav-links').classList.remove('is-open');}});
if('IntersectionObserver'in window){const visible=new Set();new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);}$('fm-bar').style.display=visible.size?'none':'';},{threshold:.05}).observe($('book'));let seen=false;new IntersectionObserver(entries=>{if(!seen&&entries.some(e=>e.isIntersecting)){seen=true;track('pricing_section_view');}},{threshold:.1}).observe($('pricing'));}
const form=$('fm-register'),status=$('fm-status'),submit=$('fm-submit');
function message(ok,value){status.hidden=false;status.className='fm-form-status '+(ok?'fm-ok':'fm-err');status.textContent=value;status.focus();}
form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));data.request_id=requestId;submit.disabled=true;submit.textContent='Sending…';try{const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(16000)});const result=await r.json();if(!r.ok||result.ok!==true||result.request_id!==requestId)throw Error(result.error||'We could not confirm receipt. Please retry or email info@pedalandpause.com.');track('enquiry_received');message(true,'Your enquiry has been received. This is not a booking or payment confirmation. We will reply by email.');form.reset();requestId=crypto.randomUUID();}catch(err){message(false,err.message);}finally{submit.disabled=false;submit.textContent='Send my enquiry';}});
refresh();setInterval(()=>{tick();refresh();},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
})();
