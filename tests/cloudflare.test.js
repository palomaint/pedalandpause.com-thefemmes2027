const {test}=require('node:test');const assert=require('node:assert/strict');
test('Cloudflare adapter: static assets, configuration, body limit and disabled registration',async()=>{
 const {default:worker}=await import('../worker.mjs');
 const env={REGISTRATION_ENABLED:'false',MAY_TIER:'standard',ASSETS:{fetch:async()=>new Response('asset')}};
 assert.equal(await (await worker.fetch(new Request('https://camp.example/'),env)).text(),'asset');
 let r=await worker.fetch(new Request('https://camp.example/api/config'),env);
 assert.equal(r.status,200);assert.equal(r.headers.get('X-Frame-Options'),'DENY');
 const config=await r.json();assert.equal(config.offers.may.price,795);assert.equal(config.registrationEnabled,false);assert.equal(config.turnstileSiteKey,null);
 r=await worker.fetch(new Request('https://camp.example/api/register',{method:'POST',body:'{}'}),env);assert.equal(r.status,503);
 r=await worker.fetch(new Request('https://camp.example/api/register',{method:'POST',body:'broken'}),env);assert.equal(r.status,400);
 r=await worker.fetch(new Request('https://camp.example/api/register',{method:'POST',body:'x'.repeat(12001)}),env);assert.equal(r.status,413);
 r=await worker.fetch(new Request('https://camp.example/api/unknown'),env);assert.equal(r.status,404);
});
