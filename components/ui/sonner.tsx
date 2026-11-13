"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "bg-popover text-popover-foreground border border-border shadow-2xl",
          title: "text-foreground",
          description: "text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
