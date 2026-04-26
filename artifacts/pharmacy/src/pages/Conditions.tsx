import React, { useState } from "react";
import { Link } from "wouter";
import { useListConditions } from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Pill, Stethoscope, HeartPulse, User, Activity, Baby, Eye, Droplets, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const categoryStyles: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  skin: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]", icon: Droplets },
  womens_health: { bg: "bg-[#F062A4]/10", text: "text-[#F062A4]", border: "border-[#F062A4]", icon: HeartPulse },
  eye_care: { bg: "bg-[#4B9FE1]/10", text: "text-[#4B9FE1]", border: "border-[#4B9FE1]", icon: Eye },
  digestive: { bg: "bg-[#F97316]/10", text: "text-[#F97316]", border: "border-[#F97316]", icon: Activity },
  children_family: { bg: "bg-[#8B5CF6]/10", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]", icon: Baby },
  pain_minor_illness: { bg: "bg-[#168A7B]/10", text: "text-[#168A7B]", border: "border-[#168A7B]", icon: Pill },
  allergy: { bg: "bg-[#D97706]/10", text: "text-[#D97706]", border: "border-[#D97706]", icon: Stethoscope },
  respiratory: { bg: "bg-[#0EA5E9]/10", text: "text-[#0EA5E9]", border: "border-[#0EA5E9]", icon: Stethoscope },
  ear: { bg: "bg-[#168A7B]/10", text: "text-[#168A7B]", border: "border-[#168A7B]", icon: Stethoscope },
  urinary: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]", icon: Droplets },
  default: { bg: "bg-primary/10", text: "text-primary", border: "border-primary", icon: Pill }
};

const formatCategory = (category: string) => {
  return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function Conditions() {
  const { data: conditions, isLoading } = useListConditions();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
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
      groups[c.category].push(c);
    });
    return groups;
  }, [filteredConditions]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/medical-bg.png')] opacity-5 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight"
            >
              Treatments & Conditions
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Browse our range of treatments. Our UK-qualified pharmacists can prescribe medication for over 25 conditions.
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
          {/* Filter Pills */}
          {!isLoading && categories.length > 0 && (
            <div className="flex overflow-x-auto pb-6 mb-8 gap-3 snap-x hide-scrollbar scroll-smooth">
              <Button 
                variant={activeCategory === null ? "default" : "outline"} 
                className={`rounded-full whitespace-nowrap snap-start ${activeCategory === null ? "bg-secondary text-white hover:bg-secondary/90 shadow-md" : "bg-white text-secondary hover:bg-muted"}`}
                onClick={() => setActiveCategory(null)}
              >
                All Conditions
              </Button>
              {categories.map(category => {
                const style = categoryStyles[category] || categoryStyles.default;
                const isActive = activeCategory === category;
                const Icon = style.icon;
                
                return (
                  <Button 
                    key={category}
                    variant="outline"
                    className={`rounded-full whitespace-nowrap snap-start transition-all duration-300 border-border/50 ${isActive ? `bg-secondary text-white shadow-md border-secondary` : `bg-white hover:${style.bg} hover:${style.text}`}`}
                    onClick={() => setActiveCategory(isActive ? null : category)}
                  >
                    <Icon className={`w-4 h-4 mr-2 ${isActive ? "text-white" : style.text}`} />
                    {formatCategory(category)}
                  </Button>
                );
              })}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-16">
              {[1, 2].map(i => (
                <div key={i}>
                  <Skeleton className="h-10 w-64 mb-8 rounded-lg" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(j => <Skeleton key={j} className="h-56 rounded-2xl" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-20">
              <AnimatePresence>
                {Object.entries(groupedConditions).map(([category, items], i) => {
                  const style = categoryStyles[category] || categoryStyles.default;
                  const Icon = style.icon;
                  
                  return (
                    <motion.section 
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                    >
                      <div className="flex items-center gap-4 mb-8">
                        <div className={`w-12 h-12 rounded-2xl ${style.bg} flex items-center justify-center ${style.text} shadow-sm`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-secondary">{formatCategory(category)}</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {items.map(condition => (
                          <Link key={condition.id} href={`/conditions/${condition.id}`}>
                            <Card className="h-full hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border hover:shadow-lg group bg-white relative overflow-hidden rounded-2xl">
                              {/* Left Accent Bar */}
                              <div className={`absolute left-0 top-0 w-[3px] group-hover:w-[6px] h-full ${style.bg.replace('/10', '')} transition-all duration-300`}></div>
                              
                              <CardContent className="p-8 pl-10 flex flex-col h-full relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                  <h3 className="text-2xl font-bold text-secondary group-hover:text-primary transition-colors leading-tight">
                                    {condition.name}
                                  </h3>
                                  {condition.requiresPhoto && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 ml-2 shrink-0">
                                      Photo required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground text-sm flex-1 mb-8 line-clamp-2 leading-relaxed">
                                  {condition.description}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-5 border-t border-border/50">
                                  <Badge className={`bg-muted text-muted-foreground hover:bg-muted font-medium border-none`}>
                                    {formatCategory(category)}
                                  </Badge>
                                  <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Start consultation <ArrowRight className="w-4 h-4" />
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </motion.section>
                  );
                })}
              </AnimatePresence>
              
              {Object.keys(groupedConditions).length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-32 bg-white rounded-3xl border border-dashed border-border"
                >
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                    <Search className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary mb-3">No conditions found</h3>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto mb-8">
                    We couldn't find any conditions matching your search. Try different keywords or browse all categories.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => { setSearchTerm(""); setActiveCategory(null); }} 
                    className="bg-secondary hover:bg-secondary/90 rounded-full px-8"
                  >
                    Clear all filters
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}