'use strict';
const {validate,offers,ready}=require('../lib/booking');
const {notify}=require('../lib/notifications');
module.exports=async(req,res,env=process.env)=>{res.setHeader('Cache-Control','no-store');const fail=(status,error)=>res.status(status).json({ok:false,error});if(req.method!=='POST'){res.setHeader('Allow','POST');return fail(405,'Method not allowed.');}if(!ready(env))return fail(503,'Online requests are not open yet. Please contact info@pedalandpause.com.');
if(req.headers.origin!==env.SITE_ORIGIN)return fail(403,'Please submit from our camp website.');
if(!String(req.headers['content-type']||'').startsWith('application/json'))return fail(415,'Invalid request format.');
let p=req.body;if(typeof p==='string'){if(Buffer.byteLength(p)>12000)return fail(413,'Request too large.');try{p=JSON.parse(p);}catch{return fail(400,'Invalid request.');}}
if(Buffer.byteLength(JSON.stringify(p||{}))>12000)return fail(413,'Request too large.');const error=validate(p);if(error)return fail(400,error);const offer=offers(env)[p.edition];if(!offer.available)return fail(409,'This edition is full. Contact us about other options.');
try{const origin=new URL(env.SITE_ORIGIN);const database=new URL(env.SUPABASE_URL);if(database.protocol!=='https:'||!database.hostname.endsWith('.supabase.co'))return fail(503,'Booking requests are temporarily unavailable.');
const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:p.turnstile_token}),signal:AbortSignal.timeout(7000)});const verified=await verification.json();if(!verification.ok||!verified.success||verified.hostname!==origin.hostname||verified.action!=='booking')return fail(403,'Please refresh the security check and retry.');
const price=p.edition==='may'&&p.room==='private'?null:offer.price+(p.room==='private'?360:0);
const record={request_id:p.request_id,name:p.name.trim(),email:p.email.trim().toLowerCase(),phone:p.phone.trim(),edition:p.edition,room:p.room,bike_rental:p.bike_rental,notes:p.notes.trim(),indicative_price:price,status:'pending_review',contact_consent:true,privacy_version:'2027-01'};
const response=await fetch(database.origin+'/rest/v1/booking_requests?on_conflict=request_id',{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(record),signal:AbortSignal.timeout(7000)});
if(!response.ok){console.error('booking_storage_failed',response.status);return fail(502,'We could not confirm receipt. Your details remain here; retry or contact us.');}
// Only a newly inserted row sends mail. Duplicate retries never notify again.
try {const inserted=await response.json();if(Array.isArray(inserted)&&inserted.length)await notify(inserted[0],env);}catch{console.error('booking_email_processing_failed',p.request_id);}
return res.status(200).json({ok:true,request_id:p.request_id});
}catch{console.error('booking_request_failed');return fail(502,'We could not confirm receipt. Your details remain here; retry or contact us.');}};
