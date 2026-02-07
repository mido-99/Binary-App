import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden />
          <h2 className="font-heading text-xl font-bold">Something went wrong</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            We couldn’t load this page. Try refreshing, or go back to the store.
          </p>
          <Button
            onClick={() => window.location.replace("/")}
            variant="outline"
          >
            Back to shop
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
