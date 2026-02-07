import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface WishlistButtonProps {
  productId: number;
  variant?: "ghost" | "outline" | "link" | "default" | "secondary" | "destructive";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  ariaLabel?: string;
}

export function WishlistButton({
  productId,
  variant = "ghost",
  size = "default",
  className = "",
  ariaLabel,
}: WishlistButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: wishlistData } = useQuery<{ products: { id: number }[] }>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await api.get("/api/wishlist/");
      return data;
    },
    enabled: !!user,
  });
  const inWishlist = wishlistData?.products?.some((p) => p.id === productId) ?? false;
  const addMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/wishlist/${productId}/add/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
  const removeMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/wishlist/${productId}/remove/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });
  const pending = addMutation.isPending || removeMutation.isPending;

  if (!user) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) removeMutation.mutate();
    else addMutation.mutate();
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`shrink-0 ${inWishlist ? "text-destructive" : ""} ${className}`}
      aria-label={ariaLabel ?? (inWishlist ? "Remove from wishlist" : "Add to wishlist")}
      onClick={handleClick}
      disabled={pending}
    >
      <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
    </Button>
  );
}
