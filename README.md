# learnbuilder-group-project

A web app that lets teachers create learning activities with AI. A teacher describes what they want (for example "Grade 7 photosynthesis, 10 questions, mostly easy"), sees a preview, changes it with AI or by hand, and shares a public link. Students open the link on their phone, play, and see a score, with no login.

This is Option 1 (Quiz and Activity Builder): the AI writes **content only**, as JSON, and our own screens display it. The AI never writes code or HTML.

**Live app:** https://quiz-and-activity-builder-app-teal.vercel.app (always use this main link, because every deployment also gets its own one-off link that stays on old code)

## What a teacher can do

1. Log in (or sign up).
2. Create an activity: pick a type, describe it, and press Generate.
3. Ask the AI to change it ("make question 3 harder"), or edit it by hand: change any text, add, delete and reorder items, and save.
4. See the list of their own activities.
5. Share a link. Students play it on a phone, with no login, and see a score at the end.

**Activity types:** multiple choice, true or false, flashcards, matching pairs, and put in order.

## How it works

```
Teacher's request (with their login token)
      |
      v
POST /api/generate  --- login check and hourly limit ---> the AI (Gemini)
      |                                                       |
      |                                         JSON content for the chosen type
      |                                                       |
      v                                                       v
  content checks  <-------------------------------------------+
      |
   problems?  --yes-->  send the problems back once  -->  check again
      |                                                      |
      no                                              still wrong: friendly error,
      |                                              keep the previous version
      v
  shuffle the answers (first request only)  -->  preview  -->  saved in Supabase  -->  public link /a/<id>
```

- The browser never calls the AI. Every request goes through `/api/generate`, which needs a logged-in teacher.
- On every refine, the whole current activity is sent, and the whole new version comes back.
- Only content that passes our checks reaches the teacher.

## Tech stack

| Part | Tool |
|---|---|
| App and server routes | Next.js, TypeScript |
| Screens | Plain HTML, CSS and JavaScript in `public/neuronest` (the share page is Next.js and React) |
| Login and database | Supabase (with row-level security) |
| AI | Google Gemini (a Claude version is written, but untested) |
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
4. Start the app **once**, and use a second terminal for commands:
   ```
   npm run dev
   ```
5. Open `http://localhost:3000`. It opens the screens in `public/neuronest`.

If the app says the port is in use, an old copy is still running. The app reads `.env.local` only when it starts, so restart it after changing a setting.

### Settings

| Setting | What it is |
|---|---|
| `FAKE_MODE` | `true` makes `/api/generate` return a saved sample and never call the AI. `false` uses the real AI. |
| `AI_PROVIDER` | `gemini` (the default) or `claude` |
| `GEMINI_API_KEY` | The Google AI Studio key. Server only. Never commit it or share it. |
| `GEMINI_MODEL` | Optional. Leave it empty to use the built-in models (`gemini-3.1-flash-lite`, then `gemini-3.5-flash`). Write the name without a `models/` prefix. |
| `ANTHROPIC_API_KEY` | The Claude key. Only needed if `AI_PROVIDER=claude`. Server only. |
| `GENERATE_LIMIT_PER_HOUR` | Optional. How many real AI requests one teacher may make per hour. The default is 30. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public Supabase values. Used by the test scripts. The app itself reads the same public values from `lib/supabase/config.ts` and `public/neuronest/config.js`. |
| `SUPABASE_SERVICE_ROLE_KEY` | The secret Supabase key. Server only. The app does not use it. |
| `TEST_TEACHER1_EMAIL`, `TEST_TEACHER1_PASSWORD`, `TEST_TEACHER2_EMAIL`, `TEST_TEACHER2_PASSWORD` | Two test teacher accounts, used only by the test scripts |

The public Supabase values are safe in the code because row-level security protects the data. Secret keys are never in the code.

### Database

The whole database setup (the `activities` table, the `generation_log` table for the hourly limit, the row-level security rules and the public loading function) is in `supabase/schema.sql`. Run it in the Supabase SQL Editor to rebuild the database. Any change to the database must also be added to that file.

## Tests

```
npm test
```

This runs 16 automated tests: the content checker, the retry and the answer shuffling. They also run automatically on every pull request.

Scripts (they need the test teacher settings above, and most need the app running):

