"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteShipment } from "@/app/(app)/shipments/actions";

export function DeleteShipmentButton({ shipmentId }: { shipmentId: string }) {
  return (
    <form
      action={deleteShipment}
      onSubmit={(event) => {
        if (!confirm("Delete this shipment? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="shipment_id" value={shipmentId} />
      <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </form>
  );
}
