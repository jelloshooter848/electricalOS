# services/ask

Serverless function that answers electrician questions with the Claude API.
Planned for Phase 3. It will:

- accept `{ question, edition, jurisdiction, userId }`,
- pull the top matching entries from `@electricalos/nec-data` as grounding,
- call the Claude API with a cached system prompt and streaming output,
- return an answer that cites article numbers and carries the disclaimer,
- enforce a per-user daily question cap.

The Anthropic API key lives only here, never in the mobile app.
