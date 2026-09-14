import { useMemo } from "react";
import type { HtmlTemplateProps } from "../types";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Heart,
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { placeholderImage } from "../local-placeholder";

export function ProductCardTemplate({ time, width, height, values }: HtmlTemplateProps) {
  // 1. Controls
  const name = String(values.name ?? "Nike Air Force");
  const price = Number(values.price ?? 129.99);
  const originalPrice = Number(values.originalPrice ?? 169.99);
  const rating = Number(values.rating ?? 4.7);
  const reviewCount = Number(values.reviewCount ?? 325);
  const discount = Number(values.discount ?? 25);
  const freeShipping = values.freeShipping !== false;
  const isNew = values.isNew !== false;
  const isBestSeller = values.isBestSeller !== false;
  const showWishlisted = values.showWishlisted !== false;

  // Colors
  const color1 = String(values.color1 ?? "#1e293b");
  const color2 = String(values.color2 ?? "#f43f5e");
  const color3 = String(values.color3 ?? "#0ea5e9");
  const color4 = String(values.color4 ?? "#10b981");

  // Images
  const img1 = String(values.image1 ?? placeholderImage("matfitcrop"));
  const img2 = String(values.image2 ?? placeholderImage("matfitcrop"));
  const img3 = String(values.image3 ?? placeholderImage("matfitcrop"));

  const colors = useMemo(() => [color1, color2, color3, color4].filter(Boolean), [color1, color2, color3, color4]);
  const images = useMemo(() => [img1, img2, img3].filter(img => img && img.trim() !== ""), [img1, img2, img3]);
  const sizes = useMemo(() => {
    return String(values.sizes ?? "38,39,40,41,42,43")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  }, [values.sizes]);

  // 2. Scale factor based on canvas height (e.g. 1080p reference)
  const compositionHeight = 1080;
  const scaleFactor = Math.min(width, height) / compositionHeight;

  // 3. Playhead-driven deterministic animations
  // Image swap index
  const currentImageIndex = images.length > 0 ? Math.floor(time / 3) % images.length : 0;
  // Size selection index
  const selectedSizeIndex = sizes.length > 0 ? Math.floor(time / 1.5) % sizes.length : 0;
  const selectedSize = sizes[selectedSizeIndex] || null;
  // Color selection index
  const selectedColorIndex = colors.length > 0 ? Math.floor(time / 3.5) % colors.length : 0;
  const selectedColor = colors[selectedColorIndex] || null;

  // Add to Cart states cycle (8s loop)
  const loopTime = time % 8;
  const isAddingToCart = loopTime >= 3.5 && loopTime < 4.8;
  const isAddedToCart = loopTime >= 4.8 && loopTime < 6.8;

  // Pulse effect on badges
  const badgePulse = 1 + 0.05 * Math.sin(time * Math.PI * 2);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#0b0c10",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          transform: `scale(${scaleFactor * 2.1})`,
          transformOrigin: "center center"
        }}
      >
        <Card className="w-[320px] overflow-hidden bg-zinc-950 text-white shadow-2xl border-zinc-800 transition-all duration-300 rounded-xl">
          {/* Image carousel container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
            {images.length > 0 && (
              <img
                src={images[currentImageIndex]}
                alt={`${name} - View ${currentImageIndex + 1}`}
                className="object-cover w-full h-full"
                style={{
                  transition: "opacity 0.3s ease-in-out"
                }}
              />
            )}

            {/* Navigation arrows (indicator style) */}
            <div className="absolute inset-0 flex items-center justify-between p-2 opacity-60">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full bg-black/60 border border-zinc-800 hover:bg-black/80 text-white"
                disabled
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full bg-black/60 border border-zinc-800 hover:bg-black/80 text-white"
                disabled
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Image indicators dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? "bg-white w-4" : "bg-white/30 w-1.5"
                  }`}
                />
              ))}
            </div>

            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {isNew && (
                <Badge
                  className="bg-blue-600 border-none text-[10px] font-bold text-white shadow"
                  style={{ transform: `scale(${badgePulse})` }}
                >
                  NEW
                </Badge>
              )}
              {isBestSeller && (
                <Badge
                  className="bg-amber-600 border-none text-[10px] font-bold text-white shadow"
                  style={{ transform: `scale(${badgePulse})` }}
                >
                  BEST SELLER
                </Badge>
              )}
              {discount > 0 && (
                <Badge
                  className="bg-rose-600 border-none text-[10px] font-bold text-white shadow"
                  style={{ transform: `scale(${badgePulse})` }}
                >
                  -{discount}%
                </Badge>
              )}
            </div>

            {/* Wishlist button */}
            <Button
              variant="secondary"
              size="icon"
              className={`absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 border border-zinc-800 text-white hover:text-rose-500`}
            >
              <Heart
                className={`h-4 w-4 ${showWishlisted ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </Button>
          </div>

          {/* Content info */}
          <CardContent className="p-4 space-y-3.5">
            <div>
              <h3 className="font-semibold text-sm tracking-tight text-white line-clamp-1">{name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="ml-1 text-xs font-semibold text-zinc-300">{rating}</span>
                </div>
                <span className="text-[10px] text-zinc-500">
                  ({reviewCount} reviews)
                </span>
                {freeShipping && (
                  <span className="text-[10px] text-emerald-400 font-medium ml-auto">
                    Free Shipping
                  </span>
                )}
              </div>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">${price.toFixed(2)}</span>
              {originalPrice > price && (
                <span className="text-xs text-zinc-500 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Colors selection indicators */}
            <div className="space-y-3">
              {colors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Colors</div>
                  <div className="flex gap-1.5">
                    {colors.map((color) => (
                      <div
                        key={color}
                        className={`w-5 h-5 rounded-full border transition-all duration-300 ${
                          selectedColor === color
                            ? "border-white scale-110"
                            : "border-zinc-800"
                        }`}
                        style={{
                          backgroundColor: color,
                          padding: "2px"
                        }}
                      >
                        <div className="w-full h-full rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes selection indicators */}
              {sizes.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Sizes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((size) => (
                      <div
                        key={size}
                        className={`min-w-[32px] h-6 px-1.5 flex items-center justify-center rounded border text-[10px] font-bold transition-all duration-300 ${
                          selectedSize === size
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800"
                        }`}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          {/* Add to Cart button */}
          <CardFooter className="p-4 pt-0">
            <Button
              className={`w-full text-xs font-bold h-9 rounded-lg transition-all duration-300 ${
                isAddedToCart
                  ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
              disabled={isAddingToCart || isAddedToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Adding...
                </>
              ) : isAddedToCart ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                  Add to Cart
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
