import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";

type Props = {
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string;
  unitPriceGbp: number;
  size?: "sm" | "lg";
  className?: string;
};

export default function WishlistButton(props: Props) {
  const { has, toggle } = useWishlist();
  const saved = has(props.productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle({
      productId: props.productId,
      slug: props.slug,
      name: props.name,
      brand: props.brand,
      imageUrl: props.imageUrl,
      unitPriceGbp: props.unitPriceGbp,
    });
    toast.success(added ? `Saved ${props.name} to wishlist` : `Removed ${props.name} from wishlist`);
  };

  const sizeClasses = props.size === "lg" ? "w-11 h-11" : "w-9 h-9";
  const iconSize = props.size === "lg" ? "w-5 h-5" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? `Remove ${props.name} from wishlist` : `Save ${props.name} to wishlist`}
      data-testid={`btn-wishlist-${props.slug}`}
      className={`${sizeClasses} rounded-full bg-white/95 backdrop-blur border border-border flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-sm ${
        props.className ?? ""
      }`}
    >
      <Heart className={`${iconSize} ${saved ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
    </button>
  );
}
