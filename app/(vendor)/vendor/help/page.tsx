"use client";

import { Card, CardContent } from "@/components/ui/card";

const FAQS = [
  ["How do I submit an invoice?", "Go to Purchase Orders → on a received PO choose Submit Invoice. Lines pre-fill from received quantities at PO rates; confirm and submit. Validation and 3-way match run automatically."],
  ["When will I receive payment?", "Payments are released per your agreed terms. MSME vendors are paid within 45 days as per the MSMED Act."],
  ["What documents are mandatory?", "GST Certificate, PAN, Certificate of Incorporation, GST Returns (last 3 months), MSME/Udyam Certificate, Cancelled Cheque, Director ID, Address Proof, and ITR (last 2 years)."],
  ["How is TDS calculated on my invoices?", "TDS under §194Q is deducted at 0.1% on amounts exceeding the ₹50L threshold in a financial year. It is computed and shown under Deductions & TDS."],
  ["How do I acknowledge a PO?", "Open Purchase Orders, find the PO awaiting acknowledgement, and choose Acknowledge — or raise a query/reject with a reason."],
];

export default function VendorHelpPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Help &amp; FAQs</h1>
        <p className="text-sm text-muted-foreground">Guidance for vendors using the portal.</p>
      </div>
      <div className="space-y-3">
        {FAQS.map(([q, a]) => (
          <Card key={q}><CardContent className="pt-5">
            <div className="text-sm font-semibold">{q}</div>
            <div className="mt-1 text-sm text-muted-foreground">{a}</div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
