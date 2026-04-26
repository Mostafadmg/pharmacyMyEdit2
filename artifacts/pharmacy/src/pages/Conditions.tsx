import React from "react";
import { Link } from "wouter";
import { useListConditions, getListConditionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Pill, Stethoscope, HeartPulse, User, Activity, Baby, Eye, Droplets } from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ElementType> = {
  skin: Droplets,
  womens_health: HeartPulse,
  eye_care: Eye,
  digestive: Activity,
  children_family: Baby,
  pain_minor_illness: Pill,
  allergy: Stethoscope,
  respiratory: Stethoscope,
  ear: Stethoscope,
  urinary: Droplets,
};

const formatCategory = (category: string) => {
  return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function Conditions() {
  const { data: conditions, isLoading } = useListConditions();
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const filteredConditions = React.useMemo(() => {
    if (!conditions) return [];
    if (!searchTerm) return conditions;
    const lower = searchTerm.toLowerCase();
    return conditions.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.category.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower)
    );
  }, [conditions, searchTerm]);

  const groupedConditions = React.useMemo(() => {
    const groups: Record<string, typeof conditions> = {};
    filteredConditions.forEach(c => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return groups;
  }, [filteredConditions]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-secondary mb-4">Treatments & Conditions</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our range of treatments. Our UK-qualified pharmacists can prescribe medication for over 25 conditions.
          </p>
          
          <div className="max-w-md mx-auto mt-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              type="text" 
              placeholder="Search for a condition or treatment..." 
              className="pl-10 h-12 text-lg rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-conditions"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-12">
            {[1, 2].map(i => (
              <div key={i}>
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(j => <Skeleton key={j} className="h-48 rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(groupedConditions).map(([category, items], i) => {
              const Icon = iconMap[category] || Pill;
              return (
                <motion.section 
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-secondary">{formatCategory(category)}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(condition => (
                      <Link key={condition.id} href={`/conditions/${condition.id}`}>
                        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/50 group">
                          <CardContent className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-xl font-semibold text-secondary group-hover:text-primary transition-colors">
                                {condition.name}
                              </h3>
                              {condition.requiresPhoto && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                  Photo required
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm flex-1 mb-6 line-clamp-3">
                              {condition.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-xs font-medium text-muted-foreground">
                                {condition.onlineEligible ? "Online consult available" : "In-person only"}
                              </span>
                              <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/5 p-0 hover:bg-transparent">
                                View details →
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              );
            })}
            
            {Object.keys(groupedConditions).length === 0 && (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No conditions found matching "{searchTerm}".</p>
                <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2 text-primary">
                  Clear search
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
