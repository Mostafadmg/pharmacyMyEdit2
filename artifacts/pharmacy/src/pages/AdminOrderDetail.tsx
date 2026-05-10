import React, { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft, MapPin, User, Mail, Phone, Edit3, Save, X, Trash2,
  StickyNote, Plus, Minus, MessageSquare, AlertCircle, CreditCard,
} from "lucide-react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { formatGbp } from "@/hooks/useCart";
import { format } from "date-fns";

type Item = { id: string; productName: string; productSlug: string; imageUrl: string | null; unitPriceGbp: number; quantity: number; lineTotalGbp: number };
type InternalNote = { id: string; author: string; text: string; ts: string };
type Address = { line1: string; line2?: string; city: string; postcode: string; country?: string };
type Order = {
  id: string; orderNumber: string;
  customerName: string; customerEmail: string; customerPhone: string | null;
  shippingAddress: Address;
  itemsTotalGbp: number; shippingGbp: number; totalGbp: number;
  status: string; paymentStatus: string;
  notes: string | null;
  internalNotes: InternalNote[];
  createdAt: string;
};
type Delivery = {
  carrier: string; trackingNumber: string;
  trackingUrl: string | null;
  status: string;
  estimatedDelivery: string | null;
  events: Array<{ ts: string; status: string; message: string }>;
};

const CARRIER_PRESETS = ["PharmaCare Express", "Royal Mail", "DPD", "Evri"];

const ORDER_STATUSES = ["pending_payment", "paid", "preparing", "shipped", "delivered", "cancelled", "refunded"];
const DELIVERY_STAGES = ["preparing", "shipped", "out_for_delivery", "delivered"];

