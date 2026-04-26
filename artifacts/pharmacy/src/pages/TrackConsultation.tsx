import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Package, Clock, ShieldCheck, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useListConsultations } from "@workspace/api-client-react";
import { motion } from "framer-motion";

const trackSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function TrackConsultation() {
  const [emailToTrack, setEmailToTrack] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [_, setLocation] = useLocation();
  
  const form = useForm<z.infer<typeof trackSchema>>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      email: "",
    },
  });

  const { data, isLoading } = useListConsultations(
    {}, 
    { query: { enabled: !!emailToTrack && hasSearched } }
  );

  const myConsultations = React.useMemo(() => {
    if (!data?.consultations || !emailToTrack) return [];
    return data.consultations.filter(c => c.patientEmail.toLowerCase() === emailToTrack.toLowerCase());
  }, [data, emailToTrack]);

  function onSubmit(values: z.infer<typeof trackSchema>) {
    setEmailToTrack(values.email);
    setHasSearched(true);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none font-semibold px-3 py-1">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none font-semibold px-3 py-1">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-none font-semibold px-3 py-1">Rejected</Badge>;
      case "more_info_needed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none font-semibold px-3 py-1">More Info Needed</Badge>;
      case "referred":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-none font-semibold px-3 py-1">Referred</Badge>;
      case "red_flag":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-none font-semibold px-3 py-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Urgent</Badge>;
      default:
        return <Badge variant="outline" className="font-semibold px-3 py-1">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "more_info_needed":
        return <Clock className="w-6 h-6 text-amber-600" />;
      case "approved":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "rejected":
        return <XCircle className="w-6 h-6 text-slate-600" />;
      case "referred":
      case "red_flag":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Header />
      
      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-secondary via-secondary/95 to-primary text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-white/5 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 tracking-tight"
            >
              Track your consultation
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
            >
              Enter the email address you used during your consultation to check its current status.
            </motion.p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-6 py-12 -mt-16 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-12 border-border/50 shadow-xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm">
              <CardContent className="p-8 md:p-10">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative shadow-sm rounded-full">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                <Input 
                                  placeholder="Enter your email address" 
                                  className="pl-14 h-16 text-lg rounded-full bg-muted/20 border-border/50 focus-visible:ring-primary/30" 
                                  {...field} 
                                  data-testid="input-track-email"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="pl-4 pt-1" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" size="lg" className="h-16 px-10 w-full md:w-auto rounded-full text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-md hover:-translate-y-0.5 transition-all" disabled={isLoading} data-testid="button-track-submit">
                      {isLoading ? "Searching..." : "Track Now"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {hasSearched && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-serif font-bold text-secondary flex items-center gap-3">
                Results for <span className="text-primary break-all">{emailToTrack}</span>
              </h2>

              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2].map(i => (
                    <Card key={i} className="animate-pulse rounded-2xl border-none shadow-sm">
                      <CardContent className="p-8 h-40 bg-muted/30"></CardContent>
                    </Card>
                  ))}
                </div>
              ) : myConsultations.length > 0 ? (
                <div className="space-y-6">
                  {myConsultations.map(consultation => (
                    <Card key={consultation.id} className="overflow-hidden border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-0">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-4 flex-wrap">
                              <h3 className="text-2xl font-bold text-secondary">{consultation.conditionName}</h3>
                              {getStatusBadge(consultation.status)}
                            </div>
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-4 flex-wrap">
                              <span className="bg-muted/50 px-3 py-1 rounded-full">ID: {consultation.id.slice(0, 8)}...</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Submitted: {new Date(consultation.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 bg-muted/20 p-5 rounded-2xl md:w-72 shrink-0 border border-border/50">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                              consultation.status === 'pending' || consultation.status === 'more_info_needed' ? 'bg-amber-100' :
                              consultation.status === 'approved' ? 'bg-green-100' :
                              consultation.status === 'rejected' ? 'bg-slate-200' :
                              'bg-red-100'
                            }`}>
                              {getStatusIcon(consultation.status)}
                            </div>
                            <div>
                              <p className="font-bold text-secondary">
                                {consultation.status === 'pending' ? 'Under Review' : 
                                 consultation.status === 'approved' ? 'Prescription Issued' : 
                                 consultation.status === 'rejected' ? 'Not Approved' : 
                                 'Attention Needed'}
                              </p>
                              <p className="text-sm text-muted-foreground font-medium">
                                {consultation.status === 'pending' ? 'A pharmacist will review shortly.' : 
                                 consultation.status === 'approved' ? 'Your medication is ready.' : 
                                 'Please check your email for details.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 bg-muted/10 rounded-3xl">
                  <CardContent className="p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Search className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary mb-3">No consultations found</h3>
                    <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                      We couldn't find any active consultations for <strong className="text-secondary">{emailToTrack}</strong>.
                    </p>
                    <Button variant="outline" className="rounded-full px-8 h-12 font-bold" onClick={() => setHasSearched(false)}>Try another email</Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
