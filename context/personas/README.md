# Personas

Each file in this folder describes ONE finance job role well enough that a chatbot built from it can run a first-pass diagnostic conversation the way an EY expert would.

A persona is not the same thing as `CLAUDE.md`. `CLAUDE.md` (built in Session 1 with `/interview-me`) is your own context: who you are, and the house rules for every build. A persona file is specific to ONE process (AP, AR, R2R, FP&A, or a real client's process) and becomes the system prompt for the chatbot built from it.

## Files here

| File | Built in | Process |
| --- | --- | --- |
| `ap-persona.md` | Session 1 | Accounts Payable, the shared guided build |
| (yours, from the Hackathon) | Hackathon | AR, R2R, FP&A, or your own client's process |

## Building a new persona

Run `/build-persona` any time, in this bootcamp or after it. It asks which process you are building for, interviews you the same way Session 1 did for AP, and saves a new file here. It never touches `CLAUDE.md` or any other persona file. This is how the Hackathon works, and how you would add a fifth or sixth persona for EY after the workshop ends.

**A new persona here is invisible to the app until you sync it.** From Session 5 onwards the app reads `ey-fin-os/context/personas/`, not this folder. After `/build-persona` saves a file here, run `npm run sync-context` inside `ey-fin-os` to copy it across. Skipping that is the most common reason the chat carries on asking the old process's questions.

See `PERSONA.template.md` for the shape every persona file follows.
