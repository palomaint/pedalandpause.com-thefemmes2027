const {offers,ready}=require('../lib/booking');
module.exports=(req,res,env=process.env)=>{res.setHeader('Cache-Control','no-store');if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false});}return res.status(200).json({offers:offers(env),registrationEnabled:ready(env),turnstileSiteKey:ready(env)?env.TURNSTILE_SITE_KEY:null});};
