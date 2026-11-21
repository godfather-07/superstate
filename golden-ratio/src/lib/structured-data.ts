import { site } from './site';
import type { Project } from './types';

const sameAs = site.socials.map((s) => s.url).filter(Boolean);

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: `${site.url}/icon/512`,
    slogan: site.tagline,
    email: site.email,
    founder: { '@type': 'Person', name: site.founder.name, jobTitle: site.founder.title },
    contactPoint: [
      { '@type': 'ContactPoint', contactType: 'sales', email: site.email, telephone: site.phone, areaServed: 'IN', availableLanguage: ['en'] },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${site.url}/#localbusiness`,
    name: site.name,
    url: site.url,
    image: `${site.url}/opengraph-image`,
    email: site.email,
    telephone: site.phone,
    priceRange: '₹₹₹',
    address: { '@type': 'PostalAddress', ...site.address },
    areaServed: site.areaServed.map((name) => ({ '@type': 'Place', name })),
    parentOrganization: { '@id': `${site.url}/#organization` },
  };
}

export function serviceSchemas(services: { name: string; description: string; items: string[] }[]) {
  return services.map((s) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.description,
    serviceType: s.name,
    provider: { '@id': `${site.url}/#organization` },
    areaServed: site.areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: s.name,
      itemListElement: s.items.map((item) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: item } })),
    },
  }));
}

export function breadcrumbSchema(project: Project) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: site.url },
      { '@type': 'ListItem', position: 2, name: 'Work', item: `${site.url}/#work` },
      { '@type': 'ListItem', position: 3, name: project.name, item: `${site.url}/case-study/${project.slug}` },
    ],
  };
}
