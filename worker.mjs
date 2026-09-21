import register from './api/register.js';
import config from './api/config.js';
import deployment from './vercel.json' with { type: 'json' };

// Environment bindings stay request-scoped. No credentials are copied to global state.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const headers = new Headers(deployment.headers[0].headers.map(h => [h.key,h.value]));
    headers.set('Cache-Control','no-store');
    headers.set('Content-Type','application/json');
    const json = (status, data) => new Response(JSON.stringify(data), {status,headers});
    const handler = {'/api/config':config,'/api/register':register}[url.pathname];
    if (!handler) return json(404,{ok:false,error:'Not found.'});
    let body = {};
    if (request.method === 'POST') {
      const reader = request.body?.getReader();
      const chunks = []; let size = 0;
      if (reader) {
        while (true) {
          const {done,value} = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 12000) { await reader.cancel(); return json(413,{ok:false,error:'Request too large.'}); }
          chunks.push(value);
        }
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
      try { body = size ? JSON.parse(new TextDecoder().decode(bytes)) : {}; }
      catch { return json(400,{ok:false,error:'Invalid request.'}); }
    }
    let status = 200, response;
    const res = {
      setHeader(key,value) {headers.set(key,value);},
      status(value) {status=value;return this;},
      json(value) {response=json(status,value);return this;}
    };
    try {
      await handler({method:request.method,headers:Object.fromEntries(request.headers),body},res,env);
      return response || json(500,{ok:false,error:'Unable to process request.'});
    } catch {return json(500,{ok:false,error:'Unable to process request. Please contact us.'});}
  }
};
