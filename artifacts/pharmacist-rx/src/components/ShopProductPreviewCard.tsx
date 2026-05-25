import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatShopGbp } from "@/lib/shopProducts";
import { ImageIcon, Minus, Plus, ShoppingBag } from "lucide-react";

type PreviewProps = {
  name: string;
  brand?: string | null;
  shortDescription: string;
  imageUrl: string;
  pricePence: number;
  packSize?: string | null;
  requiresConsultation?: boolean;
};

/** Patient-shop-style card preview (cream card, forest price). */
export function ShopProductPreviewCard({
  name,
  brand,
  shortDescription,
  imageUrl,
  pricePence,
  packSize,
  requiresConsultation = false,
}: PreviewProps) {
  return (
    <Card className="overflow-hidden border border-border bg-white shadow-sm max-w-[280px]">
      <div className="aspect-square bg-white overflow-hidden relative">
        {requiresConsultation ? (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground border-0 text-[10px]">
            Consultation
          </Badge>
        ) : null}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name || "Product preview"}
            className="w-full h-full object-contain p-3"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageIcon className="h-10 w-10 opacity-40" />
            <span className="text-xs">Upload packaging photo</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        {brand ? (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
            {brand}
          </p>
        ) : null}
        <h3 className="font-serif text-secondary font-semibold leading-snug line-clamp-2 text-sm">
          {name || "Product name"}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2.5rem]">
          {shortDescription || "Short description appears here."}
        </p>
        {packSize ? (
          <p className="text-[10px] text-muted-foreground mt-1">{packSize}</p>
        ) : null}
        <p className="text-xl font-bold text-primary mt-2 font-serif">
          {pricePence > 0 ? formatShopGbp(pricePence) : "£0.00"}
        </p>
        {requiresConsultation ? (
          <p className="text-xs text-amber-800 bg-amber-50 rounded-full px-2 py-1 mt-2 inline-block">
            Start consultation
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-full border border-primary/30 h-8 text-primary">
              <span className="px-2 opacity-40">
                <Minus className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold tabular-nums">0</span>
              <span className="px-2">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold py-2">
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to basket
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
