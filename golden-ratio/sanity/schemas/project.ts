/**
 * Sanity Studio schema: portfolio project. Field names match the GROQ in
 * src/lib/sanity.ts. Add to your Studio with `schema: { types: [project, testimonial, client] }`.
 */
const image = (name: string, title: string) => ({
  name,
  title,
  type: 'image',
  options: { hotspot: true },
  fields: [
    { name: 'alt', title: 'Alt text', type: 'string', validation: (r: any) => r.required() },
    { name: 'placeholder', title: 'Description (shown until an image is uploaded)', type: 'string' },
  ],
});

export const project = {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    { name: 'name', title: 'Client / project name', type: 'string', validation: (r: any) => r.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (r: any) => r.required() },
    { name: 'orderRank', title: 'Order', type: 'number' },
    { name: 'category', title: 'Category', type: 'string', description: 'Brand Identity / Campaign / Packaging …' },
    { name: 'summary', title: 'One sentence on the challenge', type: 'string' },
    { name: 'services', title: 'Services delivered', type: 'array', of: [{ type: 'string' }] },
    { name: 'year', title: 'Year', type: 'string' },
    { name: 'orientation', title: 'Card shape', type: 'string', options: { list: ['portrait', 'landscape'] }, initialValue: 'portrait' },
    image('hero', 'Hero image'),
    { name: 'challenge', title: 'The Challenge', type: 'array', of: [{ type: 'text' }] },
    { name: 'approach', title: 'The Approach', type: 'array', of: [{ type: 'text' }] },
    { name: 'gallery', title: 'The Work (gallery)', type: 'array', of: [image('image', 'Image')] },
    {
      name: 'results',
      title: 'The Results',
      type: 'array',
      of: [{ type: 'object', fields: [{ name: 'value', type: 'string' }, { name: 'label', type: 'string' }] }],
    },
  ],
};

export default project;
