import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  // Load Markdown and MDX files in the `src/content/posts/` directory.
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  // Type-check frontmatter using a schema
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      pubDateAuthor: z.string().optional(), //?
      author: z.string(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      heroImageWidth: z.coerce.number().optional(),
      heroImageHeight: z.coerce.number().optional(),
    }),
});

export const collections = { blog };
