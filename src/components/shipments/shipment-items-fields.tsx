"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ShipmentItem } from "@/lib/shipments/types";

type ItemDraft = Partial<ShipmentItem> & { key: string };

export function ShipmentItemsFields({
  currency,
  items = [],
}: {
  currency: string;
  items?: ShipmentItem[];
}) {
  const initialItems = useMemo<ItemDraft[]>(
    () =>
      items.length
        ? items.map((item) => ({ ...item, key: item.id }))
        : [{ key: crypto.randomUUID(), currency, quantity: 1 }],
    [currency, items],
  );
  const [rows, setRows] = useState(initialItems);

  function addRow() {
    setRows((current) => [...current, { key: crypto.randomUUID(), currency, quantity: 1 }]);
  }

  function removeRow(key: string) {
    setRows((current) => (current.length === 1 ? current : current.filter((row) => row.key !== key)));
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="shipment_item_count" value={rows.length} />
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={row.key} className="grid gap-3 rounded-md border p-3 md:grid-cols-12">
            <input type="hidden" name={`shipment_item_id_${index}`} value={row.id ?? ""} />
            <Field label="Item name" className="md:col-span-4">
              <Input name={`shipment_item_name_${index}`} defaultValue={row.itemName ?? ""} required={index === 0} />
            </Field>
            <Field label="Quantity" className="md:col-span-2">
              <Input name={`shipment_item_quantity_${index}`} type="number" min="1" step="1" inputMode="numeric" defaultValue={row.quantity ?? 1} />
            </Field>
            <Field label="Weight KG" className="md:col-span-2">
              <Input name={`shipment_item_weight_kg_${index}`} type="number" min="0" step="0.01" inputMode="decimal" defaultValue={row.weightKg ?? ""} />
            </Field>
            <Field label="Volume CBM" className="md:col-span-2">
              <Input name={`shipment_item_volume_cbm_${index}`} type="number" min="0" step="0.001" inputMode="decimal" defaultValue={row.volumeCbm ?? ""} />
            </Field>
            <Field label="Value" className="md:col-span-2">
              <Input name={`shipment_item_declared_value_${index}`} type="number" min="0" step="0.01" inputMode="decimal" defaultValue={row.declaredValue ?? ""} />
            </Field>
            <Field label="Description" className="md:col-span-10">
              <Textarea name={`shipment_item_description_${index}`} defaultValue={row.description ?? ""} />
            </Field>
            <div className="flex items-end md:col-span-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => removeRow(row.key)} disabled={rows.length === 1} aria-label="Remove shipment item">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={addRow}>
        <Plus className="h-4 w-4" />
        Add item
      </Button>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}</div>;
}
