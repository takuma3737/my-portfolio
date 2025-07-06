import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    emoji: z.string(),
    tags: z.array(z.string()),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  articles,
};
