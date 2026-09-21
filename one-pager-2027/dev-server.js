/* Local preview only; mirrors Vercel request/response helpers. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const sendJson=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 if(url.pathname.startsWith('/api/')){
  const name=url.pathname.slice(5);if(!['offer','checkout','register'].includes(name))return sendJson(404,{});
  let body='';for await(const chunk of req){body+=chunk;if(body.length>20000)return sendJson(413,{ok:false});}
  try{req.body=body?JSON.parse(body):{};}catch{return sendJson(400,{ok:false});}
  res.status=n=>{res.statusCode=n;return res;};res.json=data=>sendJson(res.statusCode||200,data);
  return require('./api/'+name)(req,res);
 }
 let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.statusCode=400;return res.end();}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||/\/(?:api|lib|tests)\/|\/\.|\.gs$|\.md$/.test(file.slice(root.length))){res.statusCode=404;return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.statusCode=404;return res.end('Not found');}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)]||'text/plain');res.end(data);});
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+(process.env.PORT||4173)));
