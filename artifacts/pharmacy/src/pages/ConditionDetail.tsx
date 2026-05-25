import React, { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useGetCondition, getGetConditionQueryKey } from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, ShieldCheck, FileText, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ConditionDetail() {
  const { id } = useParams();
  const { data: condition, isLoading } = useGetCondition(id || "", {
    query: { enabled: !!id, queryKey: getGetConditionQueryKey(id || "") }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      
      <main className="flex-1 w-full">
        {isLoading ? (
          <div className="max-w-5xl mx-auto px-6 py-16">
            <Skeleton className="h-6 w-32 mb-8" />
            <Skeleton className="h-16 w-3/4 mb-6" />
            <Skeleton className="h-6 w-1/4 mb-12" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-40 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
              <div>
                <Skeleton className="h-80 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        ) : !condition ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 px-6 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <Info className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-secondary mb-4">Condition not found</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We couldn't find the condition you're looking for. It may have been moved or removed.
            </p>
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link href="/conditions">Browse all conditions</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Full-width Hero Band */}
            <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="max-w-6xl mx-auto px-6 relative z-10">
                <Link href="/conditions" className="inline-flex items-center text-primary-foreground/80 hover:text-white mb-8 text-sm font-medium transition-colors group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to conditions
                </Link>
                
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <Badge className="bg-white text-primary hover:bg-white/90 border-none font-bold px-3 py-1">
                    {condition.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Badge>
                  {condition.ageRestrictions && (
                    <Badge variant="outline" className="text-white border-white/30 px-3 py-1 font-medium bg-black/10">
                      {condition.ageRestrictions}
                    </Badge>
                  )}
                </div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 tracking-tight leading-tight max-w-3xl"
                >
                  {condition.name}
                </motion.h1>
              </div>
            </section>

            <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
              {/* Left Column: Description & Content */}
              <div className="lg:col-span-2 space-y-12">
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold text-secondary mb-4">About this treatment</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {condition.description}
                  </p>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-2xl font-bold text-secondary mb-6">How it works</h2>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-primary text-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold">
                        1
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-border shadow-sm">
                        <h3 className="text-lg font-bold text-secondary mb-2">Complete questionnaire</h3>
                        <p className="text-muted-foreground text-sm">Answer medical questions about your symptoms. Takes about {Math.ceil(condition.questionsCount / 2)} minutes.</p>
                      </div>
                    </div>
                    
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-secondary text-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-border shadow-sm">
                        <h3 className="text-lg font-bold text-secondary mb-2">Pharmacist review</h3>
                        <p className="text-muted-foreground text-sm">An independent prescriber reviews your answers to ensure safety.</p>
                      </div>
                    </div>
                  </div>
                </motion.section>

                {condition.requiresInPerson && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 font-medium">Some symptoms for this condition may require an in-person assessment. Our pharmacist will advise you during the consultation.</p>
                  </motion.section>
                )}
              </div>

              {/* Right Column: Sticky CTA */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-1"
              >
                <div className="bg-white p-8 rounded-3xl border border-border shadow-xl sticky top-28">
                  <h3 className="text-2xl font-bold text-secondary mb-2">Start consultation</h3>
                  <p className="text-muted-foreground mb-8">Get a private prescription online today.</p>
                  
                  <div className="space-y-5 mb-8">
                    <div className="flex items-center text-secondary">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Quick process</p>
                        <p className="text-sm text-muted-foreground">Takes ~{Math.ceil(condition.questionsCount / 2)} minutes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-secondary">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Thorough review</p>
                        <p className="text-sm text-muted-foreground">{condition.questionsCount} medical questions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-secondary">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4 shrink-0">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Confidential & secure</p>
                        <p className="text-sm text-muted-foreground">Your data is protected</p>
                      </div>
                    </div>
                  </div>
                  
                  {condition.onlineEligible ? (
                    <Button className="w-full text-lg h-14 bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5" size="lg" asChild data-testid="button-start-consultation">
                      <Link
                        href={
                          condition.id === "weight-loss"
                            ? "/consultation/weight-loss-injectable"
                            : `/consult/${condition.id}`
                        }
                      >
                        Start consultation now
                      </Link>
                    </Button>
                  ) : (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm font-semibold border border-destructive/20 flex gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      This condition cannot be treated online. Please visit your GP or local pharmacy.
                    </div>
                  )}
                  
                  <p className="text-xs text-center text-muted-foreground mt-6 leading-relaxed">
                    By starting this consultation, you agree to our terms of service and privacy policy.
                  </p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
