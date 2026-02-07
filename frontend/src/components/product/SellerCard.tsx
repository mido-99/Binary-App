import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

interface SellerCardProps {
  sellerId: number;
  sellerEmail: string;
}

export function SellerCard({ sellerId, sellerEmail }: SellerCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Seller</p>
            <Link
              to={`/seller/${sellerId}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {sellerEmail}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
