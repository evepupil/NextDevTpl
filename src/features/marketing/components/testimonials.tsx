import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

const testimonials = [
  {
    author: "Sarah Chen",
    handle: "@sarahchen",
    avatar: "/avatars/01.png",
    id: "sarah",
  },
  {
    author: "Michael Park",
    handle: "@mpark_dev",
    avatar: "/avatars/02.png",
    id: "michael",
  },
  {
    author: "Emily Johnson",
    handle: "@emilycodes",
    avatar: "/avatars/03.png",
    id: "emily",
  },
  {
    author: "David Kim",
    handle: "@davidkim",
    avatar: "/avatars/04.png",
    id: "david",
  },
  {
    author: "Lisa Wang",
    handle: "@lisawang",
    avatar: "/avatars/05.png",
    id: "lisa",
  },
  {
    author: "James Wilson",
    handle: "@jameswilson",
    avatar: "/avatars/01.png",
    id: "james",
  },
];

export async function Testimonials() {
  const t = await getTranslations("Marketing.testimonials");

  return (
    <section className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
              <Card key={index} className="rounded-xl border-0 bg-muted/50">
                <CardContent className="p-6">
                  <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                    &ldquo;{t(`items.${testimonial.id}.content`)}&rdquo;
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
                      {t(`items.${testimonial.id}.role`)}
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
