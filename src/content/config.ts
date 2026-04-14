import { defineCollection, z } from 'astro:content';

const releaselogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
    audience: z.enum(['internal', 'user-facing', 'technical']).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  releaselog: releaselogCollection,
};

