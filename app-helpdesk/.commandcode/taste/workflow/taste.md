# Workflow

- Prefers incremental, staged delivery: asks to build the UI layer first (with mock data) before wiring up backend/database work. Confidence: 0.5
- Wants changes verified "live": asks for the app to be started on a dev server (e.g., localhost:3000) and left running so they can click through and test in the browser, not just via automated checks. Confidence: 0.5
- Prefers delegating git operations to the agent — asks it to perform the actual `git commit` and `git push` rather than running the commands themselves. Responds "lanjutkan"/"continue" to authorize the agent to carry the commit+push through to completion. Confidence: 0.65
