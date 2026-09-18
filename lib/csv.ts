// Minimal RFC-4180-ish CSV parsing: just enough to handle the checklist
// files' quoted fields with embedded commas, no external dependency needed
// for a ~22-row file.

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export interface ChecklistRow {
  field_id: string;
  category: string;
  question: string;
  why_it_matters: string;
  data_type: string;
}

export function parseChecklistCsv(csvText: string): ChecklistRow[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.length > 0);
  const [headerLine, ...rowLines] = lines;
  if (!headerLine) return [];

  const columns = parseCsvLine(headerLine);
  return rowLines.map((line) => {
    const values = parseCsvLine(line);
    const row = {} as Record<string, string>;
    columns.forEach((col, i) => {
      row[col] = values[i] ?? "";
    });
    return row as unknown as ChecklistRow;
  });
}
