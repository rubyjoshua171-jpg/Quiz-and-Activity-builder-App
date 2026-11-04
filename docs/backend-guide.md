# Back End Guide (Days 2 and 3)

**Owner:** Thandi (back end)
**Front end:** Ruby
**Last updated:** Wednesday 4 November 2026

This guide explains what the back end does, how the front end uses it, and how to run it. It grows as we add more.

---

## The back end in plain words

The back end is everything the teacher and students don't see:
- the **AI route** that turns a teacher's request into an activity,
- the **database** that saves each teacher's activities,
- the **security rules** that keep one teacher's work private.

The front end only talks to two things: `POST /api/generate` (to make activities) and the Supabase helper in `lib/supabase/client.ts` (to log in, save and list).

---

## Day 2: `/api/generate`

### What it does
It receives a request, checks it, and returns either a finished activity or a friendly error.

**Fake mode** (`FAKE_MODE=true`): returns a saved sample activity for the chosen type and never calls the AI. Use this for all screen work. It's free and instant.

**Real mode** (`FAKE_MODE=false`): asks Claude to write the activity, then checks the reply against the schema for that type.

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
| `app/api/generate/route.ts` | The route: checks the request, fake mode switch, calls the AI, handles errors |
| `lib/generate/prompt.ts` | The instructions given to the AI, with a rule for each activity type |
| `lib/generate/claude.ts` | The Claude call, using the schema for the chosen type, then our own check of the reply |

### Status
- Fake mode: **working and tested** with good and bad requests.
- Real AI call: **written, not yet tested** (waiting for an API key).
- Content checker and one automatic retry: **still to build**.

---

## Day 3: database and security

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
Row-level security (RLS) is a set of rules inside the database. Even if someone gets hold of the public key, they can only reach rows they own. For `activities`, a teacher can:
- see their own activities,
- save activities in their own name only,
- edit their own activities,
- delete their own activities.

They cannot see, change or delete another teacher's work, and they cannot save something pretending to be someone else.

### The test that proves it
`scripts/test-rls.mjs` logs in as two test teachers and checks six things. All six passed on 3 November 2026:

1. Teacher 1 can save an activity
2. Teacher 1 can see their own activity
3. Teacher 2 cannot see Teacher 1's activity
4. Teacher 2 cannot edit it
5. Teacher 2 cannot delete it
6. Teacher 2 cannot save as Teacher 1

Run it with:
```
node --env-file=.env.local scripts/test-rls.mjs
```
Rerun it whenever the database rules change.

### For the front end
`lib/supabase/client.ts` is the one door for login, saving and listing. Import `supabase` from it. Because of the security rules, a teacher only ever gets their own rows back.

### `supabase/schema.sql`
This file is the written record of how the database was set up (the table and the four rules). **Whenever the database changes, the same SQL must be added to this file**, so anyone can rebuild it.

---

## Settings (`.env.local`)

Copy `.env.example` to `.env.local` and fill in the values. `.env.local` stays on your own computer and is never committed.

| Setting | Safe to share? | What it is |
|---|---|---|
| `FAKE_MODE` | Yes | `true` returns samples, `false` calls the AI |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | The address of our Supabase project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | The public key (shown as "publishable key" in Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | The secret key. Server only, never in chat or Git |
| `ANTHROPIC_API_KEY` | **No** | The AI key. Server only, never in chat or Git |
| `TEST_TEACHER1_EMAIL` and the other `TEST_TEACHER` settings | Test accounts only | Used by the security test |

---

## How to run it

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the safe values.
3. `npm run dev`
4. Open `http://localhost:3000`.

---