| Script | What it proves |
|---|---|
| `node --env-file=.env.local scripts/test-rls.mjs` | One teacher cannot see, edit, delete or impersonate another teacher's activities (6 checks) |
| `node --env-file=.env.local scripts/test-public.mjs` | A visitor can load one activity by its link but cannot browse the table (3 checks) |
| `node --env-file=.env.local scripts/test-rate-limit.mjs` | The hourly limit refuses a request once a teacher is over it (start the app with a low `GENERATE_LIMIT_PER_HOUR` and `FAKE_MODE=false`) |
| `node --env-file=.env.local scripts/test-live-login.mjs <link>` | The route accepts a valid login token and refuses a missing one, on a local or live address |
| `node --env-file=.env.local scripts/run-test-set.mjs` | Sends the 10 realistic teacher requests to `/api/generate` (see below) |

The test set of 10 realistic teacher requests, the results of two runs on the real AI and the problems found are in `docs/test-set.md`. Rerun it whenever the prompt changes.

## Project layout

```
app/page.tsx                 opens the screens in public/neuronest
app/a/[id]/                  the public share page students play
app/api/generate/            the /api/generate route
lib/generate/                prompt, AI calls (Gemini and Claude), content checks, retry, answer shuffling
lib/auth/                    checks the login token
lib/supabase/                Supabase client, public values, and public activity loading
public/neuronest/            the teacher screens (HTML, CSS, JavaScript)
shared/                      schemas, request format and sample activities
supabase/schema.sql          the database setup
scripts/                     test scripts
docs/                        team documentation
.github/workflows/           automatic test run
```

## Main decisions

- **One schema per activity type, written once in `shared/schemas.ts`.** It is the agreement between the AI, our checks and the screens.
- **One `correctIndex` for the right answer in multiple choice.** Two correct answers are impossible by design.
- **The AI never shuffles.** The back end shuffles multiple choice options on a first generation, because the AI favoured the second option. A refine keeps the existing order.
- **AI text is always shown as plain text, never as HTML.** The checker also rejects any HTML in the content.
- **Checks plus one retry.** The checker catches sense problems (repeated options, empty text, too long, wrong counts). A failed check is sent back to the AI once, then a friendly error is shown and the previous version is kept.
- **Row-level security from the start.** A teacher can only read and change their own activities. This is tested with two accounts.
- **Public share links use one database function** that returns a single activity by its id. The table itself stays locked, so visitors cannot browse it.
- **`/api/generate` needs a login, and has an hourly limit per teacher**, so nobody can use up the free AI allowance.
- **Fake mode** so screen work never spends money or waits on the AI.
- **Two AI providers behind one switch.** Gemini is used (our supervisor asked groups to use a Google key). The Claude code is written, but has never been tested.
- **A busy or capped AI should not break a request.** The Gemini call waits and retries when the AI is busy, and falls back to a second model if the first is busy or out of free quota.
- **The Supabase script is served from our own site.** Edge's tracking protection blocked it when it was loaded from an outside website, so no login was saved.
- **Secrets stay on the server.** `.env` files are ignored by Git, and the AI and secret Supabase keys are never in the code.

## Status

**Working and tested**
- Login, generating, saving, the list of activities and the share link work on the live site and on a phone.
- Refine by chat and editing by hand were tested on a computer.
- The content checks, the retry and the answer shuffling have automated tests (16).
- Row-level security and the public share loading have test scripts. The hourly limit was tested on a computer with the limit set to 2.
- The 10-request test set ran on the real AI, on a computer and on the live site (`docs/test-set.md`).

**Not done, or not tested**
- Three extra activity types (fill in the blanks, sort into groups, crossword) are not built.
- The Claude version is written, but has never been tested.
- The prompt rule that keeps refined content at the same level has not been re-checked on the real AI.
- The full content of the live test run has not been read yet, and the isiZulu flashcards have not been checked by a speaker.
- If a teacher asks for more items than the maximum, the app makes the maximum, and only the screen says so.
- Some prototype screens still use placeholder or browser-only data (the dashboard numbers, Profile, Settings and Shared Links).

## Team

- **Back end (Thandi):** `/api/generate`, prompts, content checks, retry, shuffling, the AI providers, the database, security, login on the route, the hourly limit, connecting the screens to the back end, the share page, tests.
- **Front end (Ruby):** _(Ruby to add: the screens in `public/neuronest`, and any front end decisions)_