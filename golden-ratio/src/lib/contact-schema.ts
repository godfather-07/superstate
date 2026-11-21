import { z } from 'zod';

export const NEEDS = ['Brand Strategy', 'Creative Direction', 'Marketing', 'Full Scope', 'Not Sure'] as const;
export const BUDGETS = ['Under ₹1L', '₹1L–₹3L', '₹3L–₹5L', '₹5L–₹10L', '₹10L+', 'Not sure yet'] as const;

/** Shared by the client form (React Hook Form) and the /api/contact route. */
export const briefSchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name.').max(120),
  email: z.email('Please enter a valid email address.').max(200),
  company: z.string().trim().min(1, 'Please tell us your brand or company.').max(160),
  need: z.enum(NEEDS, { error: 'Please choose what you need.' }),
  budget: z.enum(BUDGETS, { error: 'Please choose a budget range.' }),
  message: z.string().trim().max(4000, 'Please keep this under 4,000 characters.').optional().or(z.literal('')),
  /** Honeypot — real people never see or fill this. */
  website: z.string().max(0).optional().or(z.literal('')),
});

export type BriefInput = z.infer<typeof briefSchema>;
