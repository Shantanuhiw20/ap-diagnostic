import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { clientAccentRgb } from "./client-accent";

// Structured, text-based PDF generation, not a rasterised screenshot of the
// page. html2canvas was tried first and dropped: it cannot parse the
// oklab()/color-mix() functions Tailwind v4 and modern Chrome generate for
// computed styles, and that source turned out to be broader than just our
// own opacity-modifier classes, not something reliably patchable away. This
// approach also produces a real, selectable, properly paginated PDF instead
// of an image, which is the better outcome anyway.

const EY_BLACK: [number, number, number] = [0, 0, 0];
const EY_YELLOW: [number, number, number] = [255, 230, 0];
const EY_CHARCOAL: [number, number, number] = [46, 46, 56];
const EY_GREY_700: [number, number, number] = [74, 74, 85];
const EY_GREY_200: [number, number, number] = [214, 214, 218];
const EY_GREY_100: [number, number, number] = [246, 246, 244];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_WIDTH = 210; // A4, mm
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

/**
 * A line-based parser tailored to this app's own report output (headings,
 * GFM pipe tables, lists, paragraphs, blockquotes, rules), not a general
 * CommonMark parser. That's a deliberate scope: this only ever has to read
 * markdown our own report prompt produces.
 */
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
      blocks.push({ type: "heading", level: headingMatch[1].length, text: stripInlineMarkdown(headingMatch[2]) });
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
  let cursorY = MARGIN;

  function ensureSpace(height: number) {
    if (cursorY + height > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      cursorY = MARGIN;
    }
  }

  // Cover strip: black band with a yellow beam corner, matching the app's
  // own header treatment.
  doc.setFillColor(...EY_BLACK);
  doc.rect(0, 0, PAGE_WIDTH, 38, "F");
  doc.setFillColor(...EY_YELLOW);
  doc.triangle(PAGE_WIDTH * 0.55, 0, PAGE_WIDTH, 0, PAGE_WIDTH, 38, "F");

  // Minor client personalisation touch, a thin stripe and the client's own
  // name in a colour derived from it. Everything else on this cover, and in
  // the whole rest of the document, stays pure EY.
  if (options.clientName) {
    doc.setFillColor(...clientAccentRgb(options.clientName));
    doc.rect(0, 36.8, PAGE_WIDTH, 1.2, "F");
  }

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("EY", MARGIN, 13);
  doc.setFontSize(14);
  doc.text("Accounts Payable Diagnostic Report", MARGIN, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  let x = MARGIN;
  doc.setTextColor(...WHITE);
  doc.text("Client: ", x, 30);
  x += doc.getTextWidth("Client: ");

  if (options.clientName) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...clientAccentRgb(options.clientName));
    doc.text(options.clientName, x, 30);
    x += doc.getTextWidth(options.clientName);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...WHITE);
  } else {
    doc.text("not established", x, 30);
    x += doc.getTextWidth("not established");
  }

  doc.text(` · Generated ${today}`, x, 30);

  cursorY = 50;

  for (const block of parseMarkdownBlocks(markdown)) {
    if (block.type === "heading") {
      const size = block.level <= 2 ? 13 : 10.5;
      ensureSpace(size / 2 + 8);
      cursorY += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(...EY_BLACK);
      doc.text(block.text, MARGIN, cursorY);
      cursorY += 2;
      doc.setDrawColor(...EY_BLACK);
      doc.setLineWidth(0.4);
      doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
      cursorY += 6;
      doc.setFont("helvetica", "normal");
      continue;
    }

    if (block.type === "paragraph") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...EY_CHARCOAL);
      const lines: string[] = doc.splitTextToSize(block.text, CONTENT_WIDTH);
      ensureSpace(lines.length * 4.6);
      doc.text(lines, MARGIN, cursorY);
      cursorY += lines.length * 4.6 + 3;
      continue;
    }

    if (block.type === "list") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...EY_CHARCOAL);
      block.items.forEach((item, idx) => {
        const prefix = block.ordered ? `${idx + 1}.` : "•";
        const lines: string[] = doc.splitTextToSize(item, CONTENT_WIDTH - 6);
        ensureSpace(lines.length * 4.6);
        doc.text(prefix, MARGIN, cursorY);
        doc.text(lines, MARGIN + 5, cursorY);
        cursorY += lines.length * 4.6 + 1;
      });
      cursorY += 2;
      continue;
    }

    if (block.type === "blockquote") {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      const lines: string[] = doc.splitTextToSize(block.text, CONTENT_WIDTH - 8);
      ensureSpace(lines.length * 4.6 + 2);
      doc.setFillColor(...EY_YELLOW);
      doc.rect(MARGIN, cursorY - 3.5, 1.2, lines.length * 4.6, "F");
      doc.setTextColor(...EY_GREY_700);
      doc.text(lines, MARGIN + 5, cursorY);
      cursorY += lines.length * 4.6 + 4;
      doc.setFont("helvetica", "normal");
      continue;
    }

    if (block.type === "hr") {
      ensureSpace(6);
      doc.setDrawColor(...EY_GREY_200);
      doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
      cursorY += 6;
      continue;
    }

    if (block.type === "table") {
      ensureSpace(14); // at least the header row before starting a table
      autoTable(doc, {
        head: [block.header],
        body: block.rows,
        startY: cursorY,
        margin: { left: MARGIN, right: MARGIN },
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2.2,
          textColor: EY_CHARCOAL,
          lineColor: EY_GREY_200,
          lineWidth: 0.1,
          overflow: "linebreak",
        },
        headStyles: { fillColor: EY_BLACK, textColor: WHITE, fontStyle: "bold", fontSize: 7.5 },
        alternateRowStyles: { fillColor: EY_GREY_100 },
      });
      const withLastAutoTable = doc as unknown as { lastAutoTable?: { finalY: number } };
      cursorY = (withLastAutoTable.lastAutoTable?.finalY ?? cursorY) + 7;
      continue;
    }
  }

  doc.save(options.filename);
}
