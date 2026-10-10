import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CoverError, importInstagramCover } from './scripts/instagram-cover';
const token = randomUUID();
function editorApi(): Plugin {
 return { name: 'local-content-editor', apply: 'serve', configureServer(server) {
  server.middlewares.use(async (req, res, next) => {
   if (!req.url?.startsWith('/api/')) return next();
   const reply = (status: number, data: unknown) => { res.statusCode = status; res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(data)); };
   if (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)) return reply(403,{error:'Use the local editor from this website.'});
   if (!/^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(req.headers.host || '')) return reply(403,{error:'Local access only.'});
   if(req.url === '/api/session' && req.method === 'GET') return reply(200,{token});
   if(req.headers['x-editor-token'] !== token) return reply(403,{error:'Editor session expired. Reload this page.'});
   try {
    if(req.url === '/api/instagram-cover' && req.method === 'POST') {
     const chunks: Buffer[]=[]; let size=0; for await(const part of req){size+=part.length;if(size>4096)return reply(413,{error:'The reel link is too long.'});chunks.push(part);}
     let data;try{data=JSON.parse(Buffer.concat(chunks).toString());}catch{return reply(400,{error:'Enter a valid Instagram reel URL.'});}
     try{return reply(200,{src:await importInstagramCover(data?.url,resolve('public'))});}catch(error){return reply(error instanceof CoverError?error.status:502,{error:error instanceof CoverError?error.message:'Could not get the cover. Upload a cover from Finder.'});}
    }
    if(req.url === '/api/content' && req.method === 'PUT') {
     const chunks: Buffer[]=[]; let size=0; for await (const part of req) {size+=part.length; if(size>1024*1024) return reply(413,{error:'Content is too large.'}); chunks.push(part);}
     const data=JSON.parse(Buffer.concat(chunks).toString());
     if(typeof data.name !== 'string' || !Array.isArray(data.photos) || !Array.isArray(data.films) || !Array.isArray(data.experience)) return reply(400,{error:'Invalid portfolio content.'});
     await writeFile(resolve('public/content.json'),JSON.stringify(data,null,2)+'\n'); return reply(200,{saved:true});
    }
    if(req.url.startsWith('/api/upload?') && req.method === 'POST') {
     const name=new URL(req.url,'http://localhost').searchParams.get('name') || '';
     const ext=name.split('.').pop()?.toLowerCase();
     if(!ext || !['jpg','jpeg','png','webp','mp4','webm'].includes(ext)) return reply(400,{error:'Use JPG, PNG, WebP, MP4 or WebM.'});
     const chunks: Buffer[]=[]; let size=0; for await(const part of req) {size+=part.length;if(size>64*1024*1024) return reply(413,{error:'Choose a file smaller than 64 MB.'});chunks.push(part);}
     if(!size) return reply(400,{error:'The file is empty.'});
     const folder=['mp4','webm'].includes(ext)?'videos':'photos';const file=`${folder}/${randomUUID()}.${ext}`;
     await mkdir(resolve('public',folder),{recursive:true});await writeFile(resolve('public',file),Buffer.concat(chunks));return reply(200,{src:file});
    }
    return reply(404,{error:'Unknown editor action.'});
   } catch {return reply(500,{error:'Could not save. Check the local server and try again.'});}
  });
 }};
}
export default defineConfig({base:'./',build:{rollupOptions:{input:{main:resolve('index.html'),projects:resolve('projects.html'),project:resolve('project.html'),experience:resolve('experience.html'),experienceDetail:resolve('experience-detail.html')}}},plugins:[react(),editorApi()]});
