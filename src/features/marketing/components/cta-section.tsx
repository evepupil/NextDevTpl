import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const supportTeam = [
  { src: "/avatars/01.png", fallback: "A" },
  { src: "/avatars/02.png", fallback: "B" },
  { src: "/avatars/03.png", fallback: "C" },
];

export function CTASection() {
  return (
    <section className="container py-24">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-8 text-center text-white md:p-16">
          {/* Background decoration */}
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
              Still have questions?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-white/80">
              Our team is here to help. Reach out to us and we&apos;ll get back to
              you as soon as possible.
            </p>

            <div className="mb-8 flex items-center justify-center">
              <div className="flex -space-x-3">
                {supportTeam.map((member, i) => (
                  <Avatar
                    key={i}
                    className="h-12 w-12 border-2 border-white"
                  >
                    <AvatarImage src={member.src} />
                    <AvatarFallback className="bg-violet-400 text-white">
                      {member.fallback}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="ml-4 text-sm text-white/80">
                Our support team
              </span>
            </div>

            <Button
              size="lg"
              className="gap-2 bg-white text-violet-600 hover:bg-white/90"
              asChild
            >
              <Link href="/contact">
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
