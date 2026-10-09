import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);

// macOS curl uses the system networking configuration, including proxies.
// Requests never follow redirects here; the importer validates each destination.
export async function coverRequest(input:RequestInfo|URL,init?:RequestInit):Promise<Response>{
 if(process.platform!=='darwin')return fetch(input,init);
 const url=input instanceof Request?input.url:String(input);
 const accept=new Headers(init?.headers).get('Accept')||'*/*';
 const {stdout}=await execute('/usr/bin/curl',[
  '--silent','--show-error','--max-time','15','--max-filesize','8388608',
  '--dump-header','-','--header',`Accept: ${accept}`,'--url',url,
 ],{encoding:'buffer',maxBuffer:10*1024*1024,timeout:18000,signal:init?.signal??undefined});
 return responseFromCurl(stdout);
}
export function responseFromCurl(raw:Buffer):Response{
 let remaining=raw;
 for(let hop=0;hop<5;hop++){
  const end=remaining.indexOf('\r\n\r\n');
  if(end<0)throw new Error('Invalid HTTP response.');
  const lines=remaining.subarray(0,end).toString('latin1').split('\r\n');
  const match=lines.shift()?.match(/^HTTP\/[\d.]+\s+(\d+)/);
  if(!match)throw new Error('Invalid HTTP status.');
  remaining=remaining.subarray(end+4);
  // Skip proxy CONNECT / interim headers when curl emits multiple blocks.
  if(remaining.subarray(0,5).toString()==='HTTP/')continue;
  const headers=new Headers();
  for(const line of lines){const separator=line.indexOf(':');if(separator>0)headers.append(line.slice(0,separator),line.slice(separator+1).trim());}
  const status=Number(match[1]);
  return new Response([204,205,304].includes(status)?null:new Uint8Array(remaining),{status,headers});
 }
 throw new Error('Too many HTTP header blocks.');
}
