export type ImageAsset = {
  /** Remote or /public URL. When absent, a labelled placeholder is drawn. */
  src?: string;
  alt: string;
  /** What the final image should be — shown on the placeholder. */
  placeholder: string;
  width?: number;
  height?: number;
};

export type ProjectResult = { value: string; label: string };

export type Project = {
  slug: string;
  name: string;
  category: string;
  /** One sentence on the challenge (shown on cards and as the page summary). */
  summary: string;
  services: string[];
  year: string;
  /** Card shape in the portfolio grid. */
  orientation: 'portrait' | 'landscape';
  hero: ImageAsset;
  challenge: string[];
  approach: string[];
  gallery: ImageAsset[];
  results: ProjectResult[];
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  title: string;
  company: string;
};

export type Client = {
  id: string;
  name: string;
  /** Monochrome white SVG in /public/images/clients. Placeholder wordmark when absent. */
  logo?: string;
};
