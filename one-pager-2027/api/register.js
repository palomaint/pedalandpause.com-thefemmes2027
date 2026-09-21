const crypto=require('node:crypto');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false});}
 const p=req.body||{};
 if(p.website)return res.status(400).json({ok:false,error:'Unable to submit this request.'});
 if(typeof p.name!=='string'||!p.name.trim()||p.name.length>120||typeof p.email!=='string'||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)||p.email.length>254||p.consent!=='Yes')return res.status(400).json({ok:false,error:'Please enter your name, email and contact consent.'});
 if(!/^[a-f0-9-]{36}$/i.test(p.request_id||''))return res.status(400).json({ok:false,error:'Please refresh and retry.'});
 const endpoint=process.env.APPS_SCRIPT_URL||'https://script.google.com/macros/s/AKfycbyqV81dNgl6bsB9CvVnnUYhCD7QjFHtway695tJRjRM1Ju_qoEDNkY_-IlZQJiSxWrh/exec',secret=process.env.FORM_SHARED_SECRET;
 if(!endpoint||!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)||!secret)return res.status(503).json({ok:false,error:'The enquiry form is not available yet. Please email info@pedalandpause.com.'});
 const clean={request_id:p.request_id,submitted_at:new Date().toISOString(),camp:'TheFemmes 2027',consent:'Yes'};
 for(const key of ['name','email','phone','country','room','level','friend','transfer','bike_rental','notes','intent']){if(p[key]!=null){if(typeof p[key]!=='string'||p[key].length>2000)return res.status(400).json({ok:false,error:'Please shorten your message.'});clean[key]=p[key];}}
 const payload=JSON.stringify(clean),timestamp=Date.now().toString(),signature=crypto.createHmac('sha256',secret).update(timestamp+'.'+payload).digest('hex');
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({payload,timestamp,signature}),signal:AbortSignal.timeout(12000)});
  const result=await response.json();
  if(!response.ok||result.ok!==true||result.request_id!==clean.request_id)throw Error('Unconfirmed');
  return res.status(200).json({ok:true,request_id:clean.request_id});
 }catch{return res.status(502).json({ok:false,error:'We could not confirm receipt. Your details remain here; retry or email info@pedalandpause.com.'});}
};
