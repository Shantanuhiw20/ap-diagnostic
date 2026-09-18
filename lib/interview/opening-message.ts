import { loadFixedQuestions } from "./fixed-questions";

/**
 * Deterministic, server-built opening line. No model call: the interview
 * always starts on the same fixed first question, so there's nothing here
 * worth spending a CLI round trip on.
 */
export async function buildOpeningMessageText(): Promise<string> {
  const { questions } = await loadFixedQuestions();
  const firstQuestion = questions[0]?.question.trim() ?? "";

  const intro =
    "Hi, I'm an AI assistant helping the EY team run this Accounts Payable diagnostic. " +
    "I'll ask nine short questions covering volume, process, technology, and metrics. " +
    "Feel free to type your answers or upload a file if that's easier.";

  return firstQuestion ? `${intro}\n\n${firstQuestion}` : intro;
}
