import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, ArrowLeft } from "lucide-react";

/**
 * Placeholder profile view for a user in the referral tree.
 * Links from the dashboard tree panel point here (/user/:id).
 * Add GET /api/users/:id/ and useQuery here to show full profile when available.
 */
export function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = id ? parseInt(id, 10) : NaN;

  if (!Number.isInteger(userId)) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Invalid user.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-1">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">User profile</h1>
              <p className="text-sm text-muted-foreground mt-0.5">User #{userId}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            This user is part of the referral tree. Full profile details can be added when a user profile API is available.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/dashboard">View tree</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