export default function AdminOrderDetail() {
  const [, params] = useRoute<{ id: string }>("/dashboard/orders/:id");
  const [data, setData] = useState<{ order: Order; items: Item[]; delivery: Delivery | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deliveryStage, setDeliveryStage] = useState("");
  const [deliveryMsg, setDeliveryMsg] = useState("");
  const [carrierDraft, setCarrierDraft] = useState("");
  const [trackingNumberDraft, setTrackingNumberDraft] = useState("");
  const [trackingUrlDraft, setTrackingUrlDraft] = useState("");

  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState<Address & { customerName: string; customerEmail: string; customerPhone: string }>({
    line1: "", line2: "", city: "", postcode: "", country: "United Kingdom",
    customerName: "", customerEmail: "", customerPhone: "",
  });

  const [editingCustomerNote, setEditingCustomerNote] = useState(false);
  const [customerNoteDraft, setCustomerNoteDraft] = useState("");

  const [newInternalNote, setNewInternalNote] = useState("");

  const [removeItemId, setRemoveItemId] = useState<string | null>(null);

  const load = () => {
    if (!params?.id) return;
    apiFetch<{ order: Order; items: Item[]; delivery: Delivery | null }>(`/api/orders/${params.id}`, { auth: "pharmacist" })
      .then(d => {
        setData(d);
        setDeliveryStage(d.delivery?.status ?? "");
        setCarrierDraft(d.delivery?.carrier ?? "");
        setTrackingNumberDraft(d.delivery?.trackingNumber ?? "");
        setTrackingUrlDraft(d.delivery?.trackingUrl ?? "");
        const a = d.order.shippingAddress ?? { line1: "", city: "", postcode: "" };
        setAddressDraft({
          line1: a.line1 ?? "",
          line2: a.line2 ?? "",
          city: a.city ?? "",
          postcode: a.postcode ?? "",
          country: a.country ?? "United Kingdom",
          customerName: d.order.customerName ?? "",
          customerEmail: d.order.customerEmail ?? "",
          customerPhone: d.order.customerPhone ?? "",
        });
        setCustomerNoteDraft(d.order.notes ?? "");
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [params?.id]);

  const updateOrderStatus = async (newStatus: string) => {
    if (!data) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/orders/${data.order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
        auth: "pharmacist",
      });
      toast.success("Order status updated");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const updateDelivery = async () => {
    if (!data || !deliveryStage) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        deliveryStatus: deliveryStage,
        deliveryMessage: deliveryMsg,
      };
      const orig = data.delivery;
      if (orig) {
        if (carrierDraft.trim() && carrierDraft !== orig.carrier) body.carrier = carrierDraft.trim();
        if (trackingNumberDraft.trim() && trackingNumberDraft !== orig.trackingNumber) body.trackingNumber = trackingNumberDraft.trim();
        if (trackingUrlDraft.trim() !== (orig.trackingUrl ?? "")) body.trackingUrl = trackingUrlDraft.trim();
      }
      await apiFetch(`/api/admin/orders/${data.order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
        auth: "pharmacist",
      });
      const becameShipped = deliveryStage === "shipped" && orig?.status !== "shipped";
      toast.success(becameShipped ? "Marked as dispatched — patient notified by email" : "Delivery updated");
      setDeliveryMsg("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const patchOrder = async (body: Record<string, unknown>, successMsg: string) => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ order: Order; items: Item[]; delivery: Delivery | null }>(
        `/api/admin/orders/${data.order.id}`,
        { method: "PATCH", body: JSON.stringify(body), auth: "pharmacist" }
      );
      setData({ order: res.order, items: res.items, delivery: res.delivery ?? data.delivery });
      toast.success(successMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    try {
      await patchOrder({
        shippingAddress: {
          line1: addressDraft.line1,
          line2: addressDraft.line2,
          city: addressDraft.city,
          postcode: addressDraft.postcode,
          country: addressDraft.country,
        },
        customerName: addressDraft.customerName,
        customerEmail: addressDraft.customerEmail,
        customerPhone: addressDraft.customerPhone || null,
      }, "Customer & address saved");
      setEditingAddress(false);
    } catch { /* handled */ }
  };

  const saveCustomerNote = async () => {
    try {
      await patchOrder({ notes: customerNoteDraft }, "Customer note saved");
      setEditingCustomerNote(false);
    } catch { /* handled */ }
  };

  const changeItemQty = async (item: Item, delta: number) => {
    const newQty = Math.max(1, Math.min(20, item.quantity + delta));
    if (newQty === item.quantity) return;
    await patchOrder({ items: [{ id: item.id, quantity: newQty }] }, "Quantity updated");
  };

  const removeItem = async () => {
    if (!removeItemId) return;
    try {
      await patchOrder({ removeItemIds: [removeItemId] }, "Item removed");
    } catch { /* handled */ }
    setRemoveItemId(null);
  };

  const addInternalNote = async () => {
    const text = newInternalNote.trim();
    if (!text) return;
    try {
      await patchOrder({
        addInternalNote: { author: "Pharmacist", text },
      }, "Internal note added");
      setNewInternalNote("");
    } catch { /* handled */ }
  };

  const paymentBadge = (order: Order) => {
    if (order.paymentStatus === "paid") return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CreditCard className="w-3 h-3 mr-1" /> Paid (Stripe)</Badge>;
    if (order.paymentStatus === "paid_demo") return <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">Demo paid</Badge>;
    if (order.paymentStatus === "pending") return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Awaiting payment</Badge>;
    if (order.paymentStatus === "refunded") return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Refunded</Badge>;
    return <Badge variant="outline" className="capitalize">{order.paymentStatus}</Badge>;
  };

  return (
    <PharmacistLayout current="orders">
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>

        {loading ? (
          <div className="space-y-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>
        ) : !data ? (
          <Card><CardContent className="p-8 text-center">Order not found</CardContent></Card>
        ) : (
          <div className="grid lg:grid-cols-[1fr,320px] gap-6">
            <div className="space-y-6 min-w-0">
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold">{data.order.orderNumber}</h1>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Placed {new Date(data.order.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="capitalize">{data.order.status.replace(/_/g, " ")}</Badge>
                      {paymentBadge(data.order)}
                    </div>
                  </div>

                  <div className="space-y-3" data-testid="order-items-list">
                    {data.items.map(i => (
                      <div key={i.id} className="flex gap-3 items-center pb-3 border-b last:border-0 last:pb-0">
                        {i.imageUrl && <img src={i.imageUrl} alt={i.productName} className="w-14 h-14 rounded-lg object-cover bg-muted flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base">{i.productName}</p>
                          <p className="text-xs text-muted-foreground">Unit {formatGbp(i.unitPriceGbp)}</p>
                          <div className="inline-flex items-center mt-1.5 border rounded-full">
                            <button
                              onClick={() => changeItemQty(i, -1)}
                              disabled={saving || i.quantity <= 1}
                              className="px-2 py-1 hover:bg-muted disabled:opacity-30 rounded-l-full"
                              data-testid={`btn-qty-down-${i.productSlug}`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-sm font-semibold tabular-nums" data-testid={`qty-${i.productSlug}`}>{i.quantity}</span>
                            <button
                              onClick={() => changeItemQty(i, +1)}
                              disabled={saving || i.quantity >= 20}
                              className="px-2 py-1 hover:bg-muted disabled:opacity-30 rounded-r-full"
                              data-testid={`btn-qty-up-${i.productSlug}`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold whitespace-nowrap">{formatGbp(i.lineTotalGbp)}</p>
                          <button
                            onClick={() => setRemoveItemId(i.id)}
                            disabled={saving || data.items.length <= 1}
                            className="text-xs text-red-600 hover:underline disabled:opacity-30 inline-flex items-center gap-1 mt-1"
                            data-testid={`btn-remove-${i.productSlug}`}
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatGbp(data.order.itemsTotalGbp)}</span></div>
                    <div className="flex justify-between"><span>Delivery</span><span>{data.order.shippingGbp === 0 ? "Free" : formatGbp(data.order.shippingGbp)}</span></div>
                    <div className="flex justify-between font-bold pt-2 text-lg"><span>Total</span><span className="text-primary">{formatGbp(data.order.totalGbp)}</span></div>
                  </div>

                  <div className="mt-4 p-3 bg-muted/40 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer note</p>
                      {!editingCustomerNote && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingCustomerNote(true)} className="h-7 text-xs" data-testid="btn-edit-customer-note">
                          <Edit3 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      )}
                    </div>
                    {editingCustomerNote ? (
                      <div className="space-y-2">
                        <Textarea
                          value={customerNoteDraft}
                          onChange={e => setCustomerNoteDraft(e.target.value)}
                          rows={3}
                          placeholder="No note from customer"
                          data-testid="textarea-customer-note"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingCustomerNote(false); setCustomerNoteDraft(data.order.notes ?? ""); }}>Cancel</Button>
                          <Button size="sm" onClick={saveCustomerNote} disabled={saving} data-testid="btn-save-customer-note">
                            <Save className="w-3 h-3 mr-1" /> Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{data.order.notes || <span className="text-muted-foreground italic">No note</span>}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Internal notes thread */}
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="font-semibold mb-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" /> Internal notes
                    <Badge variant="outline" className="ml-auto">{data.order.internalNotes?.length ?? 0}</Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    Pharmacy team only. Not visible to the customer.
                  </p>

                  <div className="space-y-2 mb-4">
                    <Textarea
                      value={newInternalNote}
                      onChange={e => setNewInternalNote(e.target.value)}
                      placeholder="Add an internal note about this order…"
                      rows={2}
                      data-testid="textarea-internal-note"
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={addInternalNote} disabled={saving || !newInternalNote.trim()} data-testid="btn-add-internal-note">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add note
                      </Button>
                    </div>
                  </div>

                  {(data.order.internalNotes?.length ?? 0) === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-xl">
                      No internal notes yet.
                    </div>
                  ) : (
                    <ul className="space-y-2" data-testid="list-internal-notes">
                      {[...(data.order.internalNotes ?? [])].reverse().map(n => (
                        <li key={n.id} className="rounded-lg border bg-white p-3">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-sm font-semibold">{n.author}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(n.ts), "PPp")}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{n.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {data.delivery && (
                <Card>
                  <CardContent className="p-5 sm:p-6">
                    <h2 className="font-semibold mb-1">Delivery management</h2>
                    <p className="text-xs text-muted-foreground mb-4">
                      Update carrier &amp; tracking before marking dispatched — the patient is auto-emailed a tracking link when stage changes to <strong>shipped</strong>.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="text-xs">Carrier</Label>
                        <Select value={carrierDraft} onValueChange={setCarrierDraft}>
                          <SelectTrigger data-testid="select-carrier"><SelectValue placeholder="Choose carrier" /></SelectTrigger>
                          <SelectContent>
                            {CARRIER_PRESETS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tracking number</Label>
                        <Input
                          value={trackingNumberDraft}
                          onChange={e => setTrackingNumberDraft(e.target.value)}
                          className="h-9 font-mono"
                          data-testid="input-tracking-number"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <Label className="text-xs">Tracking URL <span className="text-muted-foreground font-normal">(optional — auto-derived from carrier if blank)</span></Label>
                      <Input
                        value={trackingUrlDraft}
                        onChange={e => setTrackingUrlDraft(e.target.value)}
                        placeholder="https://..."
                        className="h-9 text-xs"
                        data-testid="input-tracking-url"
                      />
                    </div>

                    <div className="grid sm:grid-cols-[1fr,auto] gap-3 mb-4">
                      <Select value={deliveryStage} onValueChange={setDeliveryStage}>
                        <SelectTrigger data-testid="select-delivery-stage"><SelectValue placeholder="Set stage" /></SelectTrigger>
                        <SelectContent>
                          {DELIVERY_STAGES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button onClick={updateDelivery} disabled={saving || !deliveryStage} data-testid="btn-update-delivery">Update tracking</Button>
                    </div>
                    <Textarea placeholder="Optional note for the customer..." value={deliveryMsg} onChange={e => setDeliveryMsg(e.target.value)} rows={2} className="mb-4" />

                    <div className="space-y-2 max-h-60 overflow-auto pr-2">
                      {data.delivery.events.slice().reverse().map((e, i) => (
                        <div key={i} className="text-sm flex gap-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                            {new Date(e.ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <div>
                            <p className="font-medium capitalize">{e.status.replace(/_/g, " ")}</p>
                            <p className="text-muted-foreground text-xs">{e.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right rail — NOT sticky, stacks naturally on mobile */}
            <div className="space-y-4 min-w-0">
              <Card>
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Order status</p>
                    <Select value={data.order.status} onValueChange={updateOrderStatus} disabled={saving}>
                      <SelectTrigger data-testid="select-order-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Customer & address</h3>
                    {!editingAddress && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingAddress(true)} className="h-7 text-xs" data-testid="btn-edit-address">
                        <Edit3 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                  {editingAddress ? (
                    <div className="space-y-2">
                      <div><Label className="text-xs">Name</Label><Input value={addressDraft.customerName} onChange={e => setAddressDraft({ ...addressDraft, customerName: e.target.value })} className="h-8" data-testid="input-edit-name" /></div>
                      <div><Label className="text-xs">Email</Label><Input type="email" value={addressDraft.customerEmail} onChange={e => setAddressDraft({ ...addressDraft, customerEmail: e.target.value })} className="h-8" data-testid="input-edit-email" /></div>
                      <div><Label className="text-xs">Phone</Label><Input type="tel" value={addressDraft.customerPhone} onChange={e => setAddressDraft({ ...addressDraft, customerPhone: e.target.value })} className="h-8" /></div>
                      <div><Label className="text-xs">Address line 1</Label><Input value={addressDraft.line1} onChange={e => setAddressDraft({ ...addressDraft, line1: e.target.value })} className="h-8" data-testid="input-edit-line1" /></div>
                      <div><Label className="text-xs">Address line 2</Label><Input value={addressDraft.line2 ?? ""} onChange={e => setAddressDraft({ ...addressDraft, line2: e.target.value })} className="h-8" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">City</Label><Input value={addressDraft.city} onChange={e => setAddressDraft({ ...addressDraft, city: e.target.value })} className="h-8" data-testid="input-edit-city" /></div>
                        <div><Label className="text-xs">Postcode</Label><Input value={addressDraft.postcode} onChange={e => setAddressDraft({ ...addressDraft, postcode: e.target.value })} className="h-8" data-testid="input-edit-postcode" /></div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button size="sm" variant="ghost" onClick={() => { setEditingAddress(false); load(); }} disabled={saving}><X className="w-3 h-3 mr-1" /> Cancel</Button>
                        <Button size="sm" onClick={saveAddress} disabled={saving} data-testid="btn-save-address">
                          <Save className="w-3 h-3 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm space-y-1">
                        <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-muted-foreground" /> {data.order.customerName}</p>
                        <a href={`mailto:${data.order.customerEmail}`} className="flex items-center gap-2 text-primary hover:underline break-all">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{data.order.customerEmail}</span>
                        </a>
                        {data.order.customerPhone && (
                          <a href={`tel:${data.order.customerPhone}`} className="flex items-center gap-2 text-primary hover:underline">
                            <Phone className="w-3.5 h-3.5" /> {data.order.customerPhone}
                          </a>
                        )}
                      </div>
                      <div className="border-t pt-3">
                        <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm"><MapPin className="w-4 h-4" /> Delivery address</h3>
                        <p className="text-sm leading-relaxed">
                          {data.order.shippingAddress.line1}<br />
                          {data.order.shippingAddress.line2 && <>{data.order.shippingAddress.line2}<br /></>}
                          {data.order.shippingAddress.city}<br />
                          <strong>{data.order.shippingAddress.postcode}</strong><br />
                          {data.order.shippingAddress.country ?? "United Kingdom"}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!removeItemId} onOpenChange={open => { if (!open) setRemoveItemId(null); }}>
        <AlertDialogContent data-testid="dialog-remove-item">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this item from the order?</AlertDialogTitle>
            <AlertDialogDescription>
              The item will be removed and the order total will be recalculated. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={removeItem} className="bg-red-600 hover:bg-red-700" data-testid="btn-confirm-remove">
              <Trash2 className="w-4 h-4 mr-1" /> Remove item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PharmacistLayout>
  );
}
