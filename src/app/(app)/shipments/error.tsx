"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShipmentsError({ reset }: { reset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Could not load shipments</CardTitle>
        <CardDescription>There was a problem loading shipment data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={reset}>Try again</Button>
      </CardContent>
    </Card>
  );
}
