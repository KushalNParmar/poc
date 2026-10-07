import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {build,root} from './build.mjs';
import {pageHeaders} from './storefront-headers.mjs';
import {serveSkinSdkConfig} from './skin-analysis-config.mjs';
try{process.loadEnvFile(path.join(root,'.env'));}catch(error){if(error.code!=='ENOENT')throw error;}
const routes=await build();
const port=Number(process.env.PORT || 8765);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.avif':'image/avif','.gif':'image/gif','.mp4':'video/mp4','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon'};
const aliases={'/collections':'/collections/all','/account':'/pages/kp-account','/account/login':'/pages/kp-account','/customer_authentication/redirect':'/pages/kp-account'};
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  let pathname;try{pathname=decodeURIComponent(url.pathname).replace(/\/$/,'')||'/';}catch{res.writeHead(400).end();return;}
  if(pathname.startsWith('/api/skin-analysis/')){serveSkinSdkConfig(req,res);return;}
  if(req.method!=='GET' && req.method!=='HEAD'){res.writeHead(405,{'Content-Type':'application/json'}).end(JSON.stringify({error:'This storefront uses browser-local mock commerce.'}));return;}
  if(aliases[pathname]){res.writeHead(302,{Location:aliases[pathname]}).end();return;}
  let file;
  if(pathname.startsWith('/assets/')){
    const assetRoot=path.join(root,'theme','assets');
    file=path.resolve(assetRoot,pathname.slice('/assets/'.length));
    if(!file.startsWith(assetRoot+path.sep)||(fs.existsSync(file)&&!fs.realpathSync(file).startsWith(assetRoot+path.sep))){res.writeHead(404).end();return;}
  }
  else {
    let key=pathname;
    if(pathname==='/blogs/skinmaxxing'&&['2','3'].includes(url.searchParams.get('page'))) key+='?page='+url.searchParams.get('page');
    if(url.searchParams.get('view')==='reward-for-discilpine-tnc') key='/pages/reward-for-discipline-tnc';
    file=routes[key]?path.join(root,'dist',routes[key]):null;
  }
  if(!file||!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    const fallback=path.join(root,'dist/404/index.html');
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8',...pageHeaders('/404')});
    res.end(fs.existsSync(fallback)?fs.readFileSync(fallback):'<h1>Page not found</h1><a href="/">Return home</a>');return;
  }
  const stat=fs.statSync(file),headers={'Content-Type':types[path.extname(file)]||'application/octet-stream',...pageHeaders(pathname),'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){
    const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):stat.size-1,stat.size-1);
    if(start>=stat.size||end<start){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
    res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
    if(req.method==='HEAD')res.end();else fs.createReadStream(file,{start,end}).pipe(res);
  }else{
    res.writeHead(200,{...headers,'Content-Length':stat.size});
    if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
  }
});
server.on('error',error=>{
  if(error.code==='EADDRINUSE'){
    console.error(`Port ${port} is already in use. If the POC is already running, open http://127.0.0.1:${port}`);
    console.error(`Or use another port: PORT=${port===3000?3001:3000} npm start`);
  }else{
    console.error(`Could not start the local server: ${error.message}`);
  }
  process.exitCode=1;
});
server.listen(port,'127.0.0.1',()=>console.log(`LNGVTY POC 2 ready: http://127.0.0.1:${port}`));
