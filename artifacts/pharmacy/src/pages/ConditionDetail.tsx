import React from "react";
import { Link, useParams } from "wouter";
import { useGetCondition, getGetConditionQueryKey } from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, ShieldCheck, FileText, Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function ConditionDetail() {
  const { id } = useParams();
  const { data: condition, isLoading } = useGetCondition(id || "", {
    query: { enabled: !!id, queryKey: getGetConditionQueryKey(id || "") }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full">
        {isLoading ? (
          <div className="max-w-4xl mx-auto px-6 py-12">
            <Skeleton className="h-6 w-24 mb-8" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-8" />
            <Skeleton className="h-40 w-full mb-8" />
          </div>
        ) : !condition ? (
          <div className="text-center py-32">
            <h2 className="text-2xl font-bold text-secondary mb-4">Condition not found</h2>
            <Link href="/conditions">
              <Button>Browse all conditions</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-secondary text-white py-16">
              <div className="max-w-4xl mx-auto px-6">
                <Link href="/conditions" className="inline-flex items-center text-primary-foreground/80 hover:text-white mb-8 text-sm font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to conditions
                </Link>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground border-none">
                    {condition.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Badge>
                  {condition.ageRestrictions && (
                    <Badge variant="outline" className="text-white border-white/30">
                      {condition.ageRestrictions}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
                  {condition.name}
                </h1>
                
                <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl leading-relaxed">
                  {condition.description}
                </p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-2 space-y-12">
                <section>
                  <h2 className="text-2xl font-bold text-secondary mb-6">How it works</h2>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">1</div>
                      <div>
                        <h3 className="text-lg font-semibold text-secondary mb-1">Complete a short questionnaire</h3>
                        <p className="text-muted-foreground">Answer medical questions about your symptoms and health history. This takes about {Math.ceil(condition.questionsCount / 2)} minutes.</p>
                      </div>
                    </div>
                    
                    {condition.requiresPhoto && (
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-secondary mb-1">Upload photos</h3>
                          <p className="text-muted-foreground">You'll need to securely upload photos of your condition for our pharmacist to review.</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">2</div>
                      <div>
                        <h3 className="text-lg font-semibold text-secondary mb-1">Pharmacist review</h3>
                        <p className="text-muted-foreground">One of our independent prescriber pharmacists will review your answers to ensure treatment is safe for you.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary font-bold">3</div>
                      <div>
                        <h3 className="text-lg font-semibold text-secondary mb-1">Receive treatment</h3>
                        <p className="text-muted-foreground">If approved, your prescription will be issued and sent to your chosen pharmacy or delivered to your door.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="bg-muted/50 p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-semibold text-secondary mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Important Information
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>This service is not for medical emergencies.</li>
                    <li>You must provide truthful and accurate information about your health.</li>
                    {condition.requiresInPerson && (
                      <li className="text-destructive font-medium">Certain symptoms may require you to see a doctor in person.</li>
                    )}
                  </ul>
                </section>
              </div>

              <div>
                <div className="bg-white p-6 rounded-2xl border border-border shadow-lg sticky top-24">
                  <h3 className="text-xl font-bold text-secondary mb-4">Start consultation</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      Takes ~{Math.ceil(condition.questionsCount / 2)} minutes
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="w-4 h-4 mr-2" />
                      {condition.questionsCount} questions
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Confidential & secure
                    </div>
                  </div>
                  
                  {condition.onlineEligible ? (
                    <Button className="w-full text-lg h-12" size="lg" asChild data-testid="button-start-consultation">
                      <Link href={`/consult/${condition.id}`}>Start now</Link>
                    </Button>
                  ) : (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm font-medium">
                      This condition cannot be treated online. Please visit your GP or local pharmacy.
                    </div>
                  )}
                  
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By starting, you agree to our terms of service and privacy policy.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
