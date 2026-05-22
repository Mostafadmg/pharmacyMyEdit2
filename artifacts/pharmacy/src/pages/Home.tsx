import React from "react";
import { Link } from "wouter";
import { useListConditions } from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PressStrip from "@/components/PressStrip";
import ReviewsSection from "@/components/ReviewsSection";
import HomeFAQ from "@/components/HomeFAQ";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-pharmacy.png";
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

const categoryColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  skin: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]", icon: "text-[#FF6B6B]" },
  womens_health: { bg: "bg-[#F062A4]/10", text: "text-[#F062A4]", border: "border-[#F062A4]", icon: "text-[#F062A4]" },
  eye_care: { bg: "bg-[#4B9FE1]/10", text: "text-[#4B9FE1]", border: "border-[#4B9FE1]", icon: "text-[#4B9FE1]" },
  digestive: { bg: "bg-[#F97316]/10", text: "text-[#F97316]", border: "border-[#F97316]", icon: "text-[#F97316]" },
  children_family: { bg: "bg-[#8B5CF6]/10", text: "text-[#8B5CF6]", border: "border-[#8B5CF6]", icon: "text-[#8B5CF6]" },
  pain_minor_illness: { bg: "bg-[#0E3D2D]/10", text: "text-[#0E3D2D]", border: "border-[#0E3D2D]", icon: "text-[#0E3D2D]" },
  allergy: { bg: "bg-[#D97706]/10", text: "text-[#D97706]", border: "border-[#D97706]", icon: "text-[#D97706]" },
  respiratory: { bg: "bg-[#0EA5E9]/10", text: "text-[#0EA5E9]", border: "border-[#0EA5E9]", icon: "text-[#0EA5E9]" },
  ear: { bg: "bg-[#0E3D2D]/10", text: "text-[#0E3D2D]", border: "border-[#0E3D2D]", icon: "text-[#0E3D2D]" },
  urinary: { bg: "bg-[#FF6B6B]/10", text: "text-[#FF6B6B]", border: "border-[#FF6B6B]", icon: "text-[#FF6B6B]" },
  default: { bg: "bg-primary/10", text: "text-primary", border: "border-primary", icon: "text-primary" }
};

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
  
  const categories = React.useMemo(() => {
    if (!conditions) return [];
    const cats = new Set(conditions.map(c => c.category));
    return Array.from(cats).slice(0, 8);
  }, [conditions]);

  const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors.default;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-muted/50 to-white py-24 overflow-hidden border-b border-border/50">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full text-sm font-semibold text-primary border border-primary/10 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                UK GPhC-Regulated Pharmacy
              </div>
              
              <h1 className="text-5xl md:text-7xl font-serif font-semibold tracking-tight text-secondary leading-[1.1]">
                Expert pharmacy care, <em className="text-primary italic">without the wait.</em>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Secure, fast, and confidential online healthcare. Get your prescription reviewed by a UK prescriber and delivered to your door.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-full px-8 h-14 text-lg shadow-lg shadow-accent/20" asChild data-testid="hero-find-treatment">
                  <Link href="/conditions">Find your treatment</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 rounded-full px-8 h-14 text-lg font-semibold" asChild data-testid="hero-my-consultations">
                  <Link href="/my-consultations">My consultations</Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="relative order-first lg:order-last"
            >
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Decorative background circle */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-2xl transform rotate-12"></div>
                
                {/* Floating Cards */}
                <Card className="absolute top-10 -left-12 p-5 rounded-2xl shadow-xl border-border/50 bg-white/90 backdrop-blur-md z-20 animate-[bounce_4s_infinite_alternate]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary">2,000+</p>
                      <p className="text-sm font-medium text-muted-foreground">Consultations Reviewed</p>
                    </div>
                  </div>
                </Card>

                <Card className="absolute bottom-20 -right-8 p-5 rounded-2xl shadow-xl border-border/50 bg-white/90 backdrop-blur-md z-20 animate-[bounce_5s_infinite_alternate-reverse]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-secondary">Same-day response</p>
                      <p className="text-sm font-medium text-muted-foreground">During working hours</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="absolute -bottom-6 left-1/4 p-4 rounded-2xl shadow-xl border-border/50 bg-white/90 backdrop-blur-md z-20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-secondary">GPhC Regulated</p>
                    </div>
                  </div>
                </Card>
                
                {/* Main hero image */}
                <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-primary/5 to-accent/10 border-2 border-white shadow-inner overflow-hidden z-10">
                    <img
                      src={heroImage}
                      alt="UK GPhC-regulated pharmacist reviewing a prescription"
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <PressStrip />

        {/* How it Works */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-serif font-bold text-secondary mb-6">Simple, secure healthcare</h2>
              <p className="text-xl text-muted-foreground">
                Get the treatment you need safely and securely in just four simple steps, all reviewed by a UK prescriber.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 relative">
              <div className="hidden md:block absolute top-10 left-[10%] w-[80%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -z-10"></div>
              
              {[
                { icon: Stethoscope, title: "Choose treatment", desc: "Browse our range of conditions and select the treatment you need." },
                { icon: Activity, title: "Questionnaire", desc: "Answer a few simple medical questions securely online." },
                { icon: UserCheck, title: "Pharmacist review", desc: "Our UK pharmacist will review your answers to ensure safety." },
                { icon: CheckCircle2, title: "Get treatment", desc: "If approved, collect from pharmacy or get discreet delivery." }
              ].map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.5 }}
                  className="relative group flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-white rounded-full shadow-md border-4 border-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:border-primary transition-all duration-300 relative z-10">
                    <step.icon className="w-8 h-8" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold flex items-center justify-center text-sm shadow-sm border-2 border-white">
                      {idx + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Browse Categories */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <h2 className="text-4xl font-serif font-bold text-secondary mb-4">Treatments by Category</h2>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  We offer private prescriptions for a wide range of conditions without needing to see a GP.
                </p>
              </div>
              <Button variant="outline" className="border-secondary/20 text-secondary hover:bg-secondary hover:text-white rounded-full font-semibold px-6" asChild>
                <Link href="/conditions">View All Treatments <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category, i) => {
                const Icon = iconMap[category] || Pill;
                const colors = getCategoryColor(category);
                const formatName = category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <Link href="/conditions">
                      <Card className={`h-full hover:-translate-y-1 transition-all duration-300 cursor-pointer border-transparent shadow-sm hover:shadow-md overflow-hidden group bg-white`}>
                        <CardContent className="p-8 flex flex-col items-center text-center justify-center h-full gap-5 relative">
                          <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center ${colors.icon} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div>
                            <span className="font-bold text-secondary text-lg block mb-1">
                              {formatName}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">View treatments</span>
                          </div>
                          
                          {/* Accent border bottom */}
                          <div className={`absolute bottom-0 left-0 w-full h-1 ${colors.bg} group-hover:h-2 transition-all duration-300`}></div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Conditions */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif font-bold text-secondary mb-4">Popular Treatments</h2>
              <p className="text-lg text-muted-foreground">Quick, discreet access to common medications.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularConditions.map((condition, i) => {
                const colors = getCategoryColor(condition.category);
                return (
                  <motion.div
                    key={condition.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                  >
                    <Link href={`/conditions/${condition.id}`}>
                      <Card className={`h-full transition-all duration-300 cursor-pointer border-border hover:shadow-lg group bg-white relative overflow-hidden`}>
                        <div className={`absolute left-0 top-0 w-1.5 h-full ${colors.bg}`}></div>
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${colors.bg}`}></div>
                        
                        <CardContent className="p-8 pl-10 flex flex-col h-full z-10 relative">
                          <div className="mb-4">
                            <span className={`text-xs font-bold uppercase tracking-wider ${colors.text} px-2 py-1 rounded-md ${colors.bg}`}>
                              {condition.category.split('_').join(' ')}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-secondary mb-3 group-hover:text-primary transition-colors">
                            {condition.name}
                          </h3>
                          <p className="text-muted-foreground text-sm flex-1 mb-8 line-clamp-2 leading-relaxed">
                            {condition.description}
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-5 border-t border-border">
                            <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                              View details <ArrowRight className="w-4 h-4" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-24 bg-muted/20 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-8 leading-tight">
                  Clinical Excellence. <br/><span className="text-primary">Digital Convenience.</span>
                </h2>
                
                <div className="space-y-10">
                  <div className="flex gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex-shrink-0 flex items-center justify-center text-primary border border-border">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary mb-2">Regulated & Safe</h3>
                      <p className="text-muted-foreground leading-relaxed">We are fully regulated by the General Pharmaceutical Council (GPhC) and comply with strict UK healthcare standards. Your health is our priority.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex-shrink-0 flex items-center justify-center text-primary border border-border">
                      <UserCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary mb-2">Independent Prescribers</h3>
                      <p className="text-muted-foreground leading-relaxed">Every consultation is reviewed by a highly qualified Pharmacist Independent Prescriber based in the UK, ensuring expert clinical oversight.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex-shrink-0 flex items-center justify-center text-primary border border-border">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary mb-2">Same-Day Review</h3>
                      <p className="text-muted-foreground leading-relaxed">Submit your consultation during working hours and expect a clinical decision and prescription within hours, not days.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
                <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-border/50 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
                  <h3 className="text-3xl font-serif font-bold text-secondary mb-6">Trusted by patients</h3>
                  <div className="flex justify-center mb-8 text-accent">
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} className="w-8 h-8 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xl text-secondary font-medium italic mb-8">
                    "Fast, discreet, and incredibly professional. The pharmacist answered my questions clearly and the medication arrived the next day."
                  </p>
                  <p className="text-muted-foreground font-semibold">— Sarah M., London</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ReviewsSection />

        <HomeFAQ />

        {/* CTA */}
        <section className="py-32 relative overflow-hidden bg-secondary">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary to-secondary/90 z-0"></div>
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-3xl pointer-events-none z-0"></div>
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/20 blur-3xl pointer-events-none z-0"></div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-5xl font-serif font-bold text-white mb-6 leading-tight">
              Ready to start your consultation?
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Find your condition, answer a few medical questions securely, and get treatment delivered to your door.
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-12 h-16 text-xl shadow-xl font-bold" asChild data-testid="cta-browse-conditions">
              <Link href="/conditions">Browse All Treatments</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
