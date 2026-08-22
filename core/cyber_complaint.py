"""
Cyber crime complaint document generator.

Produces a formatted, print-ready complaint document a user can review,
sign, and file — either online at the National Cyber Crime Reporting
Portal (cybercrime.gov.in) or at a local police station / cyber cell.
Defaults to Indian complaint conventions (IT Act 2000 / IPC references)
given this project's context; the legal-references section is written
as a starting point, not a certified legal opinion — see the disclaimer
baked into the document itself.

This module only ever produces a *document* for the user to review and
submit themselves. It never transmits, files, or submits anything on
the user's behalf.

Output is HTML, not PDF: WeasyPrint (the PDF backend core/reports.py
already knows how to call) isn't installed, and its Windows setup
requires GTK system libraries that are painful to provision reliably.
The HTML is styled for both screen review and browser "Print to PDF" /
physical printing (@media print rules), so the missing PDF step is a
one-click action for the user rather than a blocker.
"""

from __future__ import annotations

import html
import uuid
from datetime import datetime, timezone
from typing import Any

# Commonly cited in Indian deepfake / impersonation / forgery complaints.
# Presented as a starting reference, not a legal determination — the
# document itself carries an explicit disclaimer to this effect.
LEGAL_REFERENCES = [
    ("IT Act, 2000 — Section 66C", "Identity theft (fraudulent use of a person's identity/likeness)"),
    ("IT Act, 2000 — Section 66D", "Cheating by personation using a computer resource"),
    ("IT Act, 2000 — Section 66E", "Violation of privacy (capturing/publishing private images)"),
    ("IPC — Section 419", "Cheating by personation"),
    ("IPC — Section 465 / 468", "Forgery / forgery for the purpose of cheating"),
    ("IPC — Section 500", "Defamation"),
]


def _esc(value: Any) -> str:
    return html.escape(str(value)) if value is not None else ""


def _now_str() -> str:
    return datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")


