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
   import DetailPages,{ProjectSummary,ProjectDetailPage,ExperienceDetailPage} from './src/DetailPages';
   export const summary=content=>renderToStaticMarkup(createElement(ProjectSummary,{content}));
   export const listing=content=>renderToStaticMarkup(createElement(DetailPages,{page:'projects',content}));
   export const experienceListing=content=>renderToStaticMarkup(createElement(DetailPages,{page:'experience',content}));
   export const experienceDetail=(content,entryId)=>renderToStaticMarkup(createElement(ExperienceDetailPage,{content,entryId}));
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
const {summary, listing, detail, experienceListing, experienceDetail} = compiled.exports;
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


test('experience cards lead to individual role pages', () => {
 const html = experienceListing(content);
 assert.equal((html.match(/class="experience-card(?: experience-card-with-cover)?"/g)||[]).length, content.experience.length);
 for (const entry of content.experience) {
  assert.ok(html.includes(`href="./experience-detail.html?id=${encodeURIComponent(entry.id||entry.company)}"`));
 }
 assert.ok(html.includes('Content Creator Intern'));
 assert.ok(!html.includes('<iframe'));
});

test('BBK detail includes all five edited reels and other roles stay separate', () => {
 const bbk = content.experience.find(entry => entry.id === 'bbk');
 const html = experienceDetail(content, 'bbk');
 assert.ok(html.includes(`<h1>${bbk.company}</h1>`));
 assert.ok(html.includes('Responsibilities &amp; contributions'));
 assert.equal(bbk.reels.length, 5);
 assert.equal((html.match(/<iframe/g)||[]).length, 5);
 for (const reel of bbk.reels) {
  assert.ok(html.includes(`href="${reel.url}"`));
  assert.ok(html.includes(`src="${reel.url}embed/"`));
 }
 const otherEntry = {id:'other-role', company:'Other organisation', role:'Developer', description:'Built web interfaces'};
 const other = experienceDetail({...content, experience:[bbk, otherEntry]}, otherEntry.id);
 assert.ok(other.includes(`<h1>${otherEntry.company}</h1>`));
 assert.ok(!other.includes('<iframe'));
 for (const id of [null, 'missing']) {
  const missing = experienceDetail(content, id);
  assert.ok(missing.includes('Experience not found'));
  assert.ok(missing.includes('href="./experience.html"'));
 }
});

test('experience supports legacy entries and encodes card identifiers', () => {
 const entry = {company:'Company & team', role:'Editor', description:'Edited videos', reels:[{id:'invalid', title:'Sample', url:'https://example.com/'}]};
 const legacy = {...content, experience:[entry]};
 assert.ok(experienceListing(legacy).includes(`?id=${encodeURIComponent(entry.company)}`));
 const html = experienceDetail(legacy, entry.company);
 assert.ok(html.includes('Company &amp; team'));
 assert.ok(!html.includes('<iframe'));
});
