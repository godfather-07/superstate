export const testimonial = {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    { name: 'quote', title: 'Quote', type: 'text', validation: (r: any) => r.required() },
    { name: 'name', title: 'Client name', type: 'string' },
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'company', title: 'Company', type: 'string' },
    { name: 'orderRank', title: 'Order', type: 'number' },
  ],
};

export default testimonial;