def build_complaint_html(
    analysis: dict[str, Any],
    complainant: dict[str, Any],
    file_name: str = "",
) -> str:
    """
    Build the complaint document as self-contained, printable HTML.

    Args:
        analysis: the analysis result dict (same shape returned by
            core.pipeline.analyze_image / analyze_document / analyze_video —
            only a handful of common fields are read, so any of them work).
        complainant: {name, phone, email, address, incident_description}
        file_name: original media file name, for the record.
    """
    complaint_id = f"PXC-{uuid.uuid4().hex[:10].upper()}"

    verdict = analysis.get("verdict", "UNKNOWN")
    risk_percent = analysis.get("risk_percent", analysis.get("risk_score", 0) * 100)
    confidence = analysis.get("confidence", "")
    media_type = analysis.get("media_type", "image")
    analyzed_at = analysis.get("timestamp", _now_str())
    explanation = analysis.get("explanation", "")

    model_scores = analysis.get("model_scores", {}) or {}
    model_rows = "".join(
        f"<tr><td>{_esc(name)}</td><td>{float(score) * 100:.1f}%</td></tr>"
        for name, score in model_scores.items()
    )
    if not model_rows:
        model_rows = "<tr><td colspan='2'>No per-model breakdown available for this analysis.</td></tr>"

    legal_rows = "".join(
        f"<tr><td>{_esc(section)}</td><td>{_esc(desc)}</td></tr>"
        for section, desc in LEGAL_REFERENCES
    )

    name = _esc(complainant.get("name", ""))
    phone = _esc(complainant.get("phone", ""))
    email = _esc(complainant.get("email", ""))
    address = _esc(complainant.get("address", "")).replace("\n", "<br>")
    incident_description = _esc(complainant.get("incident_description", "")) or (
        "[Describe where and how you encountered this content, and any "
        "harm or risk it poses, e.g. impersonation, fraud, harassment.]"
    )

    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Cyber Crime Complaint — {complaint_id}</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{
    font-family: Georgia, 'Times New Roman', serif;
    color: #1a1a1a;
    background: #f4f4f2;
    margin: 0;
    padding: 32px 16px;
    line-height: 1.55;
  }}
  .page {{
    max-width: 780px;
    margin: 0 auto;
    background: #ffffff;
    padding: 48px 56px;
    border: 1px solid #d8d8d4;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }}
  h1 {{ font-size: 1.4rem; text-align: center; margin: 0 0 4px; letter-spacing: 0.02em; }}
  .subtitle {{ text-align: center; color: #555; font-size: 0.85rem; margin-bottom: 4px; }}
  .meta {{ text-align: center; color: #777; font-size: 0.78rem; margin-bottom: 28px; }}
  h2 {{ font-size: 1.0rem; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 28px; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.9rem; }}
  td {{ padding: 5px 8px; border-bottom: 1px solid #eee; vertical-align: top; }}
  td:first-child {{ color: #444; width: 38%; font-weight: 600; }}
  .field-value {{ min-height: 1.2em; }}
  .verdict-badge {{
    display: inline-block; padding: 4px 12px; border-radius: 3px;
    font-weight: 700; font-size: 0.85rem; letter-spacing: 0.03em;
    background: #fdecea; color: #b91c1c; border: 1px solid #f5c2c0;
  }}
  .disclaimer {{
    margin-top: 32px; padding: 14px 16px; background: #fffbea;
    border: 1px solid #f3e2a0; border-radius: 4px; font-size: 0.8rem; color: #6b5a1e;
  }}
  .sign-row {{ display: flex; justify-content: space-between; margin-top: 56px; }}
  .sign-box {{ width: 45%; }}
  .sign-line {{ border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; font-size: 0.8rem; color: #555; }}
  ul {{ font-size: 0.85rem; padding-left: 20px; }}
  @media print {{
    body {{ background: #fff; padding: 0; }}
    .page {{ box-shadow: none; border: none; max-width: none; padding: 24px 8px; }}
  }}
</style>
</head>
<body>
<div class="page">
  <h1>COMPLAINT — AI-GENERATED / MANIPULATED MEDIA</h1>
  <div class="subtitle">For submission to the National Cyber Crime Reporting Portal (cybercrime.gov.in) or local Cyber Crime Cell</div>
  <div class="meta">Complaint Reference: {complaint_id} &nbsp;|&nbsp; Prepared: {_now_str()}</div>

  <h2>1. Complainant Details</h2>
  <table>
    <tr><td>Full Name</td><td class="field-value">{name or '&nbsp;'}</td></tr>
    <tr><td>Phone</td><td class="field-value">{phone or '&nbsp;'}</td></tr>
    <tr><td>Email</td><td class="field-value">{email or '&nbsp;'}</td></tr>
    <tr><td>Address</td><td class="field-value">{address or '&nbsp;'}</td></tr>
  </table>

  <h2>2. Nature of Complaint</h2>
  <p>I wish to report media content that automated forensic analysis has flagged as
  <strong>likely AI-generated or digitally manipulated</strong>, described below.</p>
  <table>
    <tr><td>File Name</td><td>{_esc(file_name) or 'Not recorded'}</td></tr>
    <tr><td>Media Type</td><td>{_esc(media_type).title()}</td></tr>
    <tr><td>Verdict</td><td><span class="verdict-badge">{_esc(verdict)}</span></td></tr>
    <tr><td>Risk Score</td><td>{float(risk_percent):.1f}%</td></tr>
    <tr><td>Confidence</td><td>{_esc(confidence)}</td></tr>
    <tr><td>Analyzed At</td><td>{_esc(analyzed_at)}</td></tr>
  </table>

  <h2>3. Description of Incident</h2>
  <p>{incident_description}</p>

  <h2>4. Technical Evidence Summary</h2>
  <p style="font-size:0.85rem;color:#444;">Produced by ProofyX automated forensic analysis. {_esc(explanation)}</p>
  <table>
    <tr><td colspan="2" style="font-weight:700;color:#222;">Per-Model Scores (P(AI-generated), 0-100%)</td></tr>
    {model_rows}
  </table>

  <h2>5. Applicable Legal Provisions (Reference Only)</h2>
  <table>{legal_rows}</table>
  <p style="font-size:0.78rem;color:#777;">These are commonly cited provisions in similar cases in India and are
  provided as a starting reference only — they are not a determination that they apply to this
  specific incident. Confirm applicability with the reporting portal's own categorization or a
  legal professional before filing.</p>

  <h2>6. Declaration</h2>
  <p>I declare that the information provided above is true and accurate to the best of my knowledge,
  and that the attached technical analysis was generated by ProofyX's automated detection system.
  I understand this analysis is a technical forensic aid and not a certified legal or expert
  opinion, and I am submitting this complaint at my own discretion.</p>

  <div class="sign-row">
    <div class="sign-box">
      <div class="sign-line">Signature</div>
    </div>
    <div class="sign-box">
      <div class="sign-line">Date</div>
    </div>
  </div>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This document was generated automatically by ProofyX based on an
    AI forensic analysis. It is a technical aid intended to support a complaint you file yourself —
    ProofyX does not submit this complaint to any authority, and this document does not constitute
    legal advice or a certified forensic report. Review all fields, complete the incident
    description, and consult the relevant reporting portal or legal counsel before submission.
  </div>
</div>
</body>
</html>"""


def generate_complaint_document(
    analysis: dict[str, Any],
    complainant: dict[str, Any],
    file_name: str = "",
) -> tuple[bytes, str, str]:
    """
    Returns (content_bytes, mime_type, suggested_filename).

    Tries a PDF render via WeasyPrint if installed; otherwise returns the
    print-ready HTML directly (see module docstring).
    """
    html_doc = build_complaint_html(analysis, complainant, file_name)

    try:
        from weasyprint import HTML  # type: ignore
        pdf_bytes = HTML(string=html_doc).write_pdf()
        return pdf_bytes, "application/pdf", "cyber_complaint.pdf"
    except ImportError:
        return html_doc.encode("utf-8"), "text/html", "cyber_complaint.html"
