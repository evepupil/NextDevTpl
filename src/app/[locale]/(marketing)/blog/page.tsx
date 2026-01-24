import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { BlogPostItem } from "@/features/blog/components";
import { mockPosts } from "@/features/blog/data/mock-posts";

export default function BlogPage() {
  return (
    <div className="container mx-auto max-w-5xl py-20">
      {/* Header */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Blog Posts
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Discover the latest insights, tutorials, and updates from the
          NEXTDEVKIT team. Learn how to build better SaaS applications.
        </p>
      </div>

      {/* Posts List */}
      <div className="space-y-12">
        {mockPosts.map((post, index) => (
          <div key={post.slug}>
            <BlogPostItem post={post} />
            {index < mockPosts.length - 1 && <Separator className="mt-12" />}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-16">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
