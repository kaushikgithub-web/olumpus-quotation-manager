/**
 * Renders a quotation as an HTML string matching the original Olumpus
 * Glasses quotation template — same fonts, colors, margins, borders, and
 * layout captured from the uploaded .docx in earlier phases.
 *
 * This HTML is fed into Puppeteer (see pdf.js) to produce the final PDF.
 * Kept as a plain function (not a templating library) to avoid adding a
 * dependency for something a handful of template literals handles fine.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Embedded as a base64 data URI (not an external <img src="URL">) so the
// PDF never depends on a network fetch succeeding at render time — it's
// baked directly into the HTML Puppeteer renders. Used only when a
// quotation's settings don't specify a custom logo_url.
const DEFAULT_LOGO_BASE64 = readFileSync(
  path.join(__dirname, '../assets/logo.png')
).toString('base64')
const DEFAULT_LOGO_DATA_URI = `data:image/png;base64,${DEFAULT_LOGO_BASE64}`

const COLORS = {
  dark: '#1F497D',
  mid: '#365F91',
  light: '#4F81BD',
}

function escapeHtml(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateDMY(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

/** Parses **bold** markdown-style markers (used in the seeded terms) into <strong> tags. */
function parseBoldMarkdown(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function renderTermsList(terms) {
  if (!Array.isArray(terms) || terms.length === 0) return ''
  return terms
    .map((t) => `<li>${parseBoldMarkdown(t)}</li>`)
    .join('\n')
}

function formatRate(rate) {
  if (rate == null) return ''
  // Matches the template's plain-number style (no thousands separator, e.g.
  // "5150" not "5,150"). Keeps decimals only if the rate actually has them.
  const num = Number(rate)
  return Number.isInteger(num) ? String(num) : num.toFixed(2)
}

function renderItemsRows(items) {
  return items
    .map(
      (item, index) => `
      <tr>
        <td class="sno-cell">${index + 1}</td>
        <td class="desc-cell">${item.description || ''}</td>
        <td class="rate-cell">${formatRate(item.rate)}${
          item.unit ? ` / ${escapeHtml(item.unit)}` : ''
        }</td>
      </tr>`
    )
    .join('\n')
}

export function renderQuotationHtml({ quotation, client, items, settings }) {
  const logoSrc = settings.logo_url || DEFAULT_LOGO_DATA_URI
  const logoHtml = `<img src="${escapeHtml(logoSrc)}" alt="Logo" class="logo" />`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(quotation.reference_number)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Rye&display=swap" rel="stylesheet" />
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    color: #000;
    font-size: 11pt;
    margin: 0;
  }
  .page {
    width: 100%;
    min-height: 100vh;
    padding: 0.5in 0.6in;
  }
  .frame {
    border: 4px double #000;
    padding: 0.4in 0.55in;
    min-height: 100%;
    /* Without this, a frame that spans two pages only draws its border at
       the very top and very bottom of the whole (multi-page) box, leaving
       a broken/gapped border at the page split. "clone" redraws the full
       border on each page fragment instead. */
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }
  .company-name {
    text-align: center;
    color: ${COLORS.dark};
    font-family:'Algerian', 'Impact', 'Arial Black', fantasy;
    font-size: 18pt;
    font-weight: normal;
    letter-spacing: 0.5px;
    margin: 0 0 6px 0;
  }
  .company-detail {
    text-align: center;
    font-size: 10.5pt;
    margin: 2px 0;
  }
  .company-detail a { color: ${COLORS.light}; text-decoration: underline; }
  .logo { display: block; margin: 0 auto 10px auto; max-height: 55px; }
  .quotation-title {
    text-align: center;
    font-weight: bold;
    text-decoration: underline;
    font-size: 12pt;
    margin: 18px 0 14px 0;
  }
  .info-box {
    border: 2px solid #000;
    display: flex;
    margin-bottom: 16px;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .info-left {
    flex: 1;
    padding: 10px 14px;
    border-right: 2px solid #000;
  }
  .info-right {
    width: 220px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }
  .info-right div { font-weight: bold; }
  .project-label { color: ${COLORS.light}; font-weight: bold; }
  .greeting { margin: 14px 0; font-style: italic; font-size: 10.5pt; }
  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.items th, table.items td {
    border: 1.5px solid #000;
    padding: 8px 10px;
    vertical-align: top;
    font-size: 10.5pt;
  }
  table.items tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  table.items th {
    text-align: center;
    font-weight: bold;
    background: #fff;
  }
  .sno-cell { text-align: center; font-weight: bold; width: 50px; }
  .desc-cell { color: ${COLORS.dark}; font-weight: bold; }
  .desc-cell p { margin: 0 0 6px 0; }
  .desc-cell ul, .desc-cell ol { margin: 4px 0; padding-left: 20px; }
  .desc-cell table { border-collapse: collapse; margin-top: 6px; }
  .desc-cell table td, .desc-cell table th {
    border: 1px solid #888;
    padding: 3px 6px;
    font-weight: normal;
    color: #000;
    font-size: 9.5pt;
  }
  .rate-cell { text-align: center; font-weight: bold; width: 130px; white-space: nowrap; }
  .terms-section { margin-left: 24px; }
  .terms-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; break-after: avoid; page-break-after: avoid; }
  .terms-list { margin: 0 0 20px 0; padding-left: 0; list-style: none; }
  .terms-list li {
    position: relative;
    padding-left: 20px;
    margin-bottom: 6px;
    font-size: 10.5pt;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .terms-list li::before {
    content: "➢";
    position: absolute;
    left: 0;
  }
  .closing-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .signoff { color: ${COLORS.dark}; font-weight: bold; margin-top: 24px; }
  .signature-block { margin-top: 48px; font-size: 10.5pt; }
  .signature-block div { margin-bottom: 2px; }
</style>
</head>
<body>
  <div class="page">
    <div class="frame">
      ${logoHtml}
      <div class="company-name">${escapeHtml(settings.company_name)}</div>
      ${settings.address ? `<div class="company-detail">${escapeHtml(settings.address)}</div>` : ''}
      ${settings.phone ? `<div class="company-detail">Phone : ${escapeHtml(settings.phone)}</div>` : ''}
      ${settings.email ? `<div class="company-detail">Email ID :<a href="mailto:${escapeHtml(settings.email)}">${escapeHtml(settings.email)}</a></div>` : ''}

      <div class="quotation-title">QUOTATION</div>

      <div class="info-box">
        <div class="info-left">
          <div>To</div>
          <div>${escapeHtml(client?.name || '')}</div>
          ${quotation.project_name ? `<div style="margin-top:16px;"><span class="project-label">PROJECT</span> – ${escapeHtml(quotation.project_name)}</div>` : ''}
        </div>
        <div class="info-right">
          <div>DATE :${formatDateDMY(quotation.quotation_date)}</div>
          <div>REF. NO. : ${escapeHtml(quotation.reference_number)}</div>
        </div>
      </div>

      <div class="greeting">
        Dear Sir,<br />
        We are pleased to quote our price the prestigious project as below:
      </div>

      <table class="items">
        <thead>
          <tr>
            <th style="width:50px;">S.No.</th>
            <th>Description</th>
            <th style="width:130px;">Rate (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          ${renderItemsRows(items)}
        </tbody>
      </table>

      <div class="terms-section">
        <div class="terms-title">Terms and conditions</div>
        <ul class="terms-list">
          ${renderTermsList(settings.terms_and_conditions)}
        </ul>
      </div>

      <div class="closing-block">
        <div class="signoff">Thanks &amp; Regards</div>
        <div class="signature-block">
          <div>${escapeHtml(settings.signature_name || 'Authorized Signature')}</div>
          <div>${escapeHtml(settings.company_name)}</div>
          ${settings.director_name ? `<div>${escapeHtml(settings.director_name)}</div>` : ''}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}
