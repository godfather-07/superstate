import type { MetadataRoute } from 'next';
import { getProjects } from '@/lib/sanity';
import { site } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...projects.map((p) => ({
      url: `${site.url}/case-study/${p.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: `${site.url}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${site.url}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
