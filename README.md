# learnbuilder-group-project

A web app that lets teachers create learning activities with AI. A teacher describes what they want (for example "Grade 7 photosynthesis, 10 questions, mostly easy"), sees a live preview, refines it, and shares a public link. Students open the link on their phone, play, and see a score, with no login.

This is Option 1 (Quiz and Activity Builder): the AI writes **content only**, as JSON, and our own templates display it. The AI never writes code or HTML.

**Live app:** _(add the link once it is deployed)_

## Activity types

Multiple choice, true or false, flashcards, matching pairs, and put in order.

## How it works

```
Teacher's request
      |
      v
POST /api/generate  --->  Claude (claude-sonnet-5-5)
      |                        |
      |                  JSON content for the chosen type
      |                        |
      v                        v
  content checks  <------------+
      |
   problems?  --yes-->  send the problems back once  -->  check again
      |                                                      |
      no                                              still wrong: friendly error,
      |                                              keep the previous version
      v
  template shows the preview  -->  saved in Supabase  -->  public link /a/<id>
```

- The browser never calls the AI. Every request goes through `/api/generate`.
- On every refine, the whole current activity is sent, and the whole new version comes back.
- Only content that passes our checks reaches the teacher.

## Tech stack

| Part | Tool |
|---|---|
| App and server function | Next.js, TypeScript |
| Login and database | Supabase (with row-level security) |
| AI | Claude API, `claude-sonnet-5-5` |
| Content shapes and validation | Zod |
| Tests | Vitest, run automatically by GitHub Actions |
| Hosting | Vercel |

## Run it locally

1. Install Node.js (version 24 or newer).
2. Install the packages:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in the values (see the table below). `.env.local` is never committed.
4. Start the app:
   ```
   npm run dev
   ```
5. Open `http://localhost:3000`.

### Settings

| Setting | What it is |
|---|---|
| `FAKE_MODE` | `true` makes `/api/generate` return a saved sample and never call the AI. Use it for all screen work. |
| `NEXT_PUBLIC_SUPABASE_URL` | The address of the Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public (publishable) Supabase key. It is safe in the browser because row-level security protects the data. |
| `SUPABASE_SERVICE_ROLE_KEY` | The secret Supabase key. Server only. Never commit it or share it. |
| `ANTHROPIC_API_KEY` | The AI key. Server only. Never commit it or share it. |
| `TEST_TEACHER1_EMAIL`, `TEST_TEACHER1_PASSWORD`, `TEST_TEACHER2_EMAIL`, `TEST_TEACHER2_PASSWORD` | Two test teacher accounts, used only by the security test scripts |

### Database

The whole database setup (the `activities` table, the row-level security rules and the public loading function) is in `supabase/schema.sql`. Run it in the Supabase SQL Editor to rebuild the database. Any change to the database must also be added to that file.

## Tests

```
npm test
```

This runs the content checker tests and the retry tests. They also run automatically on every pull request.

Two extra scripts check the database security. They need the test teacher settings above:

```
node --env-file=.env.local scripts/test-rls.mjs
node --env-file=.env.local scripts/test-public.mjs
```

The first proves that one teacher cannot see, edit, delete or impersonate another teacher's activities. The second proves that a visitor can load one activity by its link but cannot browse the table.

The test set of 10 realistic teacher requests is in `docs/test-set.md`. Run it with `node scripts/run-test-set.mjs` (with the app running and `FAKE_MODE=false`), and rerun it whenever the prompt changes.

## Project layout

```
app/                     screens, templates and the share page (front end)
app/api/generate/        the /api/generate route
lib/generate/            prompt, Claude call, content checks, retry
lib/supabase/            Supabase client and public activity loading
shared/                  schemas, request format and sample activities
supabase/schema.sql      the database setup
scripts/                 security tests and the test set runner
docs/                    team documentation
.github/workflows/       automatic test run
```

## Main decisions

- **One schema per activity type, written once in `shared/schemas.ts`.** It is the agreement between the AI, our checks and the templates.
- **One `correctIndex` for the right answer in multiple choice.** Two correct answers are impossible by design.
- **The AI never shuffles.** Ordering items and matching pairs arrive in the correct order, and the templates shuffle them.
- **AI text is always shown as plain text, never as HTML.** The checker also rejects any HTML in the content.
- **Checks plus one retry.** The schema guarantees the shape, and our checks catch sense problems (repeated options, empty text, too long, wrong counts). A failed check is sent back to the AI once, then a friendly error is shown and the previous version is kept.
- **Row-level security from the start.** A teacher can only read and change their own activities. This is tested with two accounts.
- **Public share links use one database function** that returns a single activity by its id. The table itself stays locked, so visitors cannot browse it.
- **Fake mode** so screen work never spends money or waits on the AI.
- **Secrets stay on the server.** `.env` files are ignored by Git, and the AI and secret Supabase keys are never in browser code.

## Status

- Working and tested: fake mode, content checks, retry logic (tested with a simulated AI), row-level security, public activity loading.
- Written but not yet tested with the real AI: the Claude call and the retry with real replies.
- Still to do: deployment, the full test set run with the real AI.

## Team

- **Back end (Thandi):** `/api/generate`, prompts, content checks, retry, database, security, tests.
- **Front end (Ruby):** _(Ruby to add: screens, templates, share page, and any front end decisions)_