import { loadChecklist, type Checklist } from "./checklist";
import type { ChecklistRow } from "@/lib/csv";

/**
 * The fixed interview set: five must-ask fields and four high-value fields,
 * always asked in this order. Chosen because the report's causal chain and
 * its benchmarking table cannot be built without them, not because they are
 * the "first" fields in the checklist file.
 *
 * Order follows the causal chain the reference report argues (low PO
 * coverage -> exceptions -> cycle time -> late payment -> downstream cost
 * and symptoms), which also happens to read as a natural interview arc.
 *
 * Must-ask (blocking, the report cannot be written without these):
 *   ap_03 volume, ap_04 PO coverage, ap_08 exception rate,
 *   ap_11 paid on time, ap_19 FTE count
 * High-value (needed for the benchmarking table's breadth):
 *   ap_09 cycle time, ap_10 DPO, ap_14 discount capture, ap_17 vendor queries
 */
export const FIXED_INTERVIEW_FIELD_IDS = [
  "ap_03",
  "ap_04",
  "ap_08",
  "ap_09",
  "ap_11",
  "ap_10",
  "ap_14",
  "ap_17",
  "ap_19",
] as const;

export interface FixedQuestion {
  fieldId: string;
  category: string;
  question: string;
}

export async function loadFixedQuestions(): Promise<{ checklist: Checklist; questions: FixedQuestion[] }> {
  const checklist = await loadChecklist();
  const byId = new Map<string, ChecklistRow>(checklist.rows.map((row) => [row.field_id, row]));

  const questions: FixedQuestion[] = [];
  const missing: string[] = [];

  for (const fieldId of FIXED_INTERVIEW_FIELD_IDS) {
    const row = byId.get(fieldId);
    if (!row) {
      missing.push(fieldId);
      continue;
    }
    questions.push({ fieldId: row.field_id, category: row.category, question: row.question });
  }

  if (missing.length > 0) {
    throw new Error(
      `The fixed interview list references field_id(s) not present in ${checklist.path}: ${missing.join(", ")}. ` +
        "The checklist file changed shape, lib/interview/fixed-questions.ts needs updating to match.",
    );
  }

  return { checklist, questions };
}
