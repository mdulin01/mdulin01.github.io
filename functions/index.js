const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();

const resendApiKey = defineSecret("RESEND_API_KEY");

/**
 * sendInvoice — callable Cloud Function
 * Takes { invoiceId } and sends a styled HTML invoice email to the client.
 */
exports.sendInvoice = onCall(
  { secrets: [resendApiKey], region: "us-east1" },
  async (request) => {
    // Auth check
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in.");
    }
    if (request.auth.token.email !== "mdulin@gmail.com") {
      throw new HttpsError("permission-denied", "Admin only.");
    }

    const { invoiceId } = request.data;
    if (!invoiceId) {
      throw new HttpsError("invalid-argument", "invoiceId is required.");
    }

    // Fetch invoice
    const invDoc = await db.collection("portal_invoices").doc(invoiceId).get();
    if (!invDoc.exists) {
      throw new HttpsError("not-found", "Invoice not found.");
    }
    const inv = { id: invDoc.id, ...invDoc.data() };

    if (!inv.clientEmail) {
      throw new HttpsError(
        "failed-precondition",
        "Client has no email address on file."
      );
    }

    // Build email HTML
    const html = buildInvoiceEmail(inv);
    const subject = `Invoice ${inv.invoiceNumber || ""} from Michael Dulin, MD, PhD`;

    // Send via Resend
    const resend = new Resend(resendApiKey.value());
    const { error } = await resend.emails.send({
      from: "Michael Dulin <invoices@mail.mikedulinmd.app>",
      to: [inv.clientEmail],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new HttpsError("internal", "Failed to send email: " + error.message);
    }

    // Update invoice status
    await db.collection("portal_invoices").doc(invoiceId).update({
      status: inv.status === "paid" ? "paid" : "sent",
      sentAt: new Date().toISOString(),
    });

    return { success: true, sentTo: inv.clientEmail };
  }
);

// ─── HTML Email Builder ────────────────────────────────────────────

