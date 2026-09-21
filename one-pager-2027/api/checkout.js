const {config,ready}=require('../lib/config');const offer=require('../offer');
module.exports=(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false});}
 const c=config(),state=offer.state(c),b=req.body||{};
 if(!ready(c)||!['private_open','list_standard','public_open'].includes(state))return res.status(409).json({ok:false,error:'Booking is not available. Please refresh availability.'});
 const tier=state==='private_open'?'private':'standard';
 const a=c.allocations.find(a=>a.id===b.option&&a.tier===tier&&a.paid<a.cap);
 if(!a||b.termsAccepted!==true)return res.status(409).json({ok:false,error:'Please review the current room, price and booking terms.'});
 // Revolut must enforce the provider-side usage cap. Website counts are informational.
 return res.status(200).json({ok:true,url:a.url,total:offer.price(a.tier,a.room),deposit:150});
};
