export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  author: string;
  date: string;
  image: string;
}

export const mockPosts: BlogPost[] = [
  {
    slug: "nextdevtpl-blog-system",
    title: "NEXTDEVTPL Blog System",
    excerpt:
      "Learn how to create and manage blog content with Fumadocs MDX in NEXTDEVTPL. A comprehensive guide to setting up your blog, writing posts, and customizing the appearance of your content.",
    tags: ["NEXTDEVTPL", "BLOG", "FUMADOCS", "MDX", "CONTENT-MANAGEMENT"],
    author: "NEXTDEVTPL Team",
    date: "7/11/2025",
    image: "/images/blog/blog-system.png",
  },
  {
    slug: "nextdevtpl-tech-stack",
    title: "NEXTDEVTPL Tech Stack",
    excerpt:
      "Learn about the powerful technologies and tools that make NEXTDEVTPL a cutting-edge SaaS starter kit. From Next.js 15 to Drizzle ORM, discover how each piece fits together.",
    tags: ["NEXTDEVTPL", "TECH-STACK", "SAAS", "NEXTJS"],
    author: "NEXTDEVTPL Team",
    date: "7/10/2025",
    image: "/images/blog/tech-stack.png",
  },
  {
    slug: "update-nextdevtpl-codebase",
    title: "Update the NEXTDEVTPL Codebase",
    excerpt:
      "Keep your NEXTDEVTPL project up-to-date with the latest features and security patches. This guide walks you through the process of syncing with upstream changes.",
    tags: ["NEXTDEVTPL", "UPDATE", "GIT", "MAINTENANCE"],
    author: "NEXTDEVTPL Team",
    date: "7/9/2025",
    image: "/images/blog/update-codebase.png",
  },
  {
    slug: "authentication-with-better-auth",
    title: "Authentication with Better Auth",
    excerpt:
      "Implement secure authentication in your NEXTDEVTPL application using Better Auth. Learn about OAuth providers, magic links, and session management.",
    tags: ["AUTH", "SECURITY", "BETTER-AUTH", "OAUTH"],
    author: "NEXTDEVTPL Team",
    date: "7/8/2025",
    image: "/images/blog/auth.png",
  },
  {
    slug: "database-with-drizzle-orm",
    title: "Database Setup with Drizzle ORM",
    excerpt:
      "Set up your database with Drizzle ORM for type-safe queries and easy migrations. This guide covers PostgreSQL setup, schema design, and best practices.",
    tags: ["DATABASE", "DRIZZLE", "POSTGRESQL", "ORM"],
    author: "NEXTDEVTPL Team",
    date: "7/7/2025",
    image: "/images/blog/database.png",
  },
];
