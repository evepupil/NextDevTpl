"use client";

import Link from "next/link";
import {
  Box,
  Cpu,
  Eye,
  Globe,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const productItems = {
  dxPlatform: {
    title: "DX Platform",
    items: [
      {
        icon: Cpu,
        title: "Previews",
        description: "Helping teams ship 6× faster",
        href: "/products/previews",
      },
      {
        icon: Search,
        title: "AI",
        description: "Powering breakthroughs",
        href: "/products/ai",
      },
    ],
  },
  infrastructure: {
    title: "Managed Infrastructure",
    items: [
      {
        icon: Globe,
        title: "Rendering",
        description: "Fast, scalable, and reliable",
        href: "/products/rendering",
      },
      {
        icon: Eye,
        title: "Observability",
        description: "Trace every step",
        href: "/products/observability",
      },
      {
        icon: ShieldCheck,
        title: "Security",
        description: "Scale without compromising",
        href: "/products/security",
      },
    ],
  },
  openSource: {
    title: "Open Source",
    items: [
      {
        icon: Rocket,
        title: "Next.js",
        description: "The native Next.js platform",
        href: "/products/nextjs",
      },
      {
        icon: Box,
        title: "Turborepo",
        description: "Speed with Enterprise scale",
        href: "/products/turborepo",
      },
      {
        icon: Palette,
        title: "AI SDK",
        description: "The AI Toolkit for TypeScript",
        href: "/products/ai-sdk",
      },
    ],
  },
};

interface ListItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
}

function ListItem({ icon: Icon, title, description, href }: ListItemProps) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "flex select-none gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          )}
        >
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {description}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">NextDevKit</span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Products Mega Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Products
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[750px] grid-cols-3 gap-3 p-4">
                    {/* DX Platform */}
                    <div>
                      <h4 className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {productItems.dxPlatform.title}
                      </h4>
                      <ul className="space-y-1">
                        {productItems.dxPlatform.items.map((item) => (
                          <ListItem key={item.title} {...item} />
                        ))}
                      </ul>
                    </div>

                    {/* Managed Infrastructure */}
                    <div>
                      <h4 className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {productItems.infrastructure.title}
                      </h4>
                      <ul className="space-y-1">
                        {productItems.infrastructure.items.map((item) => (
                          <ListItem key={item.title} {...item} />
                        ))}
                      </ul>
                    </div>

                    {/* Open Source */}
                    <div>
                      <h4 className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {productItems.openSource.title}
                      </h4>
                      <ul className="space-y-1">
                        {productItems.openSource.items.map((item) => (
                          <ListItem key={item.title} {...item} />
                        ))}
                      </ul>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Other Links */}
              <NavigationMenuItem>
                <Link href="/docs" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none">
                    Docs
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none">
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none">
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/about" legacyBehavior passHref>
                  <NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none">
                    About
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-block"
          >
            Login
          </Link>
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
