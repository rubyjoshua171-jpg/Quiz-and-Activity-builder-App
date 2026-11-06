# Back End Guide

**Owner:** Thandi (back end)
**Front end:** Ruby
**Last updated:** Thursday 5 November 2026

This guide explains what the back end does, how the front end uses it, and how to run and test it. It grows as we add more.

---

## The back end in plain words

The back end is everything the teacher and students don't see:
- the **AI route** that turns a teacher's request into an activity,
- the **checks** that make sure the AI's answer makes sense,
- the **database** that saves each teacher's activities,
- the **security rules** that keep one teacher's work private.

The front end only talks to two things: `POST /api/generate` (to make activities) and the Supabase helpers in `lib/supabase/` (to log in, save, list, and load a public activity).

---

## `/api/generate`

### What it does
It receives a request, checks it, asks the AI for an activity, checks the AI's answer, and returns either a finished activity or a friendly error.

**Fake mode** (`FAKE_MODE=true`): returns a saved sample activity for the chosen type and never calls the AI. Use this for all screen work. It's free and instant.

**Real mode** (`FAKE_MODE=false`): asks the AI to write the activity, then checks it.

### How a request is handled
1. Check the request has the right shape (a type and a prompt).
2. In fake mode, return the sample for that type and stop.
3. Build the instructions for the AI (a rule for each activity type) and the conversation so far.
4. Ask the AI for an activity.
5. Check the answer: right shape, right type, and the content checks below.
6. If something is wrong, send the problems back to the AI **once** and check the new answer.
7. If it is still wrong, return a friendly error. The front end keeps showing the previous version.
8. On a first request (not a refine), shuffle each multiple choice question's options, so the right answer isn't always in the same place.

### How to call it
```ts
const res = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "multiple_choice", prompt: "Photosynthesis, 3 questions" }),
});
const data = await res.json();
// data.ok is true: use data.activity.
// data.ok is false: show data.error and keep the previous version.
```

### What you send
| Field | Meaning |
|---|---|
| `type` | `multiple_choice`, `true_false`, `flashcards`, `matching` or `ordering` |
| `prompt` | What the teacher typed or pasted |
| `chat` | The chat so far (optional, empty the first time) |
| `currentActivity` | The whole activity being refined (optional, leave out the first time) |

### What you get back
- `{ ok: true, activity }`: the whole new activity
- `{ ok: false, error }`: a friendly message to show the teacher

A bad request (for example no `prompt`) gets a 400 status with a friendly message. If the AI fails, you get a 500 status with a friendly message, and the details stay on the server.

### Files
| File | What it holds |
|---|---|
| `app/api/generate/route.ts` | The route: checks the request, the fake mode switch, calls the AI, handles errors |
| `lib/generate/prompt.ts` | The instructions given to the AI, with a rule for each activity type, and the conversation builder |
| `lib/generate/provider.ts` | Chooses which AI to use, based on `AI_PROVIDER`, and shuffles the answers on a first request |
| `lib/generate/gemini.ts` | The Google Gemini call, with fallback models and a wait-and-retry when the AI is busy |
| `lib/generate/claude.ts` | The Claude call, kept ready for when we have a Claude key |
| `lib/generate/retry.ts` | Checks the AI's answer and sends the problems back **once** if there are any |
| `lib/generate/checks.ts` | The content checker (see below) |
| `lib/generate/shuffle.ts` | Shuffles each question's options so the right answer isn't always in the same place (used on a first request, not on a refine) |
| `lib/generate/checks.test.ts`, `retry.test.ts`, `shuffle.test.ts` | The automated tests for the checker, the retry and the answer shuffling |
| `shared/schemas.ts` | What each activity type looks like, and the size limits (`LIMITS`) |
| `shared/generate-contract.ts` | The request and response format |
| `shared/samples.ts` | The sample activities used by fake mode |

---

## The AI providers

`AI_PROVIDER` chooses the AI. The rest of the app doesn't care which one runs.

| Provider | Setting | Status |
|---|---|---|
| **Gemini** (the default for now) | `AI_PROVIDER=gemini` | Working and tested locally. Our supervisor asked groups to use a Google key for now. |
| **Claude** | `AI_PROVIDER=claude` | Written, **not yet tested** (no Claude key yet). Uses Claude's structured outputs. |

