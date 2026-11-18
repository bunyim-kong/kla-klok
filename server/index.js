import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Rooms} from './rooms.js';

const rooms=new Rooms();
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const limits=new Map();
function json(response,status,data){response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(data));}
async function body(request){
 let raw='';
 for await(const chunk of request){raw+=chunk;if(raw.length>4096)throw new Error('Request too large.');}
 const data=JSON.parse(raw||'{}');
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid request.');
 return data;
}
const server=createServer(async(request,response)=>{
 try{
  const url=new URL(request.url,'http://localhost');
  if(url.pathname==='/api/health')return json(response,200,{ok:true});
  if(url.pathname.startsWith('/api/')){
   // No cross-origin API access: browser clients use the same host as the game.
   if(request.headers.origin && new URL(request.headers.origin).host!==request.headers.host)return json(response,403,{error:'Origin not allowed.'});
   const token=request.headers.authorization?.replace(/^Bearer /,'');
   if(request.method==='POST' && ['/api/create','/api/join'].includes(url.pathname)){
    const ip=request.socket.remoteAddress;const now=Date.now();let bucket=limits.get(ip);
    if(!bucket||now-bucket.time>60000){bucket={time:now,count:0};limits.set(ip,bucket);}
    if(++bucket.count>30)return json(response,429,{error:'Too many room requests. Please wait a minute.'});
    const data=await body(request);
    return json(response,200,url.pathname==='/api/create'?rooms.create(data.name):rooms.join(data.code,data.name));
   }
   const match=url.pathname.match(/^\/api\/rooms\/([A-Z0-9]{6})$/);
   if(match&&request.method==='GET')return json(response,200,rooms.view(match[1],token));
   if(match&&request.method==='POST'){const data=await body(request);return json(response,200,rooms.action(match[1],token,data.action,data));}
   return json(response,404,{error:'API endpoint not found.'});
  }
  if(!['GET','HEAD'].includes(request.method))return json(response,405,{error:'Method not allowed.'});
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root))return json(response,403,{error:'Forbidden'});
  const contents=await readFile(path);
  response.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
  response.end(request.method==='HEAD'?undefined:contents);
 }catch(error){json(response,error.code==='ENOENT'?404:400,{error:error.code==='ENOENT'?'File not found. Build the app first.':error.message});}
});
setInterval(()=>{rooms.cleanup();for(const [ip,bucket] of limits)if(Date.now()-bucket.time>60000)limits.delete(ip);},10000).unref();
server.listen(Number(process.env.PORT)||3001,'0.0.0.0',()=>console.log(`Kla Klok server listening on port ${process.env.PORT||3001}`));
