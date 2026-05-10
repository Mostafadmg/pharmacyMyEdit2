import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { FileText, Download, RotateCcw, Pill, ChevronRight } from "lucide-react";
import { AccountSubPage } from "./AccountSubPage";
import { Button } from "@/components/ui/button";
import { apiFetch, apiUrl } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";
import { toast } from "sonner";

const PARENTS = [{ label: "Your account", href: "/account" }];

type RxOrderItem = {
  id: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  quantity: number;
  unitPriceGbp: number;
};
type RxConsultation = {
  id: string;
  conditionId: string;
  status: string;
  reviewedAt: string | null;
  prescriberName: string | null;
} | null;
type Rx = {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  consultationId: string | null;
  consultation: RxConsultation;
  items: RxOrderItem[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function Prescriptions() {
  const [, navigate] = useLocation();
  const [rows, setRows] = useState<Rx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("patient_token")) {
      navigate("/my-account/login");
      return;
    }
    apiFetch<{ prescriptions: Rx[] }>("/api/patient/prescriptions", { auth: "patient" })
      .then(d => setRows(d.prescriptions))
      .catch(err => toast.error(err instanceof Error ? err.message : "Couldn't load prescriptions."))
      .finally(() => setLoading(false));
  }, [navigate]);

  function pdfHref(consultId: string) {
    const token = localStorage.getItem("patient_token") ?? "";
    return apiUrl(`/api/consultations/${consultId}/prescription.pdf?token=${encodeURIComponent(token)}`);
  }

  return (
    <AccountSubPage
      parents={PARENTS}
      title="My prescriptions"
      intro="Every prescription our prescribers have issued for you. Download the signed PDF or request a repeat — your prescriber will review again before issuing."
    >
      {loading ? (
        <div className="space-y-3">
          {[0,1].map(i => <div key={i} className="h-32 bg-white border border-border/40 rounded-2xl animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border/40 p-10 text-center">
          <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold text-secondary">No prescriptions yet</p>
          <p className="text-sm text-muted-foreground mt-1">When a prescriber issues you a treatment, it'll show up here.</p>
          <Button asChild className="rounded-full mt-4 bg-primary hover:bg-primary/90">
            <Link href="/conditions">Start a consultation</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map(r => (
            <li key={r.orderId} className="bg-white rounded-2xl border border-border/40 p-5 md:p-6" data-testid={`rx-${r.orderId}`}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                <div>
                  <p className="font-bold text-secondary">Prescription · {r.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">Issued {formatDate(r.createdAt)}{r.consultation?.prescriberName ? ` by ${r.consultation.prescriberName}` : ""}</p>
                </div>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                  r.status === "delivered" ? "bg-emerald-100 text-emerald-800"
                  : r.status === "cancelled" ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
                }`}>{r.status.replace(/_/g, " ")}</span>
              </div>

              <div className="space-y-2 mb-4">
                {r.items.map(it => (
                  <div key={it.id} className="flex gap-3 items-center">
                    {it.imageUrl && <img src={it.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${it.productSlug}`} className="text-sm font-medium hover:text-primary line-clamp-1">{it.productName}</Link>
                      <p className="text-xs text-muted-foreground">Qty {it.quantity} · {formatGbp(it.unitPriceGbp)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {r.consultationId && (
                  <Button asChild variant="outline" className="rounded-full" data-testid={`button-rx-pdf-${r.orderId}`}>
                    <a href={pdfHref(r.consultationId)} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4 mr-1.5" /> Download PDF
                    </a>
                  </Button>
                )}
                {r.consultation?.conditionId && (
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90" data-testid={`button-rx-repeat-${r.orderId}`}>
                    <Link href={`/consult/${r.consultation.conditionId}?repeatOf=${r.consultationId}`}>
                      <RotateCcw className="w-4 h-4 mr-1.5" /> Request repeat
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost" className="rounded-full text-primary hover:bg-primary/5">
                  <Link href={`/order-confirmation/${r.orderId}`}>
                    View order <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 bg-white border border-emerald-100 rounded-2xl p-5 flex gap-3 items-start max-w-2xl">
        <FileText className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-secondary">Sharing your prescription</p>
          <p className="text-sm text-muted-foreground">
            Your prescription PDF is signed and dated by a GPhC-registered prescriber and accepted by any UK pharmacy that dispenses private scripts.
          </p>
        </div>
      </div>
    </AccountSubPage>
  );
}
