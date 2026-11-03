# Content Generation (role 2)

**Owner:** Thandi, Role 2
**Last updated:** Monday 2 November 2026 (Day 1)

---

## What does Role 2 do?

A teacher types what they want ("Grade 7 photosynthesis, 10 questions"). We turn that into real quiz content.

1. We receive the teacher's request.
2. We ask the AI to write the questions, answers or cards.
3. We check the content makes sense.
4. We hand clean content to the rest of the app.

The AI only writes **words**. It never writes code or layout. Your templates decide how everything looks.

---

## What we added today

Three files in the `shared/` folder. Think of them as an agreement between Teams 2, 3 and 4.

**1. `shared/schemas.ts`: what each activity looks like**
A "schema" is a list of rules for what the content must contain. There is one for each activity type:

- **Multiple choice:** questions, each with 4 options, the right answer, and a short explanation
- **True or false:** statements, the answer, and a short explanation
- **Flashcards:** a front and a back for each card
- **Matching:** pairs, each with a left and a right
- **Ordering:** items, written in the **correct** order

Two things to remember:
- **Team 3:** the AI does not shuffle anything. Your templates must shuffle the ordering items, and the right-hand side of matching pairs.
- Multiple choice uses one number (`correctIndex`, from 0 to 3) for the right answer, so two correct answers can't happen.

**2. `shared/generate-contract.ts`: how the app asks for content**
All AI requests go through one place, `/api/generate`.

You send:
- the activity type
- what the teacher typed
- the chat so far
- the current activity (empty the first time)

You get back one of two things:
- **Success:** the whole new activity
- **Failure:** a friendly error message, ready to show the teacher. Keep showing the previous version.

**3. `shared/samples.ts`: ready-made examples**
One sample activity for each type. Use these while building screens, so we don't call the AI (and spend money) during interface work.

```ts
import { SAMPLES } from "../shared/samples";
const demo = SAMPLES.multiple_choice;
```

---
