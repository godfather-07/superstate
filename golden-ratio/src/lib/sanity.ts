import 'server-only';
import { clients as localClients, projects as localProjects, testimonials as localTestimonials } from './content';
import type { Client, Project, Testimonial } from './types';

/**
 * CMS client (PRD §12). When SANITY_PROJECT_ID is set, content is fetched
 * from Sanity with GROQ at build time and revalidated every 60 seconds (ISR).
 * Until then — or if Sanity is unreachable — the local content in
 * src/lib/content.ts is used, so the site always renders.
 *
 * Uses Sanity's HTTP query API directly to keep the client bundle free of the
 * Sanity SDK. Schemas for the Studio live in /sanity/schemas.
 */

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;
const apiVersion = '2025-01-01';

export const REVALIDATE_SECONDS = 60;

const isConfigured = Boolean(projectId && projectId !== 'your_project_id');

async function groq<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!isConfigured) return null;
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(`$${key}`, JSON.stringify(value));
  try {
    const res = await fetch(url, {
      headers: token && token !== 'your_token' ? { Authorization: `Bearer ${token}` } : undefined,
      next: { revalidate: REVALIDATE_SECONDS, tags: ['sanity'] },
    });
    if (!res.ok) throw new Error(`Sanity responded ${res.status}`);
    const json = (await res.json()) as { result: T };
    return json.result;
  } catch (err) {
    console.error('[sanity] falling back to local content:', err);
    return null;
  }
}

const imageFields = `{ "src": asset->url, alt, placeholder, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`;

const projectFields = `{
  "slug": slug.current, name, category, summary, services, year, orientation,
  "hero": hero${imageFields},
  challenge, approach,
  "gallery": gallery[]${imageFields},
  results[]{ value, label }
}`;

export async function getProjects(): Promise<Project[]> {
  const result = await groq<Project[]>(`*[_type == "project"] | order(orderRank asc) ${projectFields}`);
  return result?.length ? result : localProjects;
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const result = await groq<Testimonial[]>(
    `*[_type == "testimonial"] | order(orderRank asc){ "id": _id, quote, name, title, company }`,
  );
  return result?.length ? result : localTestimonials;
}

export async function getClients(): Promise<Client[]> {
  const result = await groq<Client[]>(
    `*[_type == "client"] | order(orderRank asc){ "id": _id, name, "logo": logo.asset->url }`,
  );
  return result?.length ? result : localClients;
}
