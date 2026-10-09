import {ArrowLeft, ArrowUpRight, Github} from 'lucide-react';
import {asset, type Content, type Project} from './types';

export function ProjectCards({projects}: {projects: Project[]}) {
 return <div className="project-grid">{projects.map(project => <a className="project-card" key={project.id} href={`${asset('project.html')}?id=${encodeURIComponent(project.id)}`} aria-label={`View ${project.title}${project.category ? ` (${project.category})` : ''} project details`}>
  {project.cover && <img className="project-card-image" src={asset(project.cover)} alt="" loading="lazy"/>}
  <span className="project-card-shade" aria-hidden="true"/>
  <div className="project-card-text"><h3>{project.title}</h3>{project.category && <p className="project-card-category">{project.category}</p>}</div><ArrowUpRight className="project-card-arrow" size={20} aria-hidden="true"/>
 </a>)}</div>;
}

export function ProjectSummary({content}: {content: Content}) {
 const projects = content.projects || [];
 return <section className="projects-summary section" id="projects">
  <div className="section-top"><span className="eyebrow muted">04 / PROJECTS</span><span className="small muted">Ideas put into practice.</span></div>
  <div className="section-heading"><h2>Built with <em>purpose.</em></h2><p>Ideas, events, and creative work.</p></div>
  <ProjectCards projects={projects.slice(0, 4)}/>
  {projects.length > 4 && <a className="text-link" href={asset('projects.html')}>More projects <ArrowUpRight size={17}/></a>}
 </section>;
}

export function ProjectDetailPage({content, projectId}: {content: Content; projectId: string | null}) {
 const project = content.projects?.find(project => project.id === projectId);
 return <main className="detail-page" id="home">
  <section className="detail-intro section">
   <a className="text-link back-link" href={asset('projects.html')}><ArrowLeft size={16}/> All projects</a>
   <span className="eyebrow green">PROJECT / A CLOSER LOOK</span>
   <h1>{project ? project.title : 'Project not found'}</h1>
   {project?.subtitle && <p>{project.subtitle}</p>}
   {!project && <p>This project is unavailable. Browse all projects to find something else.</p>}
  </section>
  {project && <section className="detail-collection section" aria-label={`${project.title} details`}>
   {project.cover && <img className={`project-detail-cover${project.gallery?.length?' has-gallery':''}`} src={asset(project.cover)} alt={`${project.title} cover`}/>}
   <article className="detail-card project-detail">
    <div className="detail-meta"><h2>About the <em>project.</em></h2>{project.role && <p className="project-role"><span className="eyebrow muted">MY ROLE</span>{project.role}</p>}</div>
    <div className="detail-copy"><div className="project-description">{project.description.split(/\n\s*\n/).map((paragraph,i)=><p className="detail-description" key={i}>{paragraph}</p>)}</div>
     {project.features.some(feature => feature.trim()) && <><h3>{project.featuresHeading || 'What it does'}</h3><ul>{project.features.filter(feature => feature.trim()).map((feature, i) => <li key={i}>{feature}</li>)}</ul></>}
     {(project.url || project.repository) && <div className="detail-actions">
      {project.url && <a className="pill" href={project.url} target="_blank" rel="noreferrer">Try {project.title} <ArrowUpRight size={17}/></a>}
      {project.repository && <a className="text-link" href={project.repository} target="_blank" rel="noreferrer"><Github size={16}/> View source <ArrowUpRight size={16}/></a>}
     </div>}
    </div>
   </article>
   {!!project.gallery?.length && <section className="project-gallery" aria-label="Selected event photographs">
    <div className="section-heading"><h2>A few <em>highlights.</em></h2><p>Selected photographs from the event.</p></div>
    <div className="project-gallery-grid">{project.gallery.map((photo,i)=><img src={asset(photo.src)} alt={photo.alt} loading="lazy" key={`${photo.src}-${i}`}/>)}</div>
   </section>}
  </section>}
 </main>;
}

export default function DetailPages({page, content}: {page: 'projects' | 'experience'; content: Content}) {
 const isProjects = page === 'projects';
 return <main className="detail-page" id="home">
  <section className="detail-intro section">
   <a className="text-link back-link" href={asset('index.html')}><ArrowLeft size={16}/> Back to portfolio</a>
   <span className="eyebrow green">{isProjects ? 'IDEAS INTO PRACTICE' : 'WORK & LEADERSHIP'}</span>
   <h1>{isProjects ? <>Projects with <em>purpose.</em></> : <>Experience that <em>shapes me.</em></>}</h1>
   <p>{isProjects ? 'A closer look at the things I build and the needs they address.' : 'My work, the teams I’ve led, and the contributions I’ve made along the way.'}</p>
  </section>
  {isProjects ? <section className="detail-collection section" aria-label="Projects">
   <ProjectCards projects={content.projects || []}/>
   {!(content.projects || []).length && <p className="muted">More projects will be added as the collection grows.</p>}
  </section> : <section className="detail-collection section" aria-label="Experience">
   {(['Work', 'Leadership'] as const).map(category => {
    const entries = content.experience.filter(entry => (entry.category || 'Work') === category);
    return entries.length > 0 && <div className="experience-group" key={category}>
     <h2 className="group-heading">{category === 'Work' ? 'Work experience' : 'Leadership'}</h2>
     {entries.map((entry, index) => <article className="detail-card" key={`${entry.company}-${index}`}>
      <div className="detail-meta"><span className="eyebrow lavender">{entry.dates || category}</span><h3>{entry.role}</h3><p>{entry.company}</p>{entry.location && <span className="detail-location">{entry.location}</span>}</div>
      <div className="detail-copy"><p className="detail-description">{entry.description}</p>{!!entry.highlights?.length && <ul>{entry.highlights.filter(highlight => highlight.trim()).map((highlight, i) => <li key={i}>{highlight}</li>)}</ul>}</div>
     </article>)}
    </div>;
   })}
  </section>}
  <div className="detail-next section"><p>A collection, always growing.</p><a className="text-link" href={asset(isProjects ? 'experience.html' : 'projects.html')}>{isProjects ? 'Explore my experience' : 'Explore my projects'} <ArrowUpRight size={17}/></a></div>
 </main>;
}