function fmt(n) {
  return (n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildInvoiceEmail(inv) {
  const lineItems = inv.lineItems || [];
  const hasDateCol = lineItems.some((item) => item.date);
  const hasActivityCol = lineItems.some((item) => item.activity);

  // Client address
  const addrParts = [];
  if (inv.clientAddress1) addrParts.push(inv.clientAddress1);
  if (inv.clientAddress2) addrParts.push(inv.clientAddress2);
  const cityState = [inv.clientCity, inv.clientState].filter(Boolean).join(", ");
  if (cityState || inv.clientZip)
    addrParts.push([cityState, inv.clientZip].filter(Boolean).join(" "));

  // Days overdue
  let daysOverdue = 0;
  if (
    inv.dueDate &&
    (inv.status === "overdue" ||
      (inv.status === "sent" &&
        inv.dueDate < new Date().toISOString().split("T")[0]))
  ) {
    daysOverdue = Math.floor(
      (new Date() - new Date(inv.dueDate + "T00:00:00")) / 86400000
    );
  }

  // Status banner
  let statusBanner = "";
  if (inv.status === "paid") {
    statusBanner = `<tr><td style="padding: 0 40px 24px;">
      <div style="background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; text-align: center; font-weight: 600; font-size: 15px;">
        ✓ This invoice has been paid
      </div>
    </td></tr>`;
  } else if (inv.status === "overdue" || daysOverdue > 0) {
    statusBanner = `<tr><td style="padding: 0 40px 24px;">
      <div style="background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 10px; padding: 16px 20px; text-align: center; font-weight: 600; font-size: 15px;">
        ⚠ This invoice is ${daysOverdue} days past due — please remit payment immediately
      </div>
    </td></tr>`;
  }

  // View online link
  const viewUrl = inv.magicToken
    ? `https://mikedulinmd.app/invoice-view.html?token=${inv.magicToken}`
    : "";

  // Line items rows
  const colCount = 3 + (hasDateCol ? 1 : 0) + (hasActivityCol ? 1 : 0) + 1; // +1 for Amount
  const itemRows = lineItems
    .map(
      (item) => `
      <tr>
        ${hasDateCol ? `<td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f5; font-size: 14px; color: #444; white-space: nowrap;">${fmtDateShort(item.date)}</td>` : ""}
        ${hasActivityCol ? `<td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f5; font-size: 14px; color: #444;">${item.activity || ""}</td>` : ""}
        <td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f5; font-size: 14px; color: #444;">${item.description || ""}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f5; font-size: 14px; color: #444;">${item.quantity || 1}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f5; font-size: 14px; color: #444;">$${fmt(item.rate)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #f5f5f5; font-size: 14px; color: #444; text-align: right;">$${fmt(item.amount)}</td>
      </tr>`
    )
    .join("");

  // Totals
  const balanceDue =
    inv.status === "paid" ? 0 : (inv.total || 0) - (inv.amountPaid || 0);

  let totalsHtml = `
    <tr>
      <td colspan="${colCount - 1}" style="padding: 8px; text-align: right; color: #666; font-size: 14px;">Subtotal</td>
      <td style="padding: 8px; text-align: right; font-size: 14px; color: #111;">$${fmt(inv.total)}</td>
    </tr>`;

  if (inv.amountPaid) {
    totalsHtml += `
    <tr>
      <td colspan="${colCount - 1}" style="padding: 8px; text-align: right; color: #16a34a; font-size: 14px;">Payment Received</td>
      <td style="padding: 8px; text-align: right; font-size: 14px; color: #16a34a;">-$${fmt(inv.amountPaid)}</td>
    </tr>`;
  }

  totalsHtml += `
    <tr>
      <td colspan="${colCount - 1}" style="padding: 12px 8px 8px; text-align: right; font-size: 18px; font-weight: 700; color: #111; border-top: 2px solid #111;">Balance Due</td>
      <td style="padding: 12px 8px 8px; text-align: right; font-size: 18px; font-weight: 700; color: #111; border-top: 2px solid #111;">$${fmt(balanceDue)}</td>
    </tr>`;

  // Overdue notice
  let overdueNotice = "";
  if (inv.status === "overdue" || daysOverdue > 0) {
    overdueNotice = `
    <tr><td style="padding: 0 40px;">
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 10px; padding: 20px 24px; margin-top: 24px;">
        <p style="font-size: 14px; font-weight: 700; color: #dc2626; margin: 0 0 8px;">⚠ Past Due Notice</p>
        <p style="font-size: 14px; color: #444; line-height: 1.6; margin: 0 0 8px;">This invoice is <strong>${daysOverdue} days past due</strong> as of ${fmtDate(new Date().toISOString().split("T")[0])}. The original due date was ${fmtDate(inv.dueDate)}.</p>
        ${inv.amountPaid ? `<p style="font-size: 14px; color: #444; line-height: 1.6; margin: 0 0 8px;">A partial payment of $${fmt(inv.amountPaid)} has been received. The remaining balance of <strong>$${fmt(balanceDue)}</strong> is due immediately.</p>` : ""}
        <p style="font-size: 14px; color: #444; line-height: 1.6; margin: 0;">Please arrange payment at your earliest convenience. If payment has already been sent, please disregard this notice.</p>
      </div>
    </td></tr>`;
  }

  // Payment instructions
  let paymentInstructions = "";
  if (inv.notes) {
    paymentInstructions = `
    <tr><td style="padding: 24px 40px 0;">
      <div style="background: #f5f5f5; border-radius: 10px; padding: 20px 24px;">
        <p style="font-size: 13px; font-weight: 600; color: #111; margin: 0 0 8px;">Payment Instructions</p>
        <p style="font-size: 14px; color: #666; margin: 0; white-space: pre-wrap; line-height: 1.6;">${inv.notes}</p>
      </div>
    </td></tr>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${inv.invoiceNumber || ""}</title>
</head>
<body style="margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #444; line-height: 1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; width: 8px; height: 8px; background: #2563eb; border-radius: 50; vertical-align: middle; margin-right: 8px;"></span>
                    <span style="font-family: Georgia, serif; font-size: 17px; font-weight: 600; color: #111;">Michael Dulin, MD, PhD</span>
                  </td>
                  <td style="text-align: right;">
                    ${viewUrl ? `<a href="${viewUrl}" style="font-size: 13px; color: #888; text-decoration: none;">View online →</a>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: #ffffff; border: 1px solid #dddddd; border-radius: 16px; overflow: hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Blue accent bar -->
                <tr><td style="height: 4px; background: #2563eb; font-size: 0; line-height: 0;">&nbsp;</td></tr>

                ${statusBanner}

                <!-- Invoice title + from address -->
                <tr><td style="padding: 40px 40px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align: top;">
                        <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 600; color: #111; margin: 0 0 4px;">Invoice</h1>
                        <span style="font-size: 15px; color: #888;">${inv.invoiceNumber || ""}</span>
                      </td>
                      <td style="vertical-align: top; text-align: right; font-size: 13px; color: #666; line-height: 1.6;">
                        <strong style="color: #111; font-size: 15px;">Michael Dulin, MD, PhD</strong><br>
                        113 N. Church Street #110<br>
                        Greensboro, NC 27401<br>
                        mdulin@gmail.com<br>
                        704-641-2157<br>
                        <a href="https://mikedulinmd.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">mikedulinmd.com</a>
                      </td>
                    </tr>
                  </table>
                </td></tr>

                <!-- Bill To + Invoice details -->
                <tr><td style="padding: 28px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5; padding: 20px 0;">
                    <tr>
                      <td style="vertical-align: top; width: 50%; padding: 20px 0;">
                        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin: 0 0 2px;">Bill To</p>
                        <p style="font-size: 15px; color: #111; font-weight: 500; margin: 0;">${inv.clientName || ""}</p>
                        ${addrParts.length ? `<p style="font-size: 13px; color: #666; line-height: 1.5; margin: 4px 0 0;">${addrParts.join("<br>")}</p>` : ""}
                        ${inv.clientEmail ? `<p style="font-size: 13px; color: #666; margin: 4px 0 0;">${inv.clientEmail}</p>` : ""}
                      </td>
                      <td style="vertical-align: top; width: 50%; padding: 20px 0;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-right: 24px;">
                              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin: 0 0 2px;">Invoice Date</p>
                              <p style="font-size: 15px; color: #111; font-weight: 500; margin: 0;">${fmtDate(inv.date)}</p>
                            </td>
                            <td>
                              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin: 0 0 2px;">Due Date</p>
                              <p style="font-size: 15px; color: #111; font-weight: 500; margin: 0;${inv.status === "overdue" ? " color: #dc2626;" : ""}">${fmtDate(inv.dueDate)}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-top: 12px;">
                              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin: 0 0 2px;">Terms</p>
                              <p style="font-size: 15px; color: #111; font-weight: 500; margin: 0;">${inv.terms || "Net 30"}</p>
                            </td>
                            <td></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td></tr>

                <!-- Line items -->
                <tr><td style="padding: 0 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <thead>
                      <tr>
                        ${hasDateCol ? '<th style="text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #ddd; font-weight: 600;">Date</th>' : ""}
                        ${hasActivityCol ? '<th style="text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #ddd; font-weight: 600;">Activity</th>' : ""}
                        <th style="text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #ddd; font-weight: 600;">Description</th>
                        <th style="text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #ddd; font-weight: 600;">Qty</th>
                        <th style="text-align: left; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #ddd; font-weight: 600;">Rate</th>
                        <th style="text-align: right; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; border-bottom: 2px solid #ddd; font-weight: 600;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemRows}
                    </tbody>
                    <tfoot>
                      ${totalsHtml}
                    </tfoot>
                  </table>
                </td></tr>

                ${overdueNotice}
                ${paymentInstructions}

                <!-- Spacer -->
                <tr><td style="padding: 20px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="text-align: center; padding: 24px; font-size: 13px; color: #888;">
              <p style="margin: 0 0 12px;">Questions about this invoice?</p>
              <a href="mailto:mdulin@gmail.com?subject=Re: ${inv.invoiceNumber || "Invoice"}" style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;">✉ Contact Dr. Dulin</a>
              <p style="margin: 16px 0 0;">
                <a href="https://mikedulinmd.com" style="color: #2563eb; text-decoration: none; font-weight: 500;">mikedulinmd.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
