import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const quickLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Documentation" },
  { href: "/changelog", label: "Changelog" },
];

const resources = [
  { href: "/blog", label: "Blog" },
  { href: "/guides", label: "Guides" },
  { href: "/support", label: "Support" },
  { href: "/api", label: "API Reference" },
];

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

const social = [
  { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
  { href: "https://github.com", icon: Github, label: "GitHub" },
  { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Newsletter */}
          <div className="max-w-md">
            <Link href="/" className="mb-4 inline-block text-xl font-bold">
              NextDevKit
            </Link>
            <p className="mb-6 text-muted-foreground">
              Subscribe to our newsletter for updates, tips, and exclusive
              content for building better SaaS applications.
            </p>
            <form className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button className="bg-violet-600 hover:bg-violet-700">
                Subscribe
              </Button>
            </form>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="mb-4 text-sm font-semibold">Quick Links</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold">Resources</h3>
              <ul className="space-y-3">
                {resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold">Legal</h3>
              <ul className="space-y-3">
                {legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NextDevKit. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            {social.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
