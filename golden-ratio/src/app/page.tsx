import { Clients } from '@/components/sections/Clients';
import { Contact } from '@/components/sections/Contact';
import { Hero } from '@/components/sections/Hero';
import { Portfolio } from '@/components/sections/Portfolio';
import { Process } from '@/components/sections/Process';
import { Services } from '@/components/sections/Services';
import { Studio } from '@/components/sections/Studio';
import { Testimonials } from '@/components/sections/Testimonials';
import { JsonLd } from '@/components/ui/JsonLd';
import { services } from '@/lib/copy';
import { getClients, getProjects, getTestimonials } from '@/lib/sanity';
import { localBusinessSchema, organizationSchema, serviceSchemas } from '@/lib/structured-data';

export const revalidate = 60;

export default async function HomePage() {
  const [projects, testimonials, clients] = await Promise.all([getProjects(), getTestimonials(), getClients()]);

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          localBusinessSchema(),
          ...serviceSchemas(services.map((s) => ({ name: s.name, description: s.description, items: s.items }))),
        ]}
      />
      <Hero />
      <Portfolio projects={projects} />
      <Services />
      <Studio />
      <Process />
      <Clients clients={clients} />
      <Testimonials testimonials={testimonials} />
      <Contact />
    </>
  );
}
