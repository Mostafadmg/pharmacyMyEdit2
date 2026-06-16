import React from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SiteCategoryCard } from "@/data/everydaymedsSite";

type CategoryCardGridProps = {
  items: SiteCategoryCard[];
  columns?: 2 | 3 | 4;
  showTagline?: boolean;
  showDescription?: boolean;
  testIdPrefix?: string;
};

export default function CategoryCardGrid({
  items,
  columns = 4,
  showTagline = false,
  showDescription = false,
  testIdPrefix = "category",
}: CategoryCardGridProps) {
  const gridClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid ${gridClass} gap-5`}>
      {items.map((item) => (
        <Link key={item.title + item.href} href={item.href}>
          <Card
            className="group h-full overflow-hidden border-border/70 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            data-testid={`${testIdPrefix}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          >
            <CardContent className="flex h-full flex-col p-6">
              {showTagline && item.tagline ? (
                <p className="text-sm text-muted-foreground">{item.tagline}</p>
              ) : null}
              <h3 className="text-xl font-bold text-secondary group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              {showDescription && item.description ? (
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Explore
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
