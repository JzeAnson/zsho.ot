import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {reelUrl,coverFromHtml,importInstagramCover} from '../scripts/instagram-cover.ts';
import {responseFromCurl} from '../scripts/cover-request.ts';
const url='https://www.instagram.com/reel/Db0DAKZP2dZ/';
const image='https://scontent.cdninstagram.com/cover.jpg?x=1&y=2';
const html=`<meta content="https://www.instagram.com/jze_0725/reel/Db0DAKZP2dZ/" property="og:url"><meta property='og:image' content='${image.replace('&','&amp;')}'>`;
test('validates reel links and strips tracking parameters',()=>{
 assert.equal(reelUrl(url+'?utm_source=test#video').href,url);
 for(const invalid of ['http://www.instagram.com/reel/abc/','https://instagram.com.evil.test/reel/abc/','https://localhost/reel/abc/','https://www.instagram.com/accounts/login/','https://user:pass@www.instagram.com/reel/abc/'])assert.throws(()=>reelUrl(invalid));
});
test('extracts only an Instagram CDN image belonging to the requested reel',()=>{
 assert.equal(coverFromHtml(html,new URL(url)).href,image);
 assert.throws(()=>coverFromHtml(html.replace('Db0DAKZP2dZ','other'),new URL(url)));
 assert.throws(()=>coverFromHtml(html.replace('scontent.cdninstagram.com','localhost'),new URL(url)));
 assert.throws(()=>coverFromHtml(html.replace('scontent.cdninstagram.com','cdninstagram.com.evil.test'),new URL(url)));
 assert.throws(()=>coverFromHtml('<html>Login required</html>',new URL(url)));
});
test('downloads and deduplicates covers; blocks redirects and non-image payloads',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'zshoot-cover-test-'));
 try{
  const bytes=Buffer.from([255,216,255,224,0,16]);
  const fakeFetch=async(input)=>new Response(input.href===url?html:bytes,{headers:{'content-type':input.href===url?'text/html':'image/jpeg'}});
  const src=await importInstagramCover(url,directory,fakeFetch);
  assert.deepEqual(await readFile(join(directory,src)),bytes);
  assert.equal(await importInstagramCover(url,directory,fakeFetch),src);
  await assert.rejects(importInstagramCover(url,directory,async()=>new Response(null,{status:302,headers:{location:'https://localhost/private'}})));
  await assert.rejects(importInstagramCover(url,directory,async(input)=>new Response(input.href===url?html:'not an image',{headers:{'content-type':input.href===url?'text/html':'image/jpeg'}})));
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('system transport parses proxy headers and retains binary image bytes',async()=>{
 const bytes=Buffer.from([255,216,255,224,0,16]);
 const raw=Buffer.concat([Buffer.from('HTTP/1.1 200 Connection established\r\n\r\nHTTP/2 200\r\nContent-Type: image/jpeg\r\n\r\n'),bytes]);
 const response=responseFromCurl(raw);
 assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/jpeg');
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
});
