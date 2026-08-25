"use client";

import { Button, Input, useToast } from "@dashboard/ui";
import { format } from "date-fns";
import { CheckCircle2, Heart, MessageSquare, Star, X, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAddToCart, useCart } from "@/api/cart";
import { useProduct } from "@/api/products";
import { useProductReviews, useReviewEligibility, useSubmitReview } from "@/api/reviews";
import { useAddToWishlist, useWishlist } from "@/api/wishlist";
import { getImageUrl } from "@/lib/image-utils";
import { sanitizeErrorMessage } from "@/lib/toast-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useBuyNowStore } from "@/store/useBuyNowStore";
import { useCartUIStore } from "@/store/useCartUIStore";

export default function ProductDetailsPage() {
  const { slug } = useParams() as { slug: string };
  const { data, isLoading } = useProduct(slug);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [titleInput, setTitleInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imagesList, setImagesList] = useState<string[]>([]);

  const [customization, setCustomization] = useState("");
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const { data: wishlistData } = useWishlist();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const router = useRouter();
  const { data: cartData } = useCart();
  const { openCart, closeCart, setNewlyAddedVariantId } = useCartUIStore();
  const setBuyNowItem = useBuyNowStore((state) => state.setItem);

  const product = data?.product;
  const productId = product?.id;

  // Reviews Data
  const { data: reviewsData, isLoading: isReviewsLoading, isError: isReviewsError, refetch: refetchReviews } = useProductReviews(productId);
  const { data: eligibilityData } = useReviewEligibility(productId, !!user);
  const submitReview = useSubmitReview();

  useEffect(() => {
    if (eligibilityData?.existingReview) {
      const rev = eligibilityData.existingReview;
      setRatingInput(rev.rating || 5);
      setTitleInput(rev.title || "");
      setCommentInput(rev.body || "");
      setImagesList(rev.images || []);
    }
  }, [eligibilityData]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-[4/5] animate-pulse bg-muted rounded-2xl w-full" />
          <div className="flex flex-col gap-6 pt-8">
            <div className="h-10 w-3/4 animate-pulse rounded-md bg-muted" />
            <div className="h-6 w-1/4 animate-pulse rounded-md bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif text-text-primary mb-4">Creation Not Found</h1>
          <p className="text-text-secondary font-light mb-8">We couldn't find the cute creation you're looking for.</p>
          <Link href="/products">
            <Button size="lg" className="rounded-full px-8">Return to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0
    ? product.images.map((img: any) => getImageUrl(typeof img === "string" ? img : img?.url))
    : [];

  const variants = product.variants || [];
  const selectedVariant = variants[selectedVariantIndex] || variants[0];

  const handleAddToCart = () => {
    const activeVariant = selectedVariant || variants[0];
    if (!activeVariant) {
      addToast({
        title: "No variant available",
        description: "Please select an available product option to continue.",
        type: "warning",
      });
      return;
    }

    const isItemInCart = cartData?.cart?.items?.some((item: any) => item.variantId === activeVariant.id);

    addToCart.mutate(
      { variantId: activeVariant.id, quantity, customization: customization.trim() || undefined },
      {
        onSuccess: () => {
          setNewlyAddedVariantId(activeVariant.id);
          openCart();
          setTimeout(() => {
            closeCart();
            setNewlyAddedVariantId(null);
          }, 2500);

          addToast({
            title: isItemInCart ? "Cart updated" : "Added to cart",
            type: "success",
            action: {
              label: "View Cart",
              onClick: () => router.push("/cart"),
            }
          });
        },
        onError: (error: any) => {
          addToast({
            title: "Failed to add to cart",
            description: sanitizeErrorMessage(error, "Could not add item to cart. Please try again."),
            type: "error",
          });
        },
      }
    );
  };

  const handleBuyNow = async () => {
    if (isBuyingNow) return;
    const activeVariant = selectedVariant || variants[0];
    if (!activeVariant) {
      addToast({
        title: "No variant available",
        description: "Please select an available product option to continue.",
        type: "warning",
      });
      return;
    }

    if (!user) {
      addToast({
        title: "Sign in required",
        description: "Please sign in or create an account to proceed to checkout.",
        type: "info",
      });
      router.push(`/auth/login?redirect=/checkout?buyNow=true`);
      return;
    }

    setIsBuyingNow(true);
    try {
      setBuyNowItem({
        variantId: activeVariant.id,
        quantity,
        customization: customization.trim() || undefined,
        productSnapshot: {
          name: product.name,
          slug: product.slug,
          image: images[0],
        },
        variantSnapshot: {
          title: activeVariant.title || activeVariant.name,
          price: activeVariant.price || product.basePrice,
        }
      });
      router.push("/checkout?buyNow=true");
    } catch (error: any) {
      addToast({
        title: "Unable to start checkout",
        description: sanitizeErrorMessage(error, "Could not start checkout. Please try again."),
        type: "error",
      });
    } finally {
      setIsBuyingNow(false);
    }
  };

  const isAlreadyInWishlist = wishlistData?.items?.some((item: any) => item.productId === product.id);

  const handleAddToWishlist = () => {
    if (!user) {
      addToast({
        title: "Sign in required",
        description: "Please sign in to save items to your wishlist.",
        type: "info",
      });
      return;
    }

    if (isAlreadyInWishlist) {
      addToast({
        title: "Already in Wishlist",
        type: "info",
      });
      return;
    }

    addToWishlist.mutate(
      { productId: product.id },
      {
        onSuccess: () => {
          addToast({
            title: "Added to Wishlist ❤️",
            type: "success",
          });
        },
        onError: (error: any) => {
          addToast({
            title: "Failed to add to wishlist",
            description: sanitizeErrorMessage(error, "Could not add item to wishlist. Please try again."),
            type: "error",
          });
        },
      }
    );
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImagesList((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    submitReview.mutate(
      {
        productId,
        rating: ratingInput,
        title: titleInput,
        body: commentInput,
        images: imagesList,
      },
      {
        onSuccess: () => {
          addToast({
            title: "Review Submitted! ✨",
            description: "Thank you for your feedback! It will appear after approval.",
            type: "success",
          });
          setIsReviewModalOpen(false);
        },
        onError: (err: any) => {
          addToast({
            title: "Could not submit review",
            description: sanitizeErrorMessage(err, "Failed to submit review. Please try again."),
            type: "error",
          });
        },
      }
    );
  };

  const reviewsList = reviewsData?.reviews || [];
  const stats = reviewsData?.stats || { averageRating: 0, reviewCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <div
              onClick={() => images[selectedImage] && setIsLightboxOpen(true)}
              className="aspect-[4/5] max-h-[640px] w-full overflow-hidden rounded-2xl bg-surface/60 border border-border/60 relative group cursor-zoom-in flex items-center justify-center p-2 sm:p-4 shadow-xs hover:border-accent/40 transition-all"
            >
              {images[selectedImage] ? (
                <>
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    priority={selectedImage === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-full w-full object-contain p-2 sm:p-4 transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-md text-text-primary opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-background"
                    aria-label="Enlarge image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-text-secondary font-serif text-xl">
                  {product.name}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-20 sm:w-24 aspect-[4/5] overflow-hidden rounded-xl transition-all relative bg-surface/50 border border-border ${selectedImage === i ? 'ring-2 ring-accent ring-offset-2 border-transparent' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <Image src={img} alt={`Thumbnail ${i}`} fill sizes="96px" className="h-full w-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col pt-4 lg:pt-10 relative">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-4xl lg:text-5xl font-serif text-text-primary leading-tight">
                {product.name}
              </h1>
              <button
                onClick={handleAddToWishlist}
                disabled={addToWishlist.isPending}
                className="text-text-secondary hover:text-accent transition-colors p-2"
                aria-label="Add to Wishlist"
              >
                <Heart className={`w-8 h-8 ${addToWishlist.isPending ? 'opacity-50' : ''}`} />
              </button>
            </div>

            {/* Average Rating Banner */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-5 w-5 ${idx < Math.round(stats.averageRating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {stats.averageRating > 0 ? stats.averageRating : "No reviews yet"}
              </span>
              <a href="#reviews-section" className="text-xs text-text-secondary hover:text-accent underline font-light">
                ({stats.reviewCount} {stats.reviewCount === 1 ? "review" : "reviews"})
              </a>
            </div>


            <div className="text-2xl font-light text-text-primary mb-8">
              ₹{selectedVariant?.price ?? product.basePrice}
            </div>

            <div className="text-text-secondary font-light leading-relaxed mb-10 text-lg">
              <p>{product.description || "A beautiful handcrafted creation made with love."}</p>
            </div>

            {/* Variant Selector */}
            {variants.length > 1 && (
              <div className="mb-10">
                <span className="text-sm tracking-widest uppercase text-text-secondary block mb-3">Variant</span>
                <div className="flex flex-wrap gap-3">
                  {variants.map((variant: any, i: number) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantIndex(i)}
                      className={`px-5 py-2.5 rounded-md border text-sm font-medium transition-all ${selectedVariantIndex === i
                        ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                        : "border-border text-text-secondary hover:border-accent/50 hover:text-text-primary"
                        }`}
                    >
                      {variant.title || variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customization Instructions (Optional) */}
            <div className="mb-8 space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="customization-instructions" className="text-sm font-medium text-text-primary flex items-center gap-1.5">
                  Customization Instructions <span className="text-xs font-normal text-text-secondary">(Optional)</span>
                </label>
                <span className={`text-xs ${customization.length > 500 ? "text-rose-500 font-semibold" : "text-text-secondary font-light"}`}>
                  {customization.length}/500
                </span>
              </div>
              <textarea
                id="customization-instructions"
                rows={3}
                maxLength={500}
                placeholder="Leave notes for color, size, gift message, packaging request, or special instructions..."
                value={customization}
                onChange={(e) => setCustomization(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-y min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-6 mb-10">
              <span className="text-sm tracking-widest uppercase text-text-secondary">Quantity</span>
              <div className="inline-flex items-center rounded-md border border-border bg-surface overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-muted transition-colors text-text-secondary"
                >-</button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 hover:bg-muted transition-colors text-text-secondary"
                >+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-fit shadow-sm hover:shadow-md transition-all min-w-[160px]"
                onClick={handleAddToCart}
                loading={addToCart.isPending}
                loadingText="Adding to cart…"
                disabled={addToCart.isPending || isBuyingNow || !selectedVariant}
              >
                Add to Cart
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-fit shadow-md hover:shadow-lg transition-all min-w-[160px]"
                onClick={handleBuyNow}
                loading={isBuyingNow}
                loadingText="Buying now…"
                disabled={isBuyingNow || addToCart.isPending || (!selectedVariant && variants.length === 0)}
              >
                Buy Now
              </Button>
            </div>

            {/* Handcrafted Note */}
            <div className="rounded-2xl bg-surface border border-border p-8">
              <h3 className="font-serif text-xl mb-3 flex items-center gap-2">
                Handmade with Love <span className="text-accent">✨</span>
              </h3>
              <p className="text-text-secondary font-light leading-relaxed">
                Every piece at Curio Wrap is individually crafted by hand. Minor variations may occur, making your item truly one-of-a-kind.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews-section" className="border-t border-border bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
            <div>
              <h2 className="text-3xl font-serif text-text-primary">Customer Reviews</h2>
              <p className="text-sm text-text-secondary font-light mt-1">
                Real feedback from verified buyers who own this creation.
              </p>
            </div>

            {/* Write / Edit Review Button */}
            {user ? (
              eligibilityData?.canReview ? (
                <Button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="rounded-full px-6 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {eligibilityData?.existingReview ? "Edit Your Review" : "Write a Review"}
                </Button>
              ) : (
                <div className="text-xs text-text-secondary bg-surface border border-border px-4 py-3 rounded-xl font-light">
                  🔒 Only verified buyers of delivered orders can write a review.
                </div>
              )
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" className="rounded-full px-6">
                  Sign in to Review
                </Button>
              </Link>
            )}
          </div>

          {/* Rating Summary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-surface border border-border rounded-2xl p-8">
            <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-8 text-center">
              <span className="text-5xl font-serif text-text-primary font-bold">{stats.averageRating}</span>
              <div className="flex items-center gap-1 text-amber-500 my-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`h-5 w-5 ${idx < Math.round(stats.averageRating) ? "fill-amber-400 text-amber-400" : "text-border"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-secondary font-light">Based on {stats.reviewCount} verified {stats.reviewCount === 1 ? "review" : "reviews"}</span>
            </div>

            {/* Distribution Bars */}
            <div className="col-span-2 space-y-2 flex flex-col justify-center">
              {[5, 4, 3, 2, 1].map((starVal) => {
                const count = stats.distribution?.[starVal] || 0;
                const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;
                return (
                  <div key={starVal} className="flex items-center gap-4 text-xs">
                    <span className="w-12 text-text-secondary font-medium flex items-center gap-1">
                      {starVal} <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-8 text-right text-text-secondary font-light">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews List */}
          {isReviewsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : isReviewsError ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/50 p-8 space-y-3">
              <MessageSquare className="h-8 w-8 text-rose-500/60 mx-auto" />
              <h3 className="font-serif text-lg text-text-primary">Unable to load reviews</h3>
              <p className="text-sm text-text-secondary font-light">There was a problem retrieving customer reviews.</p>
              <Button variant="outline" size="sm" onClick={() => refetchReviews()} className="rounded-full mt-2">
                Retry
              </Button>
            </div>
          ) : reviewsList.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-dashed border-border p-8">
              <MessageSquare className="h-8 w-8 text-text-secondary/40 mx-auto mb-3" />
              <h3 className="font-serif text-lg text-text-primary mb-1">No Approved Reviews Yet</h3>
              <p className="text-sm text-text-secondary font-light">Be the first verified customer to share your thoughts on this creation!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviewsList.map((rev: any) => (
                <div key={rev.id} className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-serif text-accent font-semibold">
                        {rev.user?.firstName?.[0]?.toUpperCase() || "C"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary text-sm">
                            {rev.user?.firstName} {rev.user?.lastName ? `${rev.user.lastName[0]}.` : ""}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Purchase
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary font-light">
                          {format(new Date(rev.createdAt), "MMMM dd, yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-4 w-4 ${idx < rev.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.title && (
                    <h4 className="font-semibold text-text-primary text-base">{rev.title}</h4>
                  )}

                  {rev.body && (
                    <p className="text-sm text-text-secondary font-light leading-relaxed">{rev.body}</p>
                  )}

                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto pt-2">
                      {rev.images.map((imgUrl: string, imgIdx: number) => (
                        <a key={imgIdx} href={imgUrl} target="_blank" rel="noreferrer" className="shrink-0 relative h-20 w-20 block">
                          <Image
                            src={imgUrl}
                            alt="Review Image"
                            fill
                            sizes="80px"
                            className="rounded-xl object-cover border border-border hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Specifications Section */}
      <div className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h3 className="font-serif text-2xl mb-6">Shipping & Delivery</h3>
              <p className="text-text-secondary font-light leading-relaxed mb-6">
                We ship nationwide. Each item is carefully wrapped in our signature pink packaging to ensure it arrives safely at your doorstep.
              </p>
              <ul className="space-y-3 text-text-secondary font-light list-disc pl-5">
                <li>Standard Shipping: 3-5 business days</li>
                <li>Express Shipping: 1-2 business days</li>
                <li>Free shipping on orders over ₹999</li>
              </ul>
            </div>
            <div>
              <h3 className="font-serif text-2xl mb-6">Specifications</h3>
              <ul className="space-y-4">
                <li className="flex justify-between border-b border-border pb-4">
                  <span className="text-text-secondary font-light">Material</span>
                  <span className="font-medium">Premium Chenille Stems (Pipe Cleaners)</span>
                </li>
                <li className="flex justify-between border-b border-border pb-4">
                  <span className="text-text-secondary font-light">Brand</span>
                  <span className="font-medium">{product.brand?.name || "Curio Wrap"}</span>
                </li>
                <li className="flex justify-between border-b border-border pb-4">
                  <span className="text-text-secondary font-light">Category</span>
                  <span className="font-medium">{product.category?.name || "Handcrafted"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="font-serif text-xl text-text-primary">
                {eligibilityData?.existingReview ? "Edit Your Review" : "Write a Product Review"}
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              {/* Star Rating Input */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Overall Rating (1 - 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${star <= (hoverRating || ratingInput)
                          ? "fill-amber-400 text-amber-400"
                          : "text-border"
                          }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-text-primary">
                    {hoverRating || ratingInput} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Review Headline / Title
                </label>
                <Input
                  placeholder="e.g. Absolutely stunning handcrafted quality!"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Comment Textarea */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Your Detailed Review
                </label>
                <textarea
                  rows={4}
                  placeholder="Share details about the packaging, quality, colors, and experience..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {/* Optional Images */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block">
                  Add Review Images (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleAddImageUrl}>
                    Add URL
                  </Button>
                </div>

                {imagesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {imagesList.map((img, idx) => (
                      <div key={idx} className="relative group h-16 w-16">
                        <Image
                          src={img}
                          alt="Review attachment"
                          fill
                          sizes="64px"
                          className="rounded-lg object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow hover:bg-red-600 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={submitReview.isPending}
                  disabled={submitReview.isPending}
                  className="px-6 rounded-full"
                >
                  Submit Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && images[selectedImage] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
            aria-label="Close fullscreen view"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                }}
                className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="object-contain p-2 select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

