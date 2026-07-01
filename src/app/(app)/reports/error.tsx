"use client";

import { Button } from "@/components/ui/button";

export default function ReportsError({ reset }: { reset: () => void }) {
  return <div className="rounded-md border p-6"><h2 className="font-semibold">Could not load reports.</h2><Button className="mt-4" onClick={reset}>Try again</Button></div>;
}
