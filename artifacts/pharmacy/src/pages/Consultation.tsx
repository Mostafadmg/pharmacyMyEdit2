import React, { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetCondition, 
  useCreateConsultation,
  getGetConditionQueryKey,
  NewConsultationInputPatientSex
} from "@workspace/api-client-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, CheckCircle2, UploadCloud, AlertCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";

// Step 1 Schema
const personalDetailsSchema = z.object({
  patientName: z.string().min(2, "Full name is required"),
  patientEmail: z.string().email("Valid email is required"),
  patientAge: z.coerce.number().min(18, "You must be at least 18 years old").max(120),
  patientSex: z.enum(["male", "female", "other"] as const),
  isPregnant: z.boolean().optional(),
});

// Step 2 Schema
const medicalHistorySchema = z.object({
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  medicalHistory: z.string().optional(),
  hasNoAllergies: z.boolean().optional(),
  hasNoMedications: z.boolean().optional(),
  hasNoHistory: z.boolean().optional(),
}).refine(data => data.allergies || data.hasNoAllergies, {
  message: "Please list allergies or check the box",
  path: ["allergies"],
}).refine(data => data.currentMedications || data.hasNoMedications, {
  message: "Please list medications or check the box",
  path: ["currentMedications"],
}).refine(data => data.medicalHistory || data.hasNoHistory, {
  message: "Please list medical history or check the box",
  path: ["medicalHistory"],
});

