# DeepFrame workflow

- After completing any requested code, configuration, or content change, run the relevant checks, commit the intended repository changes, and push the current branch to `origin` before reporting completion.
- Treat `main` as the production branch. Vercel deploys it automatically through the connected GitHub repository; other pushed branches create preview deployments.
- Never commit `.env*`, `.vercel/`, credentials, tokens, build output, or dependencies.
- Do not push a change that fails the relevant build or tests.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
