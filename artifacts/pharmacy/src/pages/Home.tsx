import React from "react";
import { Link } from "wouter";
import { useListConditions } from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Stethoscope, 
  CheckCircle2, 
  ArrowRight,
  Droplets,
  HeartPulse,
  Eye,
  Activity,
  Baby,
  Pill
} from "lucide-react";

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

export default function Home() {
  const { data: conditions } = useListConditions();

  const popularConditions = conditions?.slice(0, 6) || [];
  
  // Group by category to show categories
  const categories = React.useMemo(() => {
    if (!conditions) return [];
    const cats = new Set(conditions.map(c => c.category));
    return Array.from(cats).slice(0, 6);
  }, [conditions]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative bg-secondary text-white py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero.png" 
              alt="Pharmacist consulting patient" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-secondary/40"></div>
          </div>
          
          <div className="max-w-6xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                GPhC-Regulated UK Pharmacy
              </div>
              
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Private pharmacy consultations, <span className="text-primary-foreground">reviewed by a UK prescriber.</span>
              </h1>
              
              <p className="text-xl text-white/80 max-w-lg leading-relaxed">
                Start in minutes. Secure, fast, and confidential online healthcare. Get your prescription delivered to your door or collect locally.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-14 text-lg" asChild>
                  <Link href="/conditions">Find your treatment</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg" asChild>
                  <Link href="/track">Track Consultation</Link>
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-x-8 gap-y-4 pt-8 border-t border-white/20">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="w-5 h-5 text-primary-foreground" />
                  Secure medical questionnaire
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-5 h-5 text-primary-foreground" />
                  Fast online review
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <UserCheck className="w-5 h-5 text-primary-foreground" />
                  UK-qualified pharmacist
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-muted/30 relative">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">How it works</h2>
              <p className="text-lg text-muted-foreground">
                Get the treatment you need safely and securely in just four simple steps.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="relative group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">1. Choose treatment</h3>
                <p className="text-muted-foreground">Browse our range of conditions and select the treatment you need.</p>
                <div className="hidden md:block absolute top-8 left-[70px] w-[calc(100%-40px)] h-0.5 bg-border -z-10"></div>
              </div>
              
              <div className="relative group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">2. Questionnaire</h3>
                <p className="text-muted-foreground">Answer a few simple medical questions securely online.</p>
                <div className="hidden md:block absolute top-8 left-[70px] w-[calc(100%-40px)] h-0.5 bg-border -z-10"></div>
              </div>
              
              <div className="relative group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">3. Pharmacist review</h3>
                <p className="text-muted-foreground">Our UK pharmacist will review your answers to ensure safety.</p>
                <div className="hidden md:block absolute top-8 left-[70px] w-[calc(100%-40px)] h-0.5 bg-border -z-10"></div>
              </div>
              
              <div className="relative group">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">4. Get treatment</h3>
                <p className="text-muted-foreground">If approved, collect from pharmacy or get discreet delivery.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Browse Categories */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Treatments by Category</h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  We offer private prescriptions for a wide range of conditions without needing to see a GP.
                </p>
              </div>
              <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-white" asChild>
                <Link href="/conditions">View All Treatments <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => {
                const Icon = iconMap[category] || Pill;
                return (
                  <Link key={category} href="/conditions">
                    <Card className="h-full hover:shadow-md transition-all cursor-pointer border-border hover:border-primary group bg-muted/10 hover:bg-white">
                      <CardContent className="p-6 flex flex-col items-center text-center justify-center h-full gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-semibold text-secondary text-sm">
                          {category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Conditions */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-12 text-center">Popular Treatments</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularConditions.map((condition) => (
                <Link key={condition.id} href={`/conditions/${condition.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-border hover:border-primary/50 group bg-white">
                    <CardContent className="p-6 flex flex-col h-full">
                      <h3 className="text-xl font-semibold text-secondary mb-2 group-hover:text-primary transition-colors">
                        {condition.name}
                      </h3>
                      <p className="text-muted-foreground text-sm flex-1 mb-6 line-clamp-2">
                        {condition.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                          {condition.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:underline">
                          View details <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 bg-secondary text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl opacity-50"></div>
          
          <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">Clinical Excellence. Digital Convenience.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto text-primary-foreground mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Regulated & Safe</h3>
                <p className="text-white/80">We are fully regulated by the General Pharmaceutical Council (GPhC) and comply with strict UK healthcare standards.</p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto text-primary-foreground mb-6">
                  <UserCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Independent Prescribers</h3>
                <p className="text-white/80">Every consultation is reviewed by a highly qualified Pharmacist Independent Prescriber based in the UK.</p>
              </div>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto text-primary-foreground mb-6">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold">Same-Day Review</h3>
                <p className="text-white/80">Submit your consultation during working hours and expect a clinical decision and prescription within hours.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-white text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-secondary mb-6">Ready to start?</h2>
            <p className="text-xl text-muted-foreground mb-10">
              Browse our conditions and start your secure medical consultation today.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-12 h-14 text-lg shadow-lg shadow-primary/20" asChild>
              <Link href="/conditions">Browse All Conditions</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
