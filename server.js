'use strict';
// Servidor local sin dependencias. Node.js 18+.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const core = require('./core.js');
const assets = {'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/core.js':'core.js','/app.js':'app.js','/logo.svg':'logo.svg'};
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function readBody(req){
 let bytes=0;const chunks=[];
 for await(const c of req){bytes+=c.length;if(bytes>20000){const e=new Error('Solicitud demasiado grande.');e.status=413;throw e;}chunks.push(c);}
 const value=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
 if(!value||typeof value!=='object'||Array.isArray(value)){const e=new Error('JSON inválido.');e.status=400;throw e;}return value;
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
   const body=req.method==='POST'?await readBody(req):{};
   const result=core.route(req.method,req.url,body);
   return json(res,req.method==='POST'&&url.pathname!=='/api/chat'?201:200,result);
  }
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Método no permitido.'});
  if(!Object.hasOwn(assets,url.pathname))return json(res,404,{error:'Archivo no encontrado.'});
  const file=assets[url.pathname];const data=await fs.readFile(path.join(__dirname,file));
  res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){const status=e.status||(e instanceof SyntaxError?400:500);json(res,status,{error:status===500?'Error interno del servidor.':e.message});}
});
const port=Number(process.env.PORT||3000);
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`El puerto ${port} está ocupado. Cierra el servidor anterior (Ctrl+C) e intenta de nuevo.`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`\nAhorro+ V2 | API REST activa\nAbre http://127.0.0.1:${port}\nPara detener: Ctrl+C\n`));