**How Gemini is used.** Gemini is asked for JSON and is shown an example of the exact shape it must return. Our own checks then make sure the answer is right, and the one retry fixes problems. (Claude's version uses structured outputs instead.)

**If the AI is busy or out of free quota.** `gemini.ts` waits and retries when Google says it is busy (503). If a model is busy, out of free quota (429) or not found (404), it moves on to the next one. The built-in models are `gemini-3.1-flash-lite`, then `gemini-3.5-flash`. `GEMINI_MODEL` can override the list, but it is optional. The model name must be written without a `models/` prefix.

---

## The content checker

`lib/generate/checks.ts` reads an activity and returns a list of problems in plain English. An empty list means it is fine. It checks:

- **Empty text:** the title, instructions, questions, options, explanations, cards, pairs and items must not be blank.
- **Length:** every text must fit within the limits in `LIMITS` (so it fits on a phone).
- **HTML:** no HTML in any text (plain text only).
- **Counts:** a sensible number of questions, statements, cards, pairs or items.
- **Multiple choice:** exactly 4 options, no repeated option, and the correct answer points to a real option.
- **Repeats:** no repeated questions, statements, card fronts, matching sides or ordering items.

The checker is covered by 10 automated tests. The retry logic is covered by 4 more, using a pretend AI, and the answer shuffling by 2 more.

---

## Database and security

### Our own Supabase project
Project name: LearnBuilder. It belongs to our group only.

### The `activities` table
| Column | Meaning |
|---|---|
| `id` | A unique id for the activity (used for the `/a/<id>` link) |
| `owner_id` | The teacher who made it, filled in automatically from their login |
| `type` | The activity type |
| `content` | The activity itself, saved as JSON |
| `created_at`, `updated_at` | When it was made and last changed |

### Row-level security, in plain words
Row-level security (RLS) is a set of rules inside the database. Even if someone gets hold of the public key, they can only reach rows they own. A teacher can see, save, edit and delete **their own** activities only, and cannot save something pretending to be someone else.

### Public share links
The `/a/<id>` page works without a login. The table itself stays locked. Instead, one database function, `get_public_activity`, returns a single activity by its id. `lib/supabase/public-activity.ts` wraps it for the front end:

```ts
import { getPublicActivity } from "@/lib/supabase/public-activity";
const activity = await getPublicActivity(id); // null if not found
```

### For the front end
`lib/supabase/client.ts` is the one door for login, saving and listing. Import `supabase` from it.

### `supabase/schema.sql`
The written record of how the database was set up (the table, the four rules and the public function). **Whenever the database changes, the same SQL must be added to this file**, so anyone can rebuild it.

---

## Tests

```
npm test
```
Runs the 16 automated tests (checker, retry and answer shuffling). They also run automatically on every pull request, using GitHub Actions (`.github/workflows/tests.yml`).

Extra scripts (they need the test teacher settings):

| Script | What it proves |
|---|---|
| `node --env-file=.env.local scripts/test-rls.mjs` | One teacher cannot see, edit, delete or impersonate another teacher's activities (6 checks) |
| `node --env-file=.env.local scripts/test-public.mjs` | A visitor can load one activity by its link but cannot browse the table (3 checks) |
| `node scripts/run-test-set.mjs` | Sends the 10 realistic teacher requests to `/api/generate` (the app must be running with `FAKE_MODE=false`). See `docs/test-set.md` |

Rerun the security scripts whenever the database rules change, and the test set whenever the prompt changes.

---

## Settings (`.env.local`)

Copy `.env.example` to `.env.local` and fill in the values. `.env.local` stays on your own computer and is never committed.

| Setting | Safe to share? | What it is |
|---|---|---|
| `FAKE_MODE` | Yes | `true` returns samples, `false` calls the AI |
| `AI_PROVIDER` | Yes | `gemini` (default) or `claude` |
| `GEMINI_API_KEY` | **No** | The Google AI Studio key. Server only, never in chat or Git |
| `GEMINI_MODEL` | Yes | Optional. Leave it empty to use the built-in models |
| `ANTHROPIC_API_KEY` | **No** | The Claude key. Only needed for `AI_PROVIDER=claude` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | The address of our Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | The public key (shown as "publishable key" in Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | The secret Supabase key. Server only. The app does not use it yet |
| `TEST_TEACHER1_EMAIL` and the other `TEST_TEACHER` settings | Test accounts only | Used by the security test scripts |

---

## Running it

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values.
3. `npm run dev` (run it **once**, and use a second terminal for commands)
4. Open `http://localhost:3000`.

If the app says the port is in use, an old copy is still running. Stop it with `taskkill /IM node.exe /F` and start it again. The app only reads `.env.local` when it starts, so restart it after changing a setting.

---

## Deployment

The app is deployed on Vercel from Ruby's account: https://quiz-and-activity-builder-app-teal.vercel.app

It was deployed in fake mode. To switch the live site to the real AI, in Vercel's **Settings → Environment Variables** add `GEMINI_API_KEY` and `AI_PROVIDER=gemini`, set `FAKE_MODE` to `false`, and redeploy (Vercel only reads settings when it builds). The Gemini code must be merged into `main` first.

In Supabase, **Authentication → URL Configuration** allows the live link and `http://localhost:3000`.

---

## Log

**Day 2:** moved into Ruby's repo, brought across the Next.js project, built `/api/generate` in fake mode and tested it, and wrote the real AI call and the prompt.

**Day 3:** created our Supabase project, the `activities` table and four security rules, two test teachers, the Supabase helper and the security test (6 of 6 passed), and saved the database setup as `supabase/schema.sql`.

**Day 4:** built the content checker and the one automatic retry (14 automated tests), and the public read-only loading for `/a/<id>` (3 of 3 checks passed).

**Day 5:** set up automatic tests on pull requests, wrote the test set and the README, got the app deployed on Vercel in fake mode, and added the Gemini provider with fallback models after the supervisor asked groups to use a Google key. The real AI call works locally, and the test set has been run against it. Then the test set showed the AI favours the second option, so I added answer shuffling (2 more tests, 16 in total) and a prompt fix so a refine keeps new content at the same level.

**Still to come:** switch the live site to the real AI, test the Claude call once a Claude key is available, and prepare the demo.