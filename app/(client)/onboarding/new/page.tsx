"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle2, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSendInvite } from "@/features/onboarding/api";
import { ApiError } from "@/lib/api-client";
import type { InviteCreated } from "@/features/onboarding/types";

const schema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_email: z.string().email("Enter a valid email"),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).optional(),
  category: z.string().optional(),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export default function SendInvitePage() {
  const invite = useSendInvite();
  const [result, setResult] = React.useState<InviteCreated | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { company_name: "", contact_email: "" },
  });

  async function onSubmit(values: Values) {
    try {
      const payload = { ...values, gstin: values.gstin || undefined };
      const res = await invite.mutateAsync(payload);
      setResult(res);
      toast.success("Invite sent", { description: `Application ${res.application_code} created.` });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Please try again.";
      toast.error("Could not send invite", { description: msg });
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success-foreground">
              <CheckCircle2 className="size-5" /> Invite sent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              Application <span className="font-mono">{result.application_code}</span> created. The
              vendor receives a one-time secure link to upload documents (OCR auto-fills their
              profile).
            </p>
            <div className="space-y-1">
              <Label>One-time invite link (dev)</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={result.invite_link} className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy link"
                  onClick={() => {
                    navigator.clipboard?.writeText(result.invite_link);
                    toast.success("Link copied");
                  }}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <LinkButton href="/onboarding" variant="navy" size="sm">
                Back to applications
              </LinkButton>
              <Button variant="outline" size="sm" onClick={() => setResult(null)}>
                Send another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <LinkButton href="/onboarding" variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Back
        </LinkButton>
        <h1 className="text-xl font-semibold">Send Vendor Invite</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field id="company_name" label="Company Name *" error={errors.company_name?.message}>
              <Input id="company_name" placeholder="Legal entity name" {...register("company_name")} />
            </Field>
            <Field id="contact_email" label="Contact Email *" error={errors.contact_email?.message}>
              <Input
                id="contact_email"
                type="email"
                placeholder="vendor@company.com"
                {...register("contact_email")}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="gstin" label="GSTIN" error={errors.gstin?.message}>
                <Input id="gstin" placeholder="27XXXXX1234X1ZX" className="font-mono" {...register("gstin")} />
              </Field>
              <Field id="category" label="Category">
                <Input id="category" placeholder="Raw Materials" {...register("category")} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="contact_name" label="Contact Name">
                <Input id="contact_name" placeholder="Primary contact" {...register("contact_name")} />
              </Field>
              <Field id="phone" label="Mobile">
                <Input id="phone" placeholder="+91 XXXXX XXXXX" {...register("phone")} />
              </Field>
            </div>
            <Field id="notes" label="Internal Notes (not shown to vendor)">
              <textarea
                id="notes"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("notes")}
              />
            </Field>
            <Button type="submit" variant="navy" disabled={isSubmitting}>
              <Send className="size-4" /> {isSubmitting ? "Sending…" : "Send Invite Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-danger-foreground">{error}</p>}
    </div>
  );
}
