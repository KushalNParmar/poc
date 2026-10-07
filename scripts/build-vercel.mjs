import fs from 'node:fs/promises';
import path from 'node:path';
import {build,root} from './build.mjs';
import {pageHeaders} from './storefront-headers.mjs';

const exact=pathname=>'^'+pathname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(pathname==='/'?'$':'/?$');

export function deploymentRoutes(pages){
  const routes=[{src:'/(.*)',headers:{'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'},continue:true}];
  const aliases={'/collections':'/collections/all','/account':'/pages/kp-account','/account/login':'/pages/kp-account','/customer_authentication/redirect':'/pages/kp-account'};
  for(const [from,to] of Object.entries(aliases))routes.push({src:exact(from),status:302,headers:{Location:to}});
  // Match query-based pages before the ordinary pathname routes.
  routes.push({src:'/(.*)',has:[{type:'query',key:'view',value:'reward-for-discilpine-tnc'}],dest:'/'+pages['/pages/reward-for-discipline-tnc'],headers:pageHeaders('/pages/reward-for-discipline-tnc'),methods:['GET','HEAD']});
  for(const [route,file] of Object.entries(pages).sort(([a],[b])=>Number(b.includes('?'))-Number(a.includes('?')))){
    const url=new URL(route,'https://storefront.example');
    const has=[...url.searchParams].map(([key,value])=>({type:'query',key,value}));
    routes.push({src:exact(url.pathname),...(has.length?{has}:{}),dest:'/'+file,methods:['GET','HEAD'],headers:pageHeaders(url.pathname),...(url.pathname==='/404'?{status:404}:{})});
  }
  routes.push({handle:'filesystem'},{src:'/(.*)',dest:'/404/index.html',status:404,headers:pageHeaders('/404')});
  return routes;
}

export async function buildVercel(){
  const pages=await build(),output=path.join(root,'.vercel/output');
  // Keep Vercel CLI metadata outside our generated static/function directories.
  await fs.rm(path.join(output,'static'),{recursive:true,force:true});
  await fs.rm(path.join(output,'functions'),{recursive:true,force:true});
  const staticRoot=path.join(output,'static');
  await fs.mkdir(staticRoot,{recursive:true});
  for(const file of new Set(Object.values(pages))){
    await fs.mkdir(path.dirname(path.join(staticRoot,file)),{recursive:true});
    await fs.copyFile(path.join(root,'dist',file),path.join(staticRoot,file));
  }
  // The local server reads theme/assets directly; Vercel needs deployable copies.
  await fs.cp(path.join(root,'theme/assets'),path.join(staticRoot,'assets'),{recursive:true});
  const functionRoot=path.join(output,'functions/api/skin-analysis/sdk-config.func');
  await fs.mkdir(functionRoot,{recursive:true});
  await fs.copyFile(path.join(root,'scripts/skin-analysis-config.mjs'),path.join(functionRoot,'skin-analysis-config.mjs'));
  await fs.writeFile(path.join(functionRoot,'index.mjs'),"export {serveSkinSdkConfig as default} from './skin-analysis-config.mjs';\n");
  await fs.writeFile(path.join(functionRoot,'.vc-config.json'),JSON.stringify({runtime:'nodejs22.x',handler:'index.mjs',launcherType:'Nodejs',maxDuration:10},null,2)+'\n');
  await fs.writeFile(path.join(output,'config.json'),JSON.stringify({version:3,routes:deploymentRoutes(pages)},null,2)+'\n');
  console.log('Vercel output ready: 54 pages, storefront assets, and SDK configuration function.');
  return output;
}
if(process.argv[1]===import.meta.filename)await buildVercel();
