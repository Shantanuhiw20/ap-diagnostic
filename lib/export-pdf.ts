import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { clientAccentRgb } from "./client-accent";

// Implements the report design specification in context/sample-data/design.md:
// - Cover block: ey-navy (#0D1B2E) background with upper-left ey-yellow (#FFE600)
//   rectangle block and black bold text (client name, report title, period & basis)
// - Section headings: full-width header band in ey-charcoal (#2E2E38) with white bold text
// - Tables: ey-yellow (#FFE600) header row with black bold text; plain white body rows
//   with thin ey-grey borders on every cell
// - Footer on every page: Page X / date generated / report title in ey-grey

const EY_BLACK: [number, number, number] = [0, 0, 0];
const EY_YELLOW: [number, number, number] = [255, 230, 0];
const EY_NAVY: [number, number, number] = [13, 27, 46];
const EY_CHARCOAL: [number, number, number] = [46, 46, 56];
const EY_GREY: [number, number, number] = [88, 89, 91];
const EY_GREY_200: [number, number, number] = [214, 214, 218];
const EY_GREY_LIGHT: [number, number, number] = [242, 242, 242];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_WIDTH = 210; // A4, mm
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const FOOTER_MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const REPORT_TITLE = "Accounts Payable Diagnostic: Current State Assessment";

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .trim();
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "blockquote"; text: string }
  | { type: "hr" };

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => stripInlineMarkdown(cell));
}

function parseMarkdownBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: stripInlineMarkdown(headingMatch[2]),
      });
      i++;
      continue;
    }

    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: stripInlineMarkdown(quoteLines.join(" ")) });
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitTableRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        items.push(stripInlineMarkdown(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, "")));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !isTableRow(lines[i]) &&
      !/^\s*>/.test(lines[i]) &&
      !/^\s*([-*+]|\d+\.)\s+/.test(lines[i]) &&
      !/^\s*(---+|\*\*\*+)\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", text: stripInlineMarkdown(paraLines.join(" ")) });
  }

  return blocks;
}

