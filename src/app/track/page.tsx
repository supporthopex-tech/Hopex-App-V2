import { PackageSearch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TrackingLookupPage() {
  async function lookup(formData: FormData) {
    "use server";
    const trackingNumber = String(formData.get("tracking_number") ?? "").trim();
    if (!trackingNumber) return;
    const { redirect } = await import("next/navigation");
    redirect(`/track/${encodeURIComponent(trackingNumber)}`);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PackageSearch className="h-5 w-5" />
          </div>
          <CardTitle>Track shipment</CardTitle>
          <CardDescription>Enter your tracking number to view current cargo status, route, ETA, and delivery confirmation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={lookup} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input name="tracking_number" placeholder="Tracking number" required />
            <Button>Track</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
