export type Photo = { id: string; src: string; title: string; category: string; alt: string };
export type Film = { id: string; title: string; description: string; url: string; poster: string; type: 'instagram' | 'file' };
export type Content = { name: string; tagline: string; introduction: string; bio: string; hero: string; instagram: string; equipment: string[]; experience: { company: string; role: string; description: string }[]; photos: Photo[]; films: Film[] };
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
