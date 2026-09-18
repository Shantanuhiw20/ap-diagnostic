# Sample Data

Everything in this folder is sample data, in the shape a real AP diagnostic uses. No real client, no real numbers. Replace these files with your own templates when you have them.

**The app reads copies, not these files.** From Session 4 onwards, `ey-fin-os/` is self-contained: it reads from `ey-fin-os/context/sample-data/`, not from this folder. After you change anything here, run `npm run sync-context` inside `ey-fin-os` or the app will keep using the old version.

**Quoting matters.** Wrap any field containing a comma in double quotes. Question text and `why_it_matters` text very often contain one, and an unquoted comma silently shifts every later column in that row, so a question ends up in the `data_type` column and the app reads nonsense. Check each row has the same number of columns as the header.

**When you swap in your own files:** keep the same file names and column headers if you can, so no session file needs editing. If your files use different field names, update the headers in `ap-data-collection-template.csv` and `ap-benchmark-data.csv`, then check `session-1-claude-md.md`, `session-2-skills.md`, `session-3-connectors-brief.md`, `session-4-research-agents.md`, `session-5-builds.md` and `capstone.md` for hardcoded field names, column names, or field counts. The sessions currently assume twenty fields, `ap_01` to `ap_20`, and the columns `field_id`, `category`, `question`, `why_it_matters`, `data_type`.

| File | What it is |
| --- | --- |
| `ap-data-collection-template.csv` | The volumetric and process questions an AP diagnostic interview collects |
| `ap-benchmark-data.csv` | Benchmark ranges for those same metrics |
| `ap-reference-diagnostic-report.md` | What a finished AP diagnostic write-up looks like, the shape the build's report generator mirrors |
| `design.md` | The visual design spec (colours, typography, banners, table style) for rendering the report as a branded PDF, reverse-engineered from an EY Finance Transformation deck |
| `ar-data-collection-template.csv` | Same shape, for the AR hackathon track |
| `r2r-data-collection-template.csv` | Same shape, for the R2R hackathon track |
| `fpa-data-collection-template.csv` | Same shape, for the FP&A hackathon track |
| `sample-client-inputs/` | Two sample uploads (`sample-email-from-ap-manager.txt`, an email from an AP manager, and `sample-invoice-aging-extract.csv`, a ten-row invoice extract) that you feed the file-reader skill in Session 2 and the chat in Session 4 |
