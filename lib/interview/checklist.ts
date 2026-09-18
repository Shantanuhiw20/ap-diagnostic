import { contextFileExists, readContextFile } from "@/lib/context";
import { parseChecklistCsv, type ChecklistRow } from "@/lib/csv";

const CHECKLIST_V2_PATH = "sample-data/ap-data-collection-template-v2.csv";
const CHECKLIST_V1_PATH = "sample-data/ap-data-collection-template.csv";

/**
 * The v2 (reviewed) checklist supersedes the original, but this checks live
 * on every call rather than assuming, so the app keeps working if v2 is ever
 * removed and picks it up automatically if it's added later.
 */
export async function resolveChecklistPath(): Promise<string> {
  return (await contextFileExists(CHECKLIST_V2_PATH)) ? CHECKLIST_V2_PATH : CHECKLIST_V1_PATH;
}

export interface Checklist {
  path: string;
  raw: string;
  rows: ChecklistRow[];
}

export async function loadChecklist(): Promise<Checklist> {
  const path = await resolveChecklistPath();
  const raw = await readContextFile(path);
  return { path, raw, rows: parseChecklistCsv(raw) };
}
