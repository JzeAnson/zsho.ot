import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {coverRequest} from './cover-request.ts';

export class CoverError extends Error {
 status:number;
 constructor(message:string,status=422){super(message);this.status=status;}
}
const unavailable='Instagram did not provide a cover for this reel. Upload a cover from Finder; your current cover has been kept.';
export function reelUrl(value:unknown):URL {
 let url:URL;
 try{url=new URL(typeof value==='string'?value:'');}catch{throw new CoverError('Enter a valid Instagram reel URL.',400);}
 if(url.protocol!=='https:'||!['instagram.com','www.instagram.com'].includes(url.hostname)||url.port||url.username||url.password||!/^\/(?:[\w.]+\/)?(?:reel|p|tv)\/[\w-]+\/?$/.test(url.pathname))throw new CoverError('Use an https://www.instagram.com/reel/… link.',400);
 url.search='';url.hash='';return url;
}
function decode(value:string):string {
 return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,entity=>{
  const named:Record<string,string>={'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'};
  if(named[entity])return named[entity];
  const point=entity.startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);
  return Number.isFinite(point)&&point<=0x10ffff?String.fromCodePoint(point):entity;
 });
}
export function coverFromHtml(html:string,source:URL):URL {
 const metadata:Record<string,string>={};
 for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){
  const attrs:Record<string,string>={};
  for(const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))attrs[match[1].toLowerCase()]=decode(match[2]??match[3]??match[4]);
  if(attrs.property)metadata[attrs.property.toLowerCase()]=attrs.content;
 }
 const shortcode=source.pathname.split('/').filter(Boolean).at(-1);
 let canonical:URL,image:URL;
 try{canonical=reelUrl(metadata['og:url']);image=new URL(metadata['og:image']);}catch{throw new CoverError(unavailable);}
 if(canonical.pathname.split('/').filter(Boolean).at(-1)!==shortcode)throw new CoverError(unavailable);
 if(!isImageUrl(image))throw new CoverError(unavailable);
 return image;
}
function isImageUrl(url:URL){return url.protocol==='https:'&&!url.port&&!url.username&&!url.password&&['cdninstagram.com','fbcdn.net'].some(domain=>url.hostname===domain||url.hostname.endsWith('.'+domain));}
async function limitedResponse(response:Response,limit:number){
 if(!response.ok||!response.body)throw new CoverError(unavailable);
 if(Number(response.headers.get('content-length'))>limit)throw new CoverError('This cover is too large. Upload a smaller cover from Finder.');
 const reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw new CoverError('This cover is too large. Upload a smaller cover from Finder.');chunks.push(value);}}finally{await reader.cancel();}
 return Buffer.concat(chunks);
}
export async function importInstagramCover(value:unknown,publicDirectory:string,fetcher:typeof fetch=coverRequest):Promise<string>{
 let page=reelUrl(value);const source=new URL(page);let response:Response|undefined;
 try{
  for(let i=0;i<4;i++){
   response=await fetcher(page,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'text/html'}});
   if(response.status<300||response.status>=400)break;
   const redirect=response.headers.get('location');if(!redirect)throw new CoverError(unavailable);
   try{page=reelUrl(new URL(redirect,page).href);}catch{throw new CoverError(unavailable);}
  }
  if(!response||!response.headers.get('content-type')?.includes('text/html'))throw new CoverError(unavailable);
  const html=(await limitedResponse(response,2*1024*1024)).toString();
  const image=coverFromHtml(html,source);
  const downloaded=await fetcher(image,{redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'image/jpeg,image/png,image/webp'}});
  const mime=downloaded.headers.get('content-type')?.split(';')[0].trim();
  const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  if(!mime||!extensions[mime])throw new CoverError(unavailable);
  const bytes=await limitedResponse(downloaded,8*1024*1024);
  const valid= mime==='image/jpeg'?bytes.subarray(0,3).equals(Buffer.from([255,216,255])):mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  if(!valid)throw new CoverError(unavailable);
  const path=`covers/instagram-${createHash('sha256').update(bytes).digest('hex').slice(0,24)}.${extensions[mime]}`;
  await mkdir(resolve(publicDirectory,'covers'),{recursive:true});await writeFile(resolve(publicDirectory,path),bytes);
  return path;
 }catch(error){if(error instanceof CoverError)throw error;throw new CoverError('Could not reach Instagram. Try again or upload a cover from Finder; your current cover has been kept.',502);}
}
