import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Play} from 'lucide-react';
import {asset,type Film} from './types';

export default function FilmCarousel({films}:{films:Film[]}) {
 const track=useRef<HTMLDivElement>(null);
 const current=useRef(0);
 const [active,setActive]=useState(0);
 useEffect(()=>{
  const element=track.current;
  if(!element)return;
  const resize=new ResizeObserver(()=>{
   const index=Math.min(current.current,Math.max(0,films.length-1));
   const item=element.children[index] as HTMLElement|undefined;
   if(item)element.scrollTo({left:item.offsetLeft,behavior:'instant'});
  });
  resize.observe(element);
  return()=>resize.disconnect();
 },[films.length]);
 function update(){
  const element=track.current;
  if(!element)return;
  let nearest=0,distance=Infinity;
  Array.from(element.children).forEach((item,index)=>{
   const delta=Math.abs((item as HTMLElement).offsetLeft-element.scrollLeft);
   if(delta<distance){nearest=index;distance=delta;}
  });
  if(nearest!==current.current){
   element.querySelectorAll('video').forEach(video=>video.pause());
   current.current=nearest;setActive(nearest);
  }
 }
 function go(index:number){
  const element=track.current;
  const item=element?.children[index] as HTMLElement|undefined;
  if(element&&item)element.scrollTo({left:item.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 if(!films.length)return null;
 return <div className="film-carousel" role="region" aria-roledescription="carousel" aria-label="Video collection">
  <div ref={track} className="film-track" onScroll={update} tabIndex={0} aria-label="Videos — scroll horizontally to browse" onKeyDown={event=>{
   if(event.target!==event.currentTarget)return;
   if(event.key==='ArrowRight'){event.preventDefault();go(Math.min(active+1,films.length-1));}
   if(event.key==='ArrowLeft'){event.preventDefault();go(Math.max(active-1,0));}
  }}>
   {films.map((film,index)=><article className="film" key={film.id} role="group" aria-roledescription="slide" aria-label={`${index+1} of ${films.length}: ${film.title}`} inert={index!==active}>
    <div className="film-media">{film.type==='file'?<video controls preload="none" poster={asset(film.poster)} src={asset(film.url)} aria-label={film.title}/>:<a href={film.url} target="_blank" rel="noreferrer" aria-label={`Watch ${film.title} on Instagram`}><img src={asset(film.poster)} alt="" loading="lazy"/><span className="play"><Play fill="currentColor" size={18}/></span><span className="film-label">WATCH ON INSTAGRAM <ArrowUpRight size={16}/></span></a>}</div>
    <div className="film-copy"><span className="eyebrow lavender">REELS</span><h3>{film.title}</h3><p>{film.description}</p>{film.type==='instagram'&&<a className="text-link" href={film.url} target="_blank" rel="noreferrer">Watch the reel <ArrowUpRight size={18}/></a>}</div>
   </article>)}
  </div>
  {films.length>1&&<div className="film-navigation"><span className="film-count" aria-live="polite">{String(active+1).padStart(2,'0')} / {String(films.length).padStart(2,'0')}</span><div className="film-arrows"><button className={active===0?'unavailable':''} disabled={active===0} aria-label="Previous video" onClick={()=>go(active-1)}><ArrowLeft size={20}/></button><button className={active===films.length-1?'unavailable':''} disabled={active===films.length-1} aria-label="Next video" onClick={()=>go(active+1)}><ArrowRight size={20}/></button></div></div>}
 </div>;
}