export async function exportReportToPdf(
  markdown: string,
  options: { clientName?: string; filename: string },
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Cover block per context/sample-data/design.md:
  // Full-bleed dark navy background (ey-navy #0D1B2E) with a plain yellow
  // rectangle block in the upper-left containing black bold text.
  doc.setFillColor(...EY_NAVY);
  doc.rect(0, 0, PAGE_WIDTH, 54, "F");

  // Plain yellow rectangle block in upper-left with generous padding
  doc.setFillColor(...EY_YELLOW);
  doc.rect(MARGIN, 8, CONTENT_WIDTH * 0.78, 38, "F");

  if (options.clientName) {
    doc.setFillColor(...clientAccentRgb(options.clientName));
    doc.rect(MARGIN, 44.5, CONTENT_WIDTH * 0.78, 1.5, "F");
  }

  // EY mark on the right side of the navy field
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("EY", PAGE_WIDTH - MARGIN, 18, { align: "right" });
  doc.setFontSize(7.5);
  doc.text("FINANCE TRANSFORMATION", PAGE_WIDTH - MARGIN, 23.5, { align: "right" });

  // Inside the yellow block: black bold text
  doc.setTextColor(...EY_BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(
    options.clientName ? options.clientName.toUpperCase() : "CLIENT: NOT ESTABLISHED",
    MARGIN + 5,
    16,
  );

  doc.setFontSize(13.5);
  doc.text(REPORT_TITLE, MARGIN + 5, 24.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    `Process: Accounts Payable  ·  Generated: ${today}  ·  Basis: Structured Diagnostic & Extract Review`,
    MARGIN + 5,
    33,
  );

  let cursorY = 63;

  function ensureSpace(height: number) {
    if (cursorY + height > PAGE_HEIGHT - FOOTER_MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
    }
  }

  const blocks = parseMarkdownBlocks(markdown);

  for (const block of blocks) {
    if (block.type === "heading") {
      // Skip duplicate top-level report title since it's already in the cover block
      if (block.level === 1 && /Accounts Payable Diagnostic/i.test(block.text)) {
        continue;
      }

      if (block.level <= 2) {
        // Section header band in ey-charcoal (#2E2E38) with white bold text per design.md
        ensureSpace(14);
        cursorY += 2;
        doc.setFillColor(...EY_CHARCOAL);
        doc.rect(MARGIN, cursorY - 5, CONTENT_WIDTH, 8.5, "F");
        doc.setFillColor(...EY_YELLOW);
        doc.rect(MARGIN, cursorY - 5, 2, 8.5, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(...WHITE);
        doc.text(block.text.toUpperCase(), MARGIN + 5, cursorY + 0.6);
        cursorY += 8;
        doc.setFont("helvetica", "normal");
      } else {
        ensureSpace(9);
        cursorY += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(...EY_BLACK);
        doc.text(block.text, MARGIN, cursorY);
        cursorY += 4.5;
        doc.setFont("helvetica", "normal");
      }
      continue;
    }

    if (block.type === "paragraph") {
      // Skip the raw header metadata lines if already shown in cover
      if (/^(Client:|Process in scope:|Period reviewed:|Basis:)/i.test(block.text)) {
        continue;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.2);
      doc.setTextColor(...EY_CHARCOAL);
      const lines: string[] = doc.splitTextToSize(block.text, CONTENT_WIDTH);
      ensureSpace(lines.length * 4.5 + 2);
      doc.text(lines, MARGIN, cursorY);
      cursorY += lines.length * 4.5 + 3;
      continue;
    }

    if (block.type === "list") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.2);
      doc.setTextColor(...EY_CHARCOAL);
      block.items.forEach((item, idx) => {
        const prefix = block.ordered ? `${idx + 1}.` : "•";
        const lines: string[] = doc.splitTextToSize(item, CONTENT_WIDTH - 6);
        ensureSpace(lines.length * 4.5);
        doc.setFont("helvetica", "bold");
        doc.text(prefix, MARGIN, cursorY);
        doc.setFont("helvetica", "normal");
        doc.text(lines, MARGIN + 5.5, cursorY);
        cursorY += lines.length * 4.5 + 1.2;
      });
      cursorY += 2;
      continue;
    }

    if (block.type === "blockquote") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines: string[] = doc.splitTextToSize(block.text, CONTENT_WIDTH - 10);
      const boxHeight = lines.length * 4.4 + 4;
      ensureSpace(boxHeight + 3);
      doc.setFillColor(...EY_GREY_LIGHT);
      doc.rect(MARGIN, cursorY - 4, CONTENT_WIDTH, boxHeight, "F");
      doc.setFillColor(...EY_YELLOW);
      doc.rect(MARGIN, cursorY - 4, 1.5, boxHeight, "F");
      doc.setTextColor(...EY_BLACK);
      doc.text(lines, MARGIN + 5, cursorY);
      cursorY += boxHeight + 3;
      continue;
    }

    if (block.type === "hr") {
      continue;
    }

    if (block.type === "table") {
      ensureSpace(16);
      // Per design.md:
      // Header row: ey-yellow background, black bold text, left-aligned.
      // Body rows: plain white background, ey-charcoal text, thin ey-grey borders on every cell.
      autoTable(doc, {
        head: [block.header],
        body: block.rows,
        startY: cursorY,
        margin: { left: MARGIN, right: MARGIN, bottom: FOOTER_MARGIN },
        styles: {
          font: "helvetica",
          fontSize: 7.8,
          cellPadding: 2.4,
          fillColor: WHITE,
          textColor: EY_CHARCOAL,
          lineColor: EY_GREY_200,
          lineWidth: 0.18,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: EY_YELLOW,
          textColor: EY_BLACK,
          fontStyle: "bold",
          fontSize: 7.8,
          lineColor: EY_GREY,
          lineWidth: 0.2,
        },
      });
      const withLastAutoTable = doc as unknown as { lastAutoTable?: { finalY: number } };
      cursorY = (withLastAutoTable.lastAutoTable?.finalY ?? cursorY) + 6;
      continue;
    }
  }

  // Add 3-part footer on every page per design.md:
  // left: Page X, center: date generated, right: report title
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...EY_GREY_200);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...EY_GREY);
    doc.text(`Page ${p} of ${pageCount}`, MARGIN, PAGE_HEIGHT - 7.5);
    doc.text(today, PAGE_WIDTH / 2, PAGE_HEIGHT - 7.5, { align: "center" });
    doc.text(REPORT_TITLE, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7.5, { align: "right" });
  }

  doc.save(options.filename);
}

