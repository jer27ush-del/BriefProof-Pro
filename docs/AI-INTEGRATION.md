# OpenAI integration

All requests are made by `src/lib/ai/service.ts` using the official `openai` JavaScript SDK and the Responses API. The SDK's Zod helper requests structured outputs and the results are parsed again before use.

| Function                    | API action            | Input                              |
| --------------------------- | --------------------- | ---------------------------------- |
| generateBrief               | `/api/ai/brief`       | Validated written brief            |
| generateFollowUpQuestions   | `/api/ai/questions`   | Validated brief                    |
| matchCreators               | `/api/ai/match`       | Owned campaign + database profiles |
| evaluateCreatorAgainstBrief | `/api/ai/evaluate`    | Owned campaign + selected profile  |
| generateMilestones          | `/api/ai/milestones`  | Owned campaign + brief output      |
| analyzeBrandConsistency     | `/api/ai/consistency` | Owned reference/frame images       |
| reviewLicenseChecklist      | `/api/ai/license`     | Saved production declarations      |

## Configuration

- `OPENAI_API_KEY`: server secret; never use a NEXT_PUBLIC prefix.
- `OPENAI_MODEL`: text model; default/example `gpt-4.1-mini`.
- `OPENAI_VISION_MODEL`: image-capable model; falls back to `OPENAI_MODEL`.

Select models supported by your API account with Responses and structured-output support. Vision needs image input. The project does not train a model or claim that generated assessments are verified facts.

## Controls

- Authenticated user required before a provider request.
- Shared PostgreSQL quota: 10 requests/minute and 100/day per user.
- JSON request-size limit, strict Zod inputs and bounded output tokens.
- 45-second SDK timeout; zero automatic retries.
- Responses requested with `store: false`.
- No raw provider errors, secrets or submitted content logged by application code.
- Returned creator IDs and evidence IDs checked against the supplied catalogue.
- Proposed milestone dates checked against today and the campaign deadline.
- Private images downloaded using the user's own Supabase session and ownership-checked paths.
- Missing configuration, refusal, incomplete output, malformed output, provider quota and other failures produce explicit errors. They never become fake successful results.

Vision requires human review and can misread logos/text, miss changes or overstate differences. LicenseGuard does not inspect actual license contracts or fetch up-to-date provider terms. It only reviews supplied information. Model-generated text can still make factual mistakes despite schema and ID validation.

Official implementation references consulted:

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://nextjs.org/docs/app/api-reference/file-conventions/proxy
