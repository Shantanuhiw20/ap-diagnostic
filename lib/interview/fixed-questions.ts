import { loadChecklist, type Checklist } from "./checklist";
import { FIXED_INTERVIEW_FIELD_IDS } from "@/lib/ap-diagnostic-data";
import type { ChecklistRow } from "@/lib/csv";

export { FIXED_INTERVIEW_FIELD_IDS };

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