export default function Consultation() {
  const { conditionId } = useParams();
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState<Record<string, string>>({});
  const [hasConsented, setHasConsented] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { data: condition, isLoading } = useGetCondition(conditionId || "", {
    query: { enabled: !!conditionId, queryKey: getGetConditionQueryKey(conditionId || "") }
  });

  const createMutation = useCreateConsultation({
    mutation: {
      onSuccess: () => {
        setSubmittedEmail(form1.getValues().patientEmail);
        setIsSubmitted(true);
        window.scrollTo(0, 0);
      },
      onError: (error) => {
        toast.error("Failed to submit consultation. Please try again.");
        console.error(error);
      }
    }
  });

  const form1 = useForm<z.infer<typeof personalDetailsSchema>>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      patientName: "",
      patientEmail: "",
      patientAge: undefined,
      patientSex: "male",
      isPregnant: false,
    },
  });

  const form2 = useForm<z.infer<typeof medicalHistorySchema>>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      allergies: "",
      currentMedications: "",
      medicalHistory: "",
      hasNoAllergies: false,
      hasNoMedications: false,
      hasNoHistory: false,
    },
  });

  const totalSteps = condition?.requiresPhoto ? 5 : 4;
  const progress = (step / totalSteps) * 100;

  const handleNextStep1 = () => {
    form1.trigger().then((isValid) => {
      if (isValid) {
        setStep(2);
        window.scrollTo(0, 0);
      }
    });
  };

  const handleNextStep2 = () => {
    form2.trigger().then((isValid) => {
      if (isValid) {
        setStep(3);
        window.scrollTo(0, 0);
      }
    });
  };

  const handleNextStep3 = () => {
    if (Object.keys(symptoms).length < 2) {
      toast.error("Please answer all questions");
      return;
    }
    setStep(condition?.requiresPhoto ? 4 : 5);
    window.scrollTo(0, 0);
  };

  const handleNextStep4 = () => {
    setStep(5);
    window.scrollTo(0, 0);
  };

  const submitConsultation = () => {
    if (!conditionId || !hasConsented) {
      if (!hasConsented) toast.error("Please accept the terms to continue");
      return;
    }

    const pd = form1.getValues();
    const mh = form2.getValues();

    createMutation.mutate({
      data: {
        conditionId,
        patientName: pd.patientName,
        patientEmail: pd.patientEmail,
        patientAge: pd.patientAge,
        patientSex: pd.patientSex as NewConsultationInputPatientSex,
        isPregnant: pd.patientSex === 'female' ? pd.isPregnant : undefined,
        allergies: mh.hasNoAllergies ? "None" : mh.allergies,
        currentMedications: mh.hasNoMedications ? "None" : mh.currentMedications,
        medicalHistory: mh.hasNoHistory ? "None" : mh.medicalHistory,
        answers: symptoms,
        hasPhoto: condition?.requiresPhoto || false
      }
    });
  };

  if (isLoading || !condition) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
          <Skeleton className="h-4 w-full mb-8 rounded-full" />
          <Skeleton className="h-12 w-2/3 mb-6" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </main>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-24 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-28 h-28 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border-[6px] border-green-50"
          >
            <CheckCircle2 className="w-14 h-14" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif font-bold text-secondary mb-4"
          >
            Consultation Submitted
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mb-12"
          >
            Our pharmacists are reviewing your details. This usually takes less than 2 hours during working hours.
          </motion.p>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white border-border/50 mb-10 text-left shadow-lg rounded-3xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-primary to-accent"></div>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-secondary mb-6 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-3 text-primary" /> What happens next?
                </h3>
                <ul className="space-y-5 text-muted-foreground">
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
                    <div className="pt-1">We'll email you at <strong className="text-secondary">{submittedEmail}</strong> with the clinical decision.</div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
                    <div className="pt-1">If approved, you can select your delivery or collection preferences.</div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">3</div>
                    <div className="pt-1">If our pharmacist needs more info, they'll message you securely.</div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Button size="lg" asChild className="rounded-full px-12 h-14 text-lg font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all bg-secondary">
              <Link href="/">Return to Homepage</Link>
            </Button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-sans">
      <header className="bg-white border-b border-border/50 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
          <Link href={`/conditions/${condition.id}`} className="text-muted-foreground hover:text-secondary flex items-center text-sm font-medium transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Cancel
          </Link>
          <div className="text-secondary font-bold text-lg">
            {condition.name} Consultation
          </div>
          <div className="w-20 flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full justify-end">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure
          </div>
        </div>
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }} />
          </Progress>
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 md:py-16">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Personal Details</h2>
              <p className="text-lg text-muted-foreground mb-8">We need to confirm your identity to prescribe medication safely.</p>
              
              <Form {...form1}>
                <form className="space-y-6 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
                  <FormField control={form1.control} name="patientName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold text-secondary">Full Legal Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Jane Doe" className="h-14 text-lg rounded-xl bg-muted/20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form1.control} name="patientEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-bold text-secondary">Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="jane@example.com" className="h-14 text-lg rounded-xl bg-muted/20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form1.control} name="patientAge" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-secondary">Age</FormLabel>
                        <FormControl><Input type="number" className="h-14 text-lg rounded-xl bg-muted/20" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form1.control} name="patientSex" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-secondary">Sex at Birth</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-6 h-14 items-center">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="male" className="w-5 h-5 border-2 text-primary" />
                              <Label htmlFor="male" className="text-base cursor-pointer">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="female" className="w-5 h-5 border-2 text-primary" />
                              <Label htmlFor="female" className="text-base cursor-pointer">Female</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <AnimatePresence>
                    {form1.watch("patientSex") === "female" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <FormField control={form1.control} name="isPregnant" render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-4 space-y-0 rounded-2xl border-2 border-border/50 p-6 bg-muted/10 transition-colors hover:bg-muted/20 cursor-pointer">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6 border-2" />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="text-base font-semibold text-secondary cursor-pointer">I am currently pregnant or breastfeeding</FormLabel>
                            </div>
                          </FormItem>
                        )} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-6 flex justify-end">
                    <Button type="button" size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5" onClick={handleNextStep1}>
                      Continue to Medical History
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Medical History</h2>
              <p className="text-lg text-muted-foreground mb-8">This helps our pharmacist ensure the treatment is safe for you.</p>
              
              <Form {...form2}>
                <form className="space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
                  <div className="space-y-5">
                    <FormField control={form2.control} name="allergies" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold text-secondary">Are you allergic to any medications?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any allergies here..." 
                            className={`resize-none min-h-[100px] text-base rounded-xl transition-all ${form2.watch("hasNoAllergies") ? "opacity-50 bg-muted" : "bg-muted/20"}`}
                            {...field} 
                            disabled={form2.watch("hasNoAllergies")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="hasNoAllergies" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-muted/10 p-4 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors">
                        <FormControl><Checkbox className="w-5 h-5 border-2" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-semibold text-secondary cursor-pointer">I do not have any known allergies</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-5 pt-6 border-t border-border/50">
                    <FormField control={form2.control} name="currentMedications" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold text-secondary">Are you currently taking any other medication?</FormLabel>
                        <p className="text-sm font-medium text-muted-foreground mb-3">Include prescription, over-the-counter, and herbal remedies.</p>
                        <FormControl>
                          <Textarea 
                            placeholder="List medications here..." 
                            className={`resize-none min-h-[100px] text-base rounded-xl transition-all ${form2.watch("hasNoMedications") ? "opacity-50 bg-muted" : "bg-muted/20"}`}
                            {...field} 
                            disabled={form2.watch("hasNoMedications")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="hasNoMedications" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-muted/10 p-4 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors">
                        <FormControl><Checkbox className="w-5 h-5 border-2" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-semibold text-secondary cursor-pointer">I am not taking any other medications</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-5 pt-6 border-t border-border/50">
                    <FormField control={form2.control} name="medicalHistory" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-bold text-secondary">Do you have any ongoing medical conditions?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g. Asthma, High Blood Pressure, Diabetes..." 
                            className={`resize-none min-h-[100px] text-base rounded-xl transition-all ${form2.watch("hasNoHistory") ? "opacity-50 bg-muted" : "bg-muted/20"}`}
                            {...field} 
                            disabled={form2.watch("hasNoHistory")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="hasNoHistory" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-muted/10 p-4 rounded-xl cursor-pointer hover:bg-muted/20 transition-colors">
                        <FormControl><Checkbox className="w-5 h-5 border-2" checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-semibold text-secondary cursor-pointer">I do not have any significant medical history</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-8 flex flex-col-reverse sm:flex-row justify-between gap-4 border-t border-border/50">
                    <Button type="button" variant="outline" className="h-14 px-8 rounded-full text-lg font-bold border-2" onClick={() => setStep(1)}>Back</Button>
                    <Button type="button" size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5" onClick={handleNextStep2}>Continue to Symptoms</Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Your Symptoms</h2>
              <p className="text-lg text-muted-foreground mb-8">Please answer these condition-specific questions honestly.</p>
              
              <div className="space-y-10 bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
                <div className="space-y-4">
                  <Label className="text-lg font-bold text-secondary">How long have you had these symptoms?</Label>
                  <RadioGroup 
                    onValueChange={(val) => setSymptoms({...symptoms, duration: val})}
                    value={symptoms.duration || ""}
                    className="grid grid-cols-1 gap-3"
                  >
                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${symptoms.duration === 'less_than_week' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-muted/10'}`}>
                      <RadioGroupItem value="less_than_week" id="d1" className="w-5 h-5" />
                      <Label htmlFor="d1" className="flex-1 cursor-pointer font-medium text-base">Less than a week</Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${symptoms.duration === '1_to_4_weeks' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-muted/10'}`}>
                      <RadioGroupItem value="1_to_4_weeks" id="d2" className="w-5 h-5" />
                      <Label htmlFor="d2" className="flex-1 cursor-pointer font-medium text-base">1 to 4 weeks</Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${symptoms.duration === 'more_than_month' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/50 hover:bg-muted/10'}`}>
                      <RadioGroupItem value="more_than_month" id="d3" className="w-5 h-5" />
                      <Label htmlFor="d3" className="flex-1 cursor-pointer font-medium text-base">More than a month</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4 pt-6 border-t border-border/50">
                  <Label className="text-lg font-bold text-secondary">Have you tried any treatments for this already?</Label>
                  <Textarea 
                    placeholder="Please describe any creams, tablets, or remedies you've tried..." 
                    className="resize-none min-h-[120px] text-base rounded-xl bg-muted/20"
                    value={symptoms.previousTreatments || ""}
                    onChange={(e) => setSymptoms({...symptoms, previousTreatments: e.target.value})}
                  />
                </div>

                <div className="pt-8 flex flex-col-reverse sm:flex-row justify-between gap-4 border-t border-border/50">
                  <Button type="button" variant="outline" className="h-14 px-8 rounded-full text-lg font-bold border-2" onClick={() => setStep(2)}>Back</Button>
                  <Button type="button" size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5" onClick={handleNextStep3}>
                    {condition.requiresPhoto ? "Continue to Upload" : "Continue to Review"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && condition.requiresPhoto && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Upload Photos</h2>
              <p className="text-lg text-muted-foreground mb-8">Our pharmacist needs to see the affected area to prescribe safely.</p>
              
              <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
                <div className="border-2 border-dashed border-primary/40 rounded-2xl p-16 text-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors group">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-2">Click to upload or drag and drop</h3>
                  <p className="text-muted-foreground mb-6 font-medium">PNG, JPG up to 10MB</p>
                  <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary/10 rounded-full font-bold px-8">Select Files</Button>
                </div>
                
                <div className="mt-8 bg-amber-50 p-5 rounded-2xl text-amber-800 text-sm flex gap-4 border border-amber-100">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 text-amber-600 mt-0.5" />
                  <p className="font-medium text-base leading-relaxed">Make sure the area is well-lit and in focus. Do not include your face or identifiable features if possible. These images are stored securely and only viewed by our clinical team.</p>
                </div>

                <div className="pt-8 flex flex-col-reverse sm:flex-row justify-between gap-4 border-t border-border/50 mt-8">
                  <Button type="button" variant="outline" className="h-14 px-8 rounded-full text-lg font-bold border-2" onClick={() => setStep(3)}>Back</Button>
                  <Button type="button" size="lg" className="h-14 px-8 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5" onClick={handleNextStep4}>Continue to Review</Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === (condition.requiresPhoto ? 5 : 4) && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-secondary mb-3">Review & Consent</h2>
              <p className="text-lg text-muted-foreground mb-8">Please review your information before submitting.</p>
              
              <div className="space-y-6">
                <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                      <h3 className="font-bold text-xl text-secondary">Personal Details</h3>
                      <Button variant="ghost" className="text-primary font-bold hover:bg-primary/10 rounded-full px-4" onClick={() => setStep(1)}>Edit</Button>
                    </div>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-base">
                      <div>
                        <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Name</dt>
                        <dd className="font-semibold text-secondary">{form1.getValues().patientName}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Email</dt>
                        <dd className="font-semibold text-secondary">{form1.getValues().patientEmail}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Age</dt>
                        <dd className="font-semibold text-secondary">{form1.getValues().patientAge}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Sex</dt>
                        <dd className="font-semibold text-secondary capitalize">{form1.getValues().patientSex}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                      <h3 className="font-bold text-xl text-secondary">Medical History</h3>
                      <Button variant="ghost" className="text-primary font-bold hover:bg-primary/10 rounded-full px-4" onClick={() => setStep(2)}>Edit</Button>
                    </div>
                    <dl className="space-y-6 text-base">
                      <div>
                        <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Allergies</dt>
                        <dd className="font-semibold text-secondary">{form2.getValues().hasNoAllergies ? "None" : form2.getValues().allergies}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Medications</dt>
                        <dd className="font-semibold text-secondary">{form2.getValues().hasNoMedications ? "None" : form2.getValues().currentMedications}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Medical Conditions</dt>
                        <dd className="font-semibold text-secondary">{form2.getValues().hasNoHistory ? "None" : form2.getValues().medicalHistory}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-border/50 space-y-6">
                  <h3 className="font-bold text-xl text-secondary mb-4">Terms & Consent</h3>
                  <div className="bg-muted/30 p-6 rounded-2xl">
                    <div className="flex flex-row items-start space-x-4 space-y-0 cursor-pointer" onClick={() => setHasConsented(!hasConsented)}>
                      <Checkbox 
                        checked={hasConsented} 
                        onCheckedChange={(val) => setHasConsented(!!val)} 
                        className="w-6 h-6 border-2 mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="space-y-2 leading-relaxed">
                        <Label className="text-base font-bold text-secondary cursor-pointer block">
                          I confirm that the information I have provided is accurate and truthful.
                        </Label>
                        <p className="text-muted-foreground text-sm">
                          I understand that omitting or providing false medical information can be harmful to my health. I consent to the pharmacist reviewing my data to make a prescribing decision.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between gap-4 border-t border-border/50">
                    <Button type="button" variant="outline" className="h-14 px-8 rounded-full text-lg font-bold border-2" onClick={() => setStep(condition.requiresPhoto ? 4 : 3)}>Back</Button>
                    <Button 
                      type="button" 
                      className={`h-14 px-10 rounded-full text-lg font-bold shadow-md transition-all ${
                        hasConsented 
                        ? "bg-accent hover:bg-accent/90 text-accent-foreground hover:-translate-y-0.5 hover:shadow-lg" 
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
                      }`}
                      onClick={submitConsultation}
                      disabled={!hasConsented || createMutation.isPending}
                    >
                      {createMutation.isPending ? "Submitting..." : "Submit Consultation"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
