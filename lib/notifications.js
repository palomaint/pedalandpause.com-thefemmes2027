'use strict';
function messages(r,env){
 const edition=r.edition==='may'?'Casa Edition · 15–21 May 2027':'Bellver Edition · 22–28 October 2027';
 const room={shared:'Shared twin / double',ensuite:'Shared en-suite requested, subject to availability',private:'Private room requested, subject to availability'}[r.room];
 const price=r.indicative_price==null?'Individual quote required':`€${r.indicative_price} per person (indicative; subject to confirmation)`;
 const details=`Edition: ${edition}\nRoom: ${room}\nPrice: ${price}\nBike rental: ${r.bike_rental?'Requested; quoted separately':'Not requested'}\nReference: ${r.request_id}`;
 return [
 {from:env.EMAIL_FROM,to:[env.NOTIFICATION_EMAIL],reply_to:r.email,subject:`New TheFemmes request — ${r.edition==='may'?'May':'October'} 2027`,text:`A new booking request has been saved.\n\nName: ${r.name}\nEmail: ${r.email}\nPhone: ${r.phone||'Not provided'}\n${details}\n\nGuest notes:\n${r.notes||'None'}\n\nStatus: pending review. No place or payment is confirmed. Check availability and room allocation before sending payment details.`},
 {from:env.EMAIL_FROM,to:[r.email],reply_to:env.NOTIFICATION_EMAIL,subject:'We have received your TheFemmes 2027 request',text:`Hello ${r.name},\n\nThank you for your booking request for TheFemmes by Pedal & Pause. We have saved your details.\n\n${details}\n\nWe will review availability and contact you to confirm your room, final price, booking conditions and payment details. This email acknowledges your request; it does not reserve a place or confirm a booking. Your place is confirmed only after payment has been verified.\n\nBike rental, airport transfers, flights, lunches and travel insurance are not included in the camp price.\n\nQuestions or changes? Reply to this email.\n\nPaloma & David\nPedal & Pause\nhttps://thefemmes.pedalandpause.com`}
 ];
}
async function notify(r,env){
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM||!env.NOTIFICATION_EMAIL){console.error('booking_email_not_configured',r.request_id);return;}
 await Promise.all(messages(r,env).map(async(body,index)=>{
  try{const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':`booking/${r.request_id}/${index===0?'host':'guest'}`},body:JSON.stringify(body),signal:AbortSignal.timeout(4000)});
   if(!result.ok)console.error('booking_email_failed',r.request_id,index,result.status);
  }catch{console.error('booking_email_failed',r.request_id,index,'network');}
 }));
}
module.exports={messages,notify};
