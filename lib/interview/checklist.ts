import { readContextFile } from "@/lib/context";
import { parseChecklistCsv, type ChecklistRow } from "@/lib/csv";

const CHECKLIST_PATH = "sample-data/ap-data-collection-template-v2.csv";

export interface Checklist {
  path: string;
  raw: string;
  rows: ChecklistRow[];
}

export async function loadChecklist(): Promise<Checklist> {
  const raw = await readContextFile(CHECKLIST_PATH);
  return { path: CHECKLIST_PATH, raw, rows: parseChecklistCsv(raw) };
}

