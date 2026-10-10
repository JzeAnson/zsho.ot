import {useEffect, useRef, useState} from 'react';

export default function HeroImage({src, alt}: {src: string; alt: string}) {
 const image = useRef<HTMLImageElement>(null);
 const [loaded, setLoaded] = useState(false);
 useEffect(() => {
  setLoaded(!!image.current?.complete && image.current.naturalWidth > 0);
 }, [src]);
 return <img ref={image} className={`hero-image hero-settle${loaded ? ' hero-loaded' : ''}`}
  src={src} alt={alt} fetchPriority="high" onLoad={() => setLoaded(true)}/>;
}
