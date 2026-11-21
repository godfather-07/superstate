export const client = {
  name: 'client',
  title: 'Client logo',
  type: 'document',
  fields: [
    { name: 'name', title: 'Brand name', type: 'string', validation: (r: any) => r.required() },
    { name: 'logo', title: 'Logo (monochrome white SVG)', type: 'image' },
    { name: 'orderRank', title: 'Order', type: 'number' },
  ],
};

export default client;
