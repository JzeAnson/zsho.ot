export type Photo = { id: string; src: string; title: string; category: string; alt: string };
export type Film = { id: string; title: string; description: string; url: string; poster: string; type: 'instagram' | 'file' };
export type Project = { id: string; title: string; cover?: string; category?: string; subtitle?: string; role?: string; featuresHeading?: string; gallery?: { src: string; alt: string }[]; description: string; features: string[]; url: string; repository: string };
export type Experience = { company: string; role: string; description: string; category?: 'Work' | 'Leadership'; dates?: string; location?: string; highlights?: string[] };
export type Content = { name: string; tagline: string; introduction: string; bio: string; hero: string; instagram: string; equipment: string[]; projects?: Project[]; experience: Experience[]; photos: Photo[]; films: Film[] };
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
