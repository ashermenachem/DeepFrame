# DeepFrame workflow

- After completing any requested code, configuration, or content change, run the relevant checks, commit the intended repository changes, and push the current branch to `origin` before reporting completion.
- Treat `main` as the production branch. Vercel deploys it automatically through the connected GitHub repository; other pushed branches create preview deployments.
- Never commit `.env*`, `.vercel/`, credentials, tokens, build output, or dependencies.
- Do not push a change that fails the relevant build or tests.
