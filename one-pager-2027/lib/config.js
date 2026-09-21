/* Server-only configuration. No secret belongs in browser JavaScript. */
const offer=require('../offer');
function config(env=process.env){
 let allocations=[];try{allocations=JSON.parse(env.REVOLUT_ALLOCATIONS||JSON.stringify(require('./payment-draft.json')));}catch{}
 const c={privateOpens:'2026-10-01T18:00:00+02:00',privateDeadline:'2026-10-04T18:00:00+02:00',totalBooked:Number(env.TOTAL_BOOKED||0),privateBooked:Number(env.PRIVATE_BOOKED||0),availabilityUpdatedAt:env.AVAILABILITY_UPDATED_AT||null,allocations,termsUrl:env.BOOKING_TERMS_URL||'',privacyUrl:env.PRIVACY_URL||'',releaseConfirmed:env.RELEASE_CONFIRMED==='true',packageConfirmed:env.PACKAGE_CONFIRMED==='true',termsConfirmed:env.TERMS_CONFIRMED==='true',limitsConfirmed:env.REVOLUT_LIMITS_CONFIRMED==='true'};
 return c;
}
function ready(c){
 if(!c.releaseConfirmed||!c.packageConfirmed||!c.termsConfirmed||!c.limitsConfirmed||!/^https:\/\//.test(c.termsUrl))return false;
 if(!Array.isArray(c.allocations)||!c.allocations.length)return false;
 const ids=new Set(),urls=new Set();let total=0,discount=0,paid=0,privatePaid=0;
 for(const a of c.allocations){
  if(!/^[a-z0-9_-]{1,40}$/.test(a.id)||ids.has(a.id)||urls.has(a.url)||!offer.validLink(a.url)||!['private','standard'].includes(a.tier)||!['shared','single'].includes(a.room)||!Number.isInteger(a.cap)||a.cap<1||!Number.isInteger(a.paid)||a.paid<0||a.paid>a.cap)return false;
  ids.add(a.id);urls.add(a.url);total+=a.cap;paid+=a.paid;
  if(a.tier==='private'){discount+=a.cap;privatePaid+=a.paid;}
 }
 return total<=10&&discount<=4&&paid===c.totalBooked&&privatePaid===c.privateBooked;
}
module.exports={config,ready};
