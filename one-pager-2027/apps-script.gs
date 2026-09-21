/* Google Sheet receiver. Set FORM_SHARED_SECRET in Script Properties to the same
   value as Vercel. Deploy a new version. Do not put the secret in this file. */
var COLS=['request_id','submitted_at','name','email','phone','country','intent','room','level','friend','transfer','notes','consent','camp','bike_rental'];
function reply(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
 var lock=LockService.getScriptLock();
 try{
  var q=(e&&e.parameter)||{},secret=PropertiesService.getScriptProperties().getProperty('FORM_SHARED_SECRET');
  if(!secret||!q.timestamp||Math.abs(Date.now()-Number(q.timestamp))>300000||!q.payload||q.payload.length>18000)return reply({ok:false});
  var hash=Utilities.computeHmacSha256Signature(q.timestamp+'.'+q.payload,secret).map(function(b){return ('0'+(b&255).toString(16)).slice(-2);}).join('');
  if(hash!==q.signature)return reply({ok:false});
  var p=JSON.parse(q.payload);
  if(!/^[a-f0-9-]{36}$/i.test(p.request_id||'')||!p.name||!p.email||p.consent!=='Yes')return reply({ok:false});
  lock.waitLock(10000);
  var ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getSheetByName('Enquiries')||ss.insertSheet('Enquiries');
  if(sheet.getLastRow()===0){sheet.appendRow(COLS);sheet.setFrozenRows(1);}
  // New rental field is appended so existing enquiry columns stay aligned.
  if(sheet.getRange(1,COLS.length).getValue()==='')sheet.getRange(1,COLS.length).setValue('bike_rental');
  if(sheet.getLastRow()>1&&sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(p.request_id).matchEntireCell(true).findNext())return reply({ok:true,request_id:p.request_id});
  sheet.appendRow(COLS.map(function(k){var x=String(p[k]||'');return /^[=+@\-\t\r]/.test(x)?"'"+x:x;}));
  // Storage acknowledgement is independent of email notification success.
  try{MailApp.sendEmail('info@pedalandpause.com','TheFemmes 2027 enquiry',COLS.map(function(k){return k+': '+(p[k]||'');}).join('\n'));}catch(ignore){}
  return reply({ok:true,request_id:p.request_id});
 }catch(err){return reply({ok:false});}finally{if(lock.hasLock())lock.releaseLock();}
}
function doGet(){return reply({ok:true,service:'TheFemmes enquiry receiver'});}
