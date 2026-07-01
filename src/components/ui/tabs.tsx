"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
}: {
  tabs: { value: string; label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = React.useState(tabs[0]?.value);
  const current = tabs.find((tab) => tab.value === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActive(tab.value)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
              active === tab.value && "bg-background text-foreground shadow-sm",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
