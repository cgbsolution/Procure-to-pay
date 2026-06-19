"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send, CheckCircle2, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSendInvite } from "@/features/onboarding/api";
import { ApiError } from "@/lib/api-client";
import type { InviteCreated } from "@/features/onboarding/types";

const schema = z.object({
  company_name: z.string().min(2, "Company name is required"),
  contact_email: z.string().email("Enter a valid email"),
  gstin: z.string().length(15, "GSTIN must be 15 characters").or(z.literal("")).optional(),
  category: z.string().optional(),
});
type Values = z.infer<typeof schema>;

export function SendInviteDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<InviteCreated | null>(null);
  const invite = useSendInvite();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { company_name: "", contact_email: "" } });

  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      setResult(null);
      reset();
    }
  }

  async function onSubmit(values: Values) {
    try {
      const res = await invite.mutateAsync({ ...values, gstin: values.gstin || undefined });
      setResult(res);
      toast.success("Invite sent", { description: `Application ${res.application_code} created.` });
    } catch (err) {
      toast.error("Could not send invite", {
        description: err instanceof ApiError ? err.message : "Please try again.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success-foreground">
                <CheckCircle2 className="size-5" /> Invite sent
              </DialogTitle>
              <DialogDescription>
                Application <span className="font-mono">{result.application_code}</span> created. The
                vendor receives a one-time link to upload documents (OCR auto-fills their profile).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setResult(null)}>
                Send another
              </Button>
              <Button variant="navy" onClick={() => close(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle>Send Vendor Invite</DialogTitle>
              <DialogDescription>
                A secure one-time link is emailed to the vendor to upload their documents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input id="company_name" placeholder="Legal entity name" {...register("company_name")} />
              {errors.company_name && <p className="text-xs text-danger-foreground">{errors.company_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input id="contact_email" type="email" placeholder="vendor@company.com" {...register("contact_email")} />
              {errors.contact_email && <p className="text-xs text-danger-foreground">{errors.contact_email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" placeholder="27XXXXX1234X1ZX" className="font-mono" {...register("gstin")} />
                {errors.gstin && <p className="text-xs text-danger-foreground">{errors.gstin.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="Raw Materials" {...register("category")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" variant="navy" disabled={isSubmitting}>
                <Send className="size-4" /> {isSubmitting ? "Sending…" : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
