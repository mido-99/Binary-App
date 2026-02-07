import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Store } from "lucide-react";

interface StoreCardProps {
  storeId: number;
  storeName: string;
}

export function StoreCard({ storeId, storeName }: StoreCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            <Store className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Store</p>
            <Link
              to={`/store/${storeId}`}
              className="font-medium hover:text-primary hover:underline"
            >
              {storeName}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
