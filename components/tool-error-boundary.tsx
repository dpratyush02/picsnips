"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State {
  error: Error | null;
}

export class ToolErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-8 text-center">
        <h3 className="text-lg font-semibold">The splitter hit a problem</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Reload the page and try the image again. If it is extremely large, export a smaller copy first.
        </p>
        <Button
          type="button"
          className="mt-5 rounded-full"
          onClick={() => window.location.reload()}
        >
          Reload
        </Button>
      </div>
    );
  }
}
