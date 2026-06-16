import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { useListConditions } from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Pill,
  Stethoscope,
  HeartPulse,
  Activity,
  Baby,
  Eye,
  Droplets,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PromoBanner from "@/components/PromoBanner";
import CategoryCardGrid from "@/components/marketing/CategoryCardGrid";
import { CLINIC_CATEGORY_CARDS } from "@/data/everydaymedsSite";

const categoryStyles: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  skin: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]", icon: Droplets },
  womens_health: { bg: "bg-[#F062A4]/10", text: "text-[#F062A4]", border: "border-[#F062A4]", icon: HeartPulse },
  eye_care: { bg: "bg-[#4B9FE1]/10", text: "text-[#4B9FE1]", border: "border-[#4B9FE1]", icon: Eye },
  digestive: { bg: "bg-[#F97316]/10", text: "text-[#F97316]", border: "border-[#F97316]", icon: Activity },
  children_family: { bg: "bg-[#8B5CF6]/10", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]", icon: Baby },
  pain_minor_illness: { bg: "bg-[#0E3D2D]/10", text: "text-[#0E3D2D]", border: "border-[#0E3D2D]", icon: Pill },
  allergy: { bg: "bg-[#D97706]/10", text: "text-[#D97706]", border: "border-[#D97706]", icon: Stethoscope },
  respiratory: { bg: "bg-[#0EA5E9]/10", text: "text-[#0EA5E9]", border: "border-[#0EA5E9]", icon: Stethoscope },
  ear: { bg: "bg-[#0E3D2D]/10", text: "text-[#0E3D2D]", border: "border-[#0E3D2D]", icon: Stethoscope },
  urinary: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]", icon: Droplets },
  default: { bg: "bg-primary/10", text: "text-primary", border: "border-primary", icon: Pill }
};

