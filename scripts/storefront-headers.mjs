const csp="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
export function pageHeaders(pathname){
  const sdkPage=pathname==='/'||pathname==='/pages/skin-analysis';
  const pageCsp=sdkPage?csp
    .replace("script-src 'self' 'unsafe-inline'","script-src 'self' 'unsafe-inline' https://cdn.glamar.io")
    .replace("connect-src 'self'","connect-src 'self' https://api.glamar.fynd.com https://cdn.glamar.io")
    .replace("frame-src 'none'","frame-src https://cdn.glamar.io")
    :csp;
  return {'Content-Security-Policy':pageCsp,'Permissions-Policy':sdkPage?'camera=(self "https://cdn.glamar.io"), microphone=()':'camera=(), microphone=()'};
}
