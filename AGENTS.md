## graphify

ExpertHub web shares a knowledge graph with `experthub-api`.

Rules:

- Prefer `graphify query` / `path` / `explain` over grep when `~/Desktop/graphify-out/graph.json` exists.
- If `graphify-out/wiki/index.md` exists, start navigation there.
- After editing React/TS files, run `graphify update .` from the graph root or `cd ~/Desktop && graphify update experthub-web`.

Build merged graph:

```bash
cd ~/Desktop && /graphify experthub-api experthub-web --wiki
```
