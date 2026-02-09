import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem as CartItemType } from "@/types";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);
  const { product_id, product, quantity, price } = item;

  const closeDrawerAndNavigate = () => {
    setCartDrawerOpen(false);
  };

  return (
    <div className="flex gap-4 py-3 border-b border-border last:border-0">
      <Link
        to={`/item/${product_id}`}
        className="flex gap-4 flex-1 min-w-0 group"
        onClick={(e) => {
          e.stopPropagation();
          closeDrawerAndNavigate();
        }}
      >
        <div className="h-16 w-16 shrink-0 rounded-md bg-muted flex items-center justify-center text-xl font-heading font-bold text-muted-foreground overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            product.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-primary">{product.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {product.store_id != null ? (
              <>
                <Link
                  to={`/store/${product.store_id}`}
                  className="underline hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeDrawerAndNavigate();
                  }}
                >
                  {product.store_name}
                </Link>
                {product.seller_id != null && (
                  <>
                    {" · "}
                    <Link
                      to={`/seller/${product.seller_id}`}
                      className="underline hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDrawerAndNavigate();
                      }}
                    >
                      {product.seller_name ?? "Seller"}
                    </Link>
                  </>
                )}
              </>
            ) : (
              product.store_name
            )}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(product_id, quantity - 1)}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(product_id, quantity + 1)}
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(product_id)}
          aria-label="Remove from cart"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-right shrink-0 w-20">
        <p className="font-heading font-bold">${(parseFloat(price) * quantity).toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">${price} each</p>
      </div>
    </div>
  );
}
