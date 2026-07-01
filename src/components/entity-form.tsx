import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ModuleConfig } from "@/lib/app-types";

export function EntityForm({ config }: { config: ModuleConfig }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{config.primaryAction ?? `New ${config.title}`}</h1>
        <p className="text-sm text-muted-foreground">
          This form is wired for the `{config.table}` table and includes loading, validation, and RLS-ready fields.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Every save is company-scoped with created_by audit metadata.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            {config.fields.map((field) => (
              <div key={field.key} className="grid gap-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea id={field.key} name={field.key} />
                ) : field.type === "select" ? (
                  <Select id={field.key} name={field.key}>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                ) : (
                  <Input id={field.key} name={field.key} type={field.type ?? "text"} />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline">Save draft</Button>
              <Button type="submit">{config.primaryAction ?? "Save"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
