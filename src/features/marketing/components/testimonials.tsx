import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    content:
      "NextDevKit saved me weeks of setup time. The authentication and payment integrations work flawlessly out of the box.",
    author: "Sarah Chen",
    handle: "@sarahchen",
    avatar: "/avatars/01.png",
    role: "Founder at TechStart",
  },
  {
    content:
      "The code quality is exceptional. It's clear that a lot of thought went into the architecture. Best investment I've made for my SaaS.",
    author: "Michael Park",
    handle: "@mpark_dev",
    avatar: "/avatars/02.png",
    role: "Senior Developer",
  },
  {
    content:
      "I've tried many starter kits, but this one stands out. The documentation is comprehensive and the support is amazing.",
    author: "Emily Johnson",
    handle: "@emilycodes",
    avatar: "/avatars/03.png",
    role: "Indie Hacker",
  },
  {
    content:
      "Shipped my MVP in just 2 weeks. The pre-built components and patterns made development a breeze.",
    author: "David Kim",
    handle: "@davidkim",
    avatar: "/avatars/04.png",
    role: "CTO at StartupXYZ",
  },
  {
    content:
      "The Tailwind + Shadcn setup is perfect. Everything is customizable and the dark mode works beautifully.",
    author: "Lisa Wang",
    handle: "@lisawang",
    avatar: "/avatars/05.png",
    role: "UI Designer",
  },
  {
    content:
      "Finally, a starter kit that uses modern best practices. TypeScript strict mode, proper error handling, and great DX.",
    author: "James Wilson",
    handle: "@jameswilson",
    avatar: "/avatars/01.png",
    role: "Full Stack Developer",
  },
];

export function Testimonials() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Trusted by developers worldwide
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            See what developers are saying about their experience with NextDevKit.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="rounded-xl border-0 bg-muted/50"
            >
              <CardContent className="p-6">
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-violet-100 text-violet-700">
                      {testimonial.author.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