const formatCategory = (category: string) => {
  return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const PREVIEW_CONDITION_COUNT = 4;

export default function Conditions() {
  const { data: conditions, isLoading } = useListConditions();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);
  
  const categories = React.useMemo(() => {
    if (!conditions) return [];
    return Array.from(new Set(conditions.map(c => c.category)));
  }, [conditions]);

  const filteredConditions = React.useMemo(() => {
    if (!conditions) return [];
    let result = conditions;
    
    if (activeCategory) {
      result = result.filter(c => c.category === activeCategory);
    }
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lower) || 
        c.category.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
      );
    }
    
    return result;
  }, [conditions, searchTerm, activeCategory]);

  const groupedConditions = React.useMemo(() => {
    const groups: Record<string, typeof conditions> = {};
    filteredConditions.forEach(c => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category]!.push(c);
    });
    return groups;
  }, [filteredConditions]);

  useEffect(() => {
    const keys = Object.keys(groupedConditions);
    if (activeCategory) {
      setOpenSections(keys.filter((key) => key === activeCategory));
      return;
    }
    if (searchTerm.trim()) {
      setOpenSections(keys);
      return;
    }
    setOpenSections([]);
  }, [activeCategory, searchTerm, groupedConditions]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <PromoBanner />
      <Header />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/medical-bg.png')] opacity-5 mix-blend-overlay" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight"
            >
              Let&apos;s find the right treatment for you
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Choose an option or search what you&apos;re looking for below.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto relative shadow-2xl rounded-full"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <Input 
                type="text" 
                placeholder="Search for a condition, treatment, or symptom..." 
                className="pl-12 h-16 text-lg rounded-full bg-white text-secondary border-none ring-offset-primary/20 focus-visible:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-conditions"
              />
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-12">
            <CategoryCardGrid
              items={CLINIC_CATEGORY_CARDS}
              columns={3}
              showDescription
              testIdPrefix="clinic-category"
            />
          </div>

          {/* Category filter dropdown */}
          {!isLoading && categories.length > 0 && (
            <div className="mb-8 max-w-xs sm:max-w-sm">
              <Select
                value={activeCategory ?? "all"}
                onValueChange={(value) =>
                  setActiveCategory(value === "all" ? null : value)
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-11 rounded-full border-border/50 px-4 shadow-sm",
                    activeCategory === null
                      ? "bg-secondary text-white hover:bg-secondary/90 [&_svg]:text-white/80"
                      : "bg-white text-secondary",
                  )}
                  data-testid="select-condition-category"
                >
                  <SelectValue placeholder="All Conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  {categories.map((category) => {
                    const style =
                      categoryStyles[category] || categoryStyles.default;
                    const Icon = style.icon;

                    return (
                      <SelectItem key={category} value={category}>
                        <span className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", style.text)} />
                          {formatCategory(category)}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : Object.keys(groupedConditions).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-white rounded-3xl border border-dashed border-border"
            >
              <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-3">
                No conditions found
              </h3>
              <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                We couldn&apos;t find any conditions matching your search. Try
                different keywords or browse all categories.
              </p>
              <Button
                size="lg"
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory(null);
                }}
                className="bg-secondary hover:bg-secondary/90 rounded-full px-8"
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="w-full space-y-3"
            >
              {Object.entries(groupedConditions).map(([category, items]) => {
                const style =
                  categoryStyles[category] || categoryStyles.default;
                const Icon = style.icon;
                const list = items ?? [];
                const isOpen = openSections.includes(category);
                const previewNames = list
                  .slice(0, PREVIEW_CONDITION_COUNT)
                  .map((c) => c.name);
                const remaining = Math.max(
                  0,
                  list.length - PREVIEW_CONDITION_COUNT,
                );

                return (
                  <AccordionItem
                    key={category}
                    value={category}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm border-b-0"
                  >
                    <AccordionTrigger className="px-4 py-5 hover:no-underline md:px-6 md:py-6 data-[state=open]:border-b data-[state=open]:border-border/50 data-[state=open]:pb-5 md:data-[state=open]:pb-6">
                      <div className="flex min-w-0 flex-1 flex-col gap-3 pr-2 text-left">
                        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-12 sm:w-12",
                              style.bg,
                              style.text,
                            )}
                          >
                            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="font-serif text-xl font-bold text-secondary sm:text-2xl">
                              {formatCategory(category)}
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {list.length}{" "}
                              {list.length === 1 ? "condition" : "conditions"}{" "}
                              available
                            </p>
                          </div>
                        </div>

                        {!isOpen && list.length > 0 && (
                          <div className="space-y-2 pl-0 sm:pl-[3.75rem]">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              <span className="font-medium text-secondary/80">
                                Includes:{" "}
                              </span>
                              {previewNames.join(" · ")}
                              {remaining > 0
                                ? ` · +${remaining} more`
                                : null}
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              See all {list.length} conditions
                            </p>
                          </div>
                        )}

                        {isOpen && (
                          <p className="text-sm font-semibold text-muted-foreground sm:pl-[3.75rem]">
                            Hide conditions
                          </p>
                        )}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pt-4 md:px-6 md:pt-5">
                      <div className="grid grid-cols-1 gap-5 pb-2 md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:pb-4">
                        {list.map((condition) => (
                          <Link
                            key={condition.id}
                            href={`/conditions/${condition.id}`}
                          >
                            <Card className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border-border bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                              <div
                                className={cn(
                                  "absolute left-0 top-0 h-full w-[3px] transition-all duration-300 group-hover:w-[5px]",
                                  style.bg.replace("/10", ""),
                                )}
                              />
                              <CardContent className="relative z-10 flex h-full flex-col p-6 pl-8">
                                <h3 className="mb-3 text-lg font-bold leading-tight text-secondary transition-colors group-hover:text-primary">
                                  {condition.name}
                                </h3>
                                <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                                  {condition.description}
                                </p>
                                <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
                                  <Badge className="border-none bg-muted font-medium text-muted-foreground hover:bg-muted">
                                    {formatCategory(category)}
                                  </Badge>
                                  <span className="flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
                                    Start consultation{" "}
                                    <ArrowRight className="h-4 w-4" />
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
