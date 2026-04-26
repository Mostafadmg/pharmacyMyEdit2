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
import { ArrowLeft, ShieldCheck, CheckCircle2, UploadCloud, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      if (isValid) setStep(2);
    });
  };

  const handleNextStep2 = () => {
    form2.trigger().then((isValid) => {
      if (isValid) setStep(3);
    });
  };

  const handleNextStep3 = () => {
    // Basic validation for generic questions
    if (Object.keys(symptoms).length < 2) {
      toast.error("Please answer all questions");
      return;
    }
    setStep(condition?.requiresPhoto ? 4 : 5);
  };

  const handleNextStep4 = () => {
    setStep(5);
  };

  const submitConsultation = () => {
    if (!conditionId || !hasConsented) return;

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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
          <Skeleton className="h-4 w-full mb-8" />
          <Skeleton className="h-12 w-2/3 mb-6" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-secondary mb-4">Consultation Submitted</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Our pharmacists are reviewing your details. This usually takes less than 2 hours during working hours.
          </p>
          <Card className="bg-muted/30 border-border mb-8 text-left">
            <CardContent className="p-6">
              <h3 className="font-semibold text-secondary mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-primary" /> What happens next?
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-secondary">1.</span>
                  We'll email you at <strong>{submittedEmail}</strong> with the outcome.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-secondary">2.</span>
                  If approved, you'll be able to choose your delivery or collection method.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-secondary">3.</span>
                  If our pharmacist needs more info, they'll message you securely.
                </li>
              </ul>
            </CardContent>
          </Card>
          <Button size="lg" asChild className="rounded-full px-8">
            <Link href="/">Return to Home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="bg-white border-b border-border py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/conditions/${condition.id}`} className="text-muted-foreground hover:text-secondary flex items-center text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
          </Link>
          <div className="text-secondary font-semibold">
            {condition.name} Consultation
          </div>
          <div className="w-20 flex items-center gap-1 text-xs font-medium text-muted-foreground justify-end">
            <ShieldCheck className="w-4 h-4 text-green-600" /> Secure
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-4">
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-bold text-secondary mb-2">Personal Details</h2>
              <p className="text-muted-foreground mb-8">We need to confirm your identity to prescribe medication safely.</p>
              
              <Form {...form1}>
                <form className="space-y-6 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-border">
                  <FormField control={form1.control} name="patientName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Legal Name</FormLabel>
                      <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form1.control} name="patientEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form1.control} name="patientAge" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form1.control} name="patientSex" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex at Birth</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="male" id="male" />
                              <Label htmlFor="male">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="female" id="female" />
                              <Label htmlFor="female">Female</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {form1.watch("patientSex") === "female" && (
                    <FormField control={form1.control} name="isPregnant" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I am currently pregnant or breastfeeding</FormLabel>
                        </div>
                      </FormItem>
                    )} />
                  )}

                  <div className="pt-4 flex justify-end">
                    <Button type="button" size="lg" onClick={handleNextStep1}>Continue to Medical History</Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-bold text-secondary mb-2">Medical History</h2>
              <p className="text-muted-foreground mb-8">This helps our pharmacist ensure the treatment is safe for you.</p>
              
              <Form {...form2}>
                <form className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-border">
                  <div className="space-y-4">
                    <FormField control={form2.control} name="allergies" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Are you allergic to any medications?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any allergies here..." 
                            className="resize-none" 
                            {...field} 
                            disabled={form2.watch("hasNoAllergies")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="hasNoAllergies" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal text-muted-foreground">I do not have any known allergies</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4">
                    <FormField control={form2.control} name="currentMedications" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Are you currently taking any other medication?</FormLabel>
                        <p className="text-sm text-muted-foreground mb-2">Include prescription, over-the-counter, and herbal remedies.</p>
                        <FormControl>
                          <Textarea 
                            placeholder="List medications here..." 
                            className="resize-none" 
                            {...field} 
                            disabled={form2.watch("hasNoMedications")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="hasNoMedications" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal text-muted-foreground">I am not taking any other medications</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="space-y-4">
                    <FormField control={form2.control} name="medicalHistory" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Do you have any ongoing medical conditions?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g. Asthma, High Blood Pressure, Diabetes..." 
                            className="resize-none" 
                            {...field} 
                            disabled={form2.watch("hasNoHistory")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form2.control} name="hasNoHistory" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal text-muted-foreground">I do not have any significant medical history</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button type="button" size="lg" onClick={handleNextStep2}>Continue to Symptoms</Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-bold text-secondary mb-2">Your Symptoms</h2>
              <p className="text-muted-foreground mb-8">Please answer these condition-specific questions honestly.</p>
              
              <div className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-border">
                {/* We'll use generic questions since the API doesn't provide specific ones in the schema */}
                <div className="space-y-4">
                  <Label className="text-base">How long have you had these symptoms?</Label>
                  <RadioGroup 
                    onValueChange={(val) => setSymptoms({...symptoms, duration: val})}
                    value={symptoms.duration || ""}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="less_than_week" id="d1" />
                      <Label htmlFor="d1" className="flex-1 cursor-pointer">Less than a week</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="1_to_4_weeks" id="d2" />
                      <Label htmlFor="d2" className="flex-1 cursor-pointer">1 to 4 weeks</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="more_than_month" id="d3" />
                      <Label htmlFor="d3" className="flex-1 cursor-pointer">More than a month</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">Have you tried any treatments for this already?</Label>
                  <Textarea 
                    placeholder="Please describe any creams, tablets, or remedies you've tried..." 
                    className="resize-none"
                    value={symptoms.previousTreatments || ""}
                    onChange={(e) => setSymptoms({...symptoms, previousTreatments: e.target.value})}
                  />
                </div>

                <div className="pt-4 flex justify-between border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button type="button" size="lg" onClick={handleNextStep3}>
                    {condition.requiresPhoto ? "Continue to Upload" : "Continue to Review"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && condition.requiresPhoto && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-bold text-secondary mb-2">Upload Photos</h2>
              <p className="text-muted-foreground mb-8">Our pharmacist needs to see the affected area to prescribe safely.</p>
              
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-border">
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                  <UploadCloud className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-secondary mb-1">Click to upload or drag and drop</h3>
                  <p className="text-sm text-muted-foreground mb-4">PNG, JPG up to 10MB</p>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Select Files</Button>
                </div>
                
                <div className="mt-6 bg-amber-50 p-4 rounded-lg text-amber-800 text-sm flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>Make sure the area is well-lit and in focus. Do not include your face or identifiable features if possible.</p>
                </div>

                <div className="pt-8 flex justify-between border-t border-border mt-8">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
                  <Button type="button" size="lg" onClick={handleNextStep4}>Continue to Review</Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === (condition.requiresPhoto ? 5 : 4) && (
            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-3xl font-bold text-secondary mb-2">Review & Consent</h2>
              <p className="text-muted-foreground mb-8">Please review your information before submitting.</p>
              
              <div className="space-y-6">
                <Card className="border-border shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg text-secondary">Personal Details</h3>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit</Button>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Name</dt>
                        <dd className="font-medium text-secondary">{form1.getValues().patientName}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Email</dt>
                        <dd className="font-medium text-secondary">{form1.getValues().patientEmail}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Age</dt>
                        <dd className="font-medium text-secondary">{form1.getValues().patientAge}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Sex</dt>
                        <dd className="font-medium text-secondary capitalize">{form1.getValues().patientSex}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg text-secondary mb-4">Patient Declaration</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          id="consent" 
                          checked={hasConsented} 
                          onCheckedChange={(checked) => setHasConsented(checked as boolean)} 
                        />
                        <div className="space-y-1 leading-tight">
                          <Label htmlFor="consent" className="text-base font-medium">I confirm that:</Label>
                          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mt-2">
                            <li>The information I have provided is truthful and accurate to the best of my knowledge.</li>
                            <li>I am requesting treatment for myself and will not share this medication with anyone else.</li>
                            <li>I understand this is a private service and I will be charged for the medication if prescribed.</li>
                            <li>I consent to my medical information being reviewed by a UK-registered pharmacist.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(condition.requiresPhoto ? 4 : 3)}>Back</Button>
                  <Button 
                    type="button" 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-8" 
                    onClick={submitConsultation}
                    disabled={!hasConsented || createMutation.isPending}
                  >
                    {createMutation.isPending ? "Submitting..." : "Submit Consultation"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
