export function serveSkinSdkConfig(req,res,{appId=process.env.GLAMAR_APP_ID,accessKey=process.env.GLAMAR_ACCESS_KEY}={}){
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  if(new URL(req.url,'http://localhost').pathname!=='/api/skin-analysis/sdk-config'){send(404,{error:'Endpoint not found.'});return;}
  if(req.method!=='GET'){send(405,{error:'Use GET for SDK configuration.'});return;}
  if(req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)){send(403,{error:'Open skin analysis from this storefront.'});return;}
  if(!appId||!accessKey){send(503,{error:'Configure GLAMAR_APP_ID and GLAMAR_ACCESS_KEY in .env, then restart the POC.'});return;}
  // The Web SDK requires its publishable access key in the browser. This is not
  // a platform API token. Return only these two explicit SDK configuration fields.
  send(200,{appId,accessKey});
}
