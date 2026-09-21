const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
test('Pages bundle runs without external imports and fails closed without credentials',async()=>{
 execFileSync(process.execPath,['build-pages.js']);
 const code=fs.readFileSync('dist-pages/_worker.js','utf8');
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const env={ASSETS:{fetch:async()=>new Response('static')}};
 assert.equal(await (await worker.fetch(new Request('https://camp.example/'),env)).text(),'static');
 let r=await worker.fetch(new Request('https://camp.example/api/config'),env);
 assert.equal(r.status,200);assert.equal((await r.json()).registrationEnabled,false);
 r=await worker.fetch(new Request('https://camp.example/api/register',{method:'POST',body:'{}'}),env);
 assert.equal(r.status,503);
 assert.deepEqual(JSON.parse(fs.readFileSync('dist-pages/_routes.json')),{version:1,include:['/api/*'],exclude:[]});
 for(const name of ['.env','api','lib','one-pager-2027','database'])assert.equal(fs.existsSync('dist-pages/'+name),false);
});
