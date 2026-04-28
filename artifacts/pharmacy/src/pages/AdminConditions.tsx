import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Stethoscope, Plus, Edit, ListChecks } from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";

type Condition = {
  id: string; name: string; category: string; description: string;
  questionsCount: number;
  questionsJson: unknown[] | null;
  priceGbp: number; active: boolean;
  onlineEligible: boolean;
};

export default function AdminConditions() {
  const [conditions, setConditions] = useState<Condition[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ conditions: Condition[] }>("/api/admin/conditions", { auth: "pharmacist" })
      .then(d => setConditions(d.conditions))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PharmacistLayout current="conditions">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Stethoscope className="w-7 h-7 text-primary" /> Conditions</h1>
            <p className="text-muted-foreground">Build & maintain consultation question sets.</p>
          </div>
          <Button asChild className="rounded-full" data-testid="btn-new-condition">
            <Link href="/dashboard/conditions/new"><Plus className="w-4 h-4 mr-1" /> New condition</Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {conditions?.map(c => (
              <Card key={c.id} className="hover-elevate cursor-pointer" data-testid={`condition-card-${c.id}`}>
                <Link href={`/dashboard/conditions/${c.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{c.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{c.category.replace(/-/g, " ")}</p>
                      </div>
                      {!c.active && <Badge variant="outline" className="text-rose-600 border-rose-200">Hidden</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <ListChecks className="w-4 h-4" /> {c.questionsCount} questions
                      </span>
                      <span className="font-semibold text-primary">{formatGbp(c.priceGbp)}</span>
                      <Edit className="w-4 h-4 text-muted-foreground ml-auto" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PharmacistLayout>
  );
}
