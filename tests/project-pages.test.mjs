import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Module from 'node:module';
import {build} from 'esbuild';

const root = new URL('../', import.meta.url).pathname;
const content = JSON.parse(await readFile(new URL('../public/content.json', import.meta.url), 'utf8'));
const result = await build({
 stdin: {
  contents: `import {createElement} from 'react';
   import {renderToStaticMarkup} from 'react-dom/server';
   import DetailPages,{ProjectSummary,ProjectDetailPage} from './src/DetailPages';
   export const summary=content=>renderToStaticMarkup(createElement(ProjectSummary,{content}));
   export const listing=content=>renderToStaticMarkup(createElement(DetailPages,{page:'projects',content}));
   export const detail=(content,projectId)=>renderToStaticMarkup(createElement(ProjectDetailPage,{content,projectId}));`,
  resolveDir: root,
  loader: 'tsx',
 },
 bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', packages: 'external',
 define: {'import.meta.env.BASE_URL': JSON.stringify('./')},
});
const compiled = new Module(`${root}project-pages-check.cjs`);
compiled.filename = `${root}project-pages-check.cjs`;
compiled.paths = Module._nodeModulePaths(root);
compiled._compile(result.outputFiles[0].text, compiled.filename);
const {summary, listing, detail} = compiled.exports;
const projects = Array.from({length: 5}, (_, i) => ({...content.projects[0], id: `project-${i}`, title: `Project ${i}`}));
const cardCount = html => (html.match(/class="project-card"/g) || []).length;

test('homepage shows at most four cards and offers all projects only when needed', () => {
 for (const count of [0, 1, 4, 5]) {
  const html = summary({...content, projects: projects.slice(0, count)});
  assert.equal(cardCount(html), Math.min(count, 4));
  assert.equal(html.includes('More projects'), count > 4);
  if (count > 4) assert.ok(html.includes('href="./projects.html"'));
 }
 assert.equal(cardCount(listing({...content, projects})), 5);
});

test('cards link to the selected project and use its supplied cover', () => {
 const html = summary(content);
 assert.ok(html.includes('href="./project.html?id=dancecue"'));
 assert.ok(html.includes('src="./photos/dancecue_cover.JPG"'));
 const unusualId = 'music & dance';
 assert.ok(listing({...content, projects: [{...projects[0], id: unusualId}]}).includes(`?id=${encodeURIComponent(unusualId)}`));
});

test('detail pages show only the requested project and handle missing projects', () => {
 const html = detail({...content, projects}, 'project-4');
 assert.ok(html.includes('<h1>Project 4</h1>'));
 assert.ok(!html.includes('Project 0'));
 assert.ok(html.includes('https://dance-cue.vercel.app/'));
 assert.ok(html.includes('https://github.com/JzeAnson/DanceCue'));
 for (const id of [null, 'missing']) {
  const missing = detail(content, id);
  assert.ok(missing.includes('Project not found'));
  assert.ok(missing.includes('href="./projects.html"'));
 }
});

test('photography projects show their gallery and role without app actions', async () => {
 const project = content.projects.find(project => project.id === 'qdees-shine-like-a-star');
 assert.ok(project);
 const html = detail(content, project.id);
 assert.ok(html.includes('Concert &amp; Graduation 2026'));
 assert.ok(html.includes('Event photographer'));
 assert.ok(html.includes('Photography focus'));
 assert.ok(!html.includes('What it does'));
 assert.ok(!html.includes('Try Q-dees'));
 assert.ok(!html.includes('View source'));
 assert.equal(project.gallery.length, 10);
 for (const photo of project.gallery) {
  assert.ok(html.includes(`src="./${photo.src}"`));
  assert.ok(photo.alt.length > 0);
  await readFile(new URL(`../public/${photo.src}`, import.meta.url));
 }
 assert.ok(summary(content).includes(`href="./project.html?id=${project.id}"`));
});
