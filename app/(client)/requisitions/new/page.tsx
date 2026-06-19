"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePR } from "@/features/pr/api";
import { ApiError } from "@/lib/api-client";
import { formatINR } from "@/lib/format";

const DEPARTMENTS = ["PROD", "PROC", "MAINT", "QA", "ADMIN", "PROJECTS"];
const CATEGORIES = ["Raw Materials", "Consumables", "Services", "Capex", "Chemicals", "Safety&PPE"];

interface LineForm {
  item_desc: string;
  hsn_code: string;
  uom: string;
  qty: string;
  est_rate: string;
}
interface FormValues {
  title: string;
  description: string;
  category: string;
  department: string;
  capex_opex: "opex" | "capex";
  cost_centre: string;
  required_by: string;
  justification: string;
  lines: LineForm[];
}

const today = new Date().toISOString().slice(0, 10);

export default function RaisePRPage() {
  const router = useRouter();
  const create = useCreatePR();

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      defaultValues: {
        title: "", description: "", category: "Raw Materials", department: "PROD",
        capex_opex: "opex", cost_centre: "", required_by: today, justification: "",
        lines: [{ item_desc: "", hsn_code: "", uom: "", qty: "", est_rate: "" }],
      },
    });
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const total = lines.reduce((s, l) => s + (Number(l.qty) || 0) * (Number(l.est_rate) || 0), 0);

  async function onSubmit(v: FormValues) {
    try {
      const res = await create.mutateAsync({
        title: v.title,
        description: v.description || undefined,
        category: v.category,
        department: v.department,
        capex_opex: v.capex_opex,
        cost_centre: v.cost_centre || undefined,
        required_by: v.required_by,
        justification: v.justification || undefined,
        lines: v.lines.map((l) => ({
          item_desc: l.item_desc,
          hsn_code: l.hsn_code || undefined,
          uom: l.uom,
          qty: l.qty,
          est_rate: l.est_rate,
        })),
      });
      const within = res.budget.within;
      toast.success(`Draft ${res.pr.code} created`, {
        description: within ? "Budget OK — review and submit." : `⚠ ${res.budget.reason ?? "Budget check"}`,
      });
      router.push(`/requisitions/${res.pr.code}`);
    } catch (err) {
      toast.error("Could not create PR", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <LinkButton href="/requisitions" variant="ghost" size="icon-sm" aria-label="Back">
          <ArrowLeft className="size-4" />
        </LinkButton>
        <h1 className="text-xl font-semibold">Raise Purchase Requisition</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Requisition Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" placeholder="What is required" {...register("title", { required: true })} />
              {errors.title && <p className="text-xs text-danger-foreground">Title is required</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={watch("department")} onValueChange={(v) => setValue("department", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Capex / Opex</Label>
                <Select value={watch("capex_opex")} onValueChange={(v) => setValue("capex_opex", v as "opex" | "capex")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opex">Opex</SelectItem>
                    <SelectItem value="capex">Capex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cost_centre">Cost Centre</Label>
                <Input id="cost_centre" placeholder="CC-PROD-01" {...register("cost_centre")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="required_by">Required By *</Label>
                <Input id="required_by" type="date" min={today} {...register("required_by", { required: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="justification">Justification</Label>
              <textarea id="justification" rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("justification")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Line Items</CardTitle>
            <div className="text-sm text-muted-foreground">
              Estimated total <span className="font-mono font-semibold text-foreground">{formatINR(total)}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-12 space-y-1 sm:col-span-4">
                  {i === 0 && <Label className="text-xs">Item</Label>}
                  <Input placeholder="Item description" {...register(`lines.${i}.item_desc`, { required: true })} />
                </div>
                <div className="col-span-3 space-y-1 sm:col-span-2">
                  {i === 0 && <Label className="text-xs">HSN</Label>}
                  <Input placeholder="7208" className="font-mono" {...register(`lines.${i}.hsn_code`)} />
                </div>
                <div className="col-span-3 space-y-1 sm:col-span-1">
                  {i === 0 && <Label className="text-xs">UOM</Label>}
                  <Input placeholder="MT" {...register(`lines.${i}.uom`, { required: true })} />
                </div>
                <div className="col-span-3 space-y-1 sm:col-span-2">
                  {i === 0 && <Label className="text-xs">Qty</Label>}
                  <Input type="number" step="any" placeholder="100" className="font-mono" {...register(`lines.${i}.qty`, { required: true })} />
                </div>
                <div className="col-span-3 space-y-1 sm:col-span-2">
                  {i === 0 && <Label className="text-xs">Est. Rate</Label>}
                  <Input type="number" step="any" placeholder="3000" className="font-mono" {...register(`lines.${i}.est_rate`, { required: true })} />
                </div>
                <div className="col-span-12 sm:col-span-1">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove line"
                    onClick={() => fields.length > 1 && remove(i)} disabled={fields.length === 1}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm"
              onClick={() => append({ item_desc: "", hsn_code: "", uom: "", qty: "", est_rate: "" })}>
              <Plus className="size-4" /> Add line
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <LinkButton href="/requisitions" variant="outline">Cancel</LinkButton>
          <Button type="submit" variant="navy" disabled={isSubmitting}>
            <Send className="size-4" /> {isSubmitting ? "Creating…" : "Create Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
