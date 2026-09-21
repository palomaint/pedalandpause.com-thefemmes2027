/* Pure release logic, shared by browser and server. Never treats a visit as a sale. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FemmesOffer=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function state(c,now=Date.now()){
 const start=Date.parse(c.privateOpens),end=Date.parse(c.privateDeadline);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return 'unconfigured';
 if(!Number.isInteger(c.totalBooked)||!Number.isInteger(c.privateBooked)||c.totalBooked<0||c.totalBooked>10||c.privateBooked<0||c.privateBooked>4||c.privateBooked>c.totalBooked)return 'unconfigured';
 if(c.totalBooked===10)return 'sold_out';
 if(now<start)return 'before_private';
 if(now>=end)return 'public_open';
 return c.privateBooked>=4?'list_standard':'private_open';
}
function price(tier,room){return (tier==='private'?999:1099)+(room==='single'?360:0);}
function validLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname==='checkout.revolut.com'||u.hostname==='business.revolut.com'||u.hostname==='pay.revolut.com');}catch{return false;}}
return {state,price,validLink};
});
