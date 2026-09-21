const {config,ready}=require('../lib/config');const offer=require('../offer');
module.exports=(req,res)=>{
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false});}
 const c=config(),state=offer.state(c);const enabled=ready(c)&&['private_open','list_standard','public_open'].includes(state);
 const tier=state==='private_open'?'private':'standard';
 res.setHeader('Cache-Control','no-store');
 res.status(200).json({state,privateOpens:c.privateOpens,privateDeadline:c.privateDeadline,publicOpens:c.privateDeadline,totalBooked:c.totalBooked,privateBooked:c.privateBooked,availabilityUpdatedAt:c.availabilityUpdatedAt,releaseConfirmed:c.releaseConfirmed,bookingEnabled:enabled,termsUrl:c.termsUrl,privacyUrl:c.privacyUrl,options:enabled?c.allocations.filter(a=>a.tier===tier&&a.paid<a.cap).map(a=>({id:a.id,room:a.room,tier:a.tier,total:offer.price(a.tier,a.room),deposit:150})):[]});
};
