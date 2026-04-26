import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Package, Clock, ShieldCheck, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useListConsultations } from "@workspace/api-client-react";

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
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Rejected</Badge>;
      case "more_info_needed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">More Info Needed</Badge>;
      case "referred":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Referred</Badge>;
      case "red_flag":
        return <Badge variant="destructive">Urgent Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "more_info_needed":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case "referred":
      case "red_flag":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Package className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-secondary mb-4">Track your consultation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter the email address you used during your consultation to check its current status.
          </p>
        </div>

        <Card className="mb-12 border-border shadow-md">
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                            <Input 
                              placeholder="Enter your email address" 
                              className="pl-10 h-14 text-lg" 
                              {...field} 
                              data-testid="input-track-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8 w-full md:w-auto" disabled={isLoading} data-testid="button-track-submit">
                  {isLoading ? "Searching..." : "Track"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-secondary mb-6">
              Results for {emailToTrack}
            </h2>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 h-32 bg-muted/50"></CardContent>
                  </Card>
                ))}
              </div>
            ) : myConsultations.length > 0 ? (
              <div className="space-y-6">
                {myConsultations.map(consultation => (
                  <Card key={consultation.id} className="overflow-hidden border-border transition-all hover:shadow-md">
                    <CardContent className="p-0">
                      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold text-secondary">{consultation.conditionName}</h3>
                            {getStatusBadge(consultation.status)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-4">
                            <span>ID: {consultation.id.slice(0, 8)}...</span>
                            <span>Submitted: {new Date(consultation.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
                          {getStatusIcon(consultation.status)}
                          <div>
                            <p className="font-medium text-secondary">
                              {consultation.status === 'pending' ? 'Under Review' : 
                               consultation.status === 'approved' ? 'Prescription Issued' : 
                               consultation.status === 'rejected' ? 'Not Approved' : 
                               'Attention Needed'}
                            </p>
                            <p className="text-sm text-muted-foreground">
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
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary mb-2">No consultations found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any active consultations for {emailToTrack}.
                  </p>
                  <Button variant="outline" onClick={() => setHasSearched(false)}>Try another email</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
