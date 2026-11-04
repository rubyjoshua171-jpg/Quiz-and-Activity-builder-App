# Content Generation (Back End)

**Owner:** Thandi (back end)
**Front end:** Ruby
**Last updated:** Wednesday 4 November 2026


---

## What does this part do?

A teacher types what they want ("Grade 7 photosynthesis, 10 questions"). We turn that into real quiz content.

1. We receive the teacher's request.
2. We ask the AI to write the questions, answers or cards.
3. We check the content makes sense.
4. We hand clean content to the front end.

The AI only writes **words**. It never writes code or layout. The front end's templates decide how everything looks.

---

## What we added on Day 1

Three files in the `shared/` folder. Think of them as the agreement between the back end and the front end.

**1. `shared/schemas.ts`: what each activity looks like**
A "schema" is a list of rules for what the content must contain. There is one for each activity type:

- **Multiple choice:** questions, each with 4 options, the right answer, and a short explanation
- **True or false:** statements, the answer, and a short explanation
- **Flashcards:** a front and a back for each card
- **Matching:** pairs, each with a left and a right
- **Ordering:** items, written in the **correct** order

Two things to remember:
- **Front end:** the AI does not shuffle anything. Your templates must shuffle the ordering items, and the right-hand side of matching pairs.
- Multiple choice uses one number (`correctIndex`, from 0 to 3) for the right answer, so two correct answers can't happen.

**2. `shared/generate-contract.ts`: how the app asks for content**
All AI requests go through one place, `/api/generate`.

You send:
- the activity type
- what the teacher typed
- the chat so far
- the current activity (leave it out, or send `null`, the first time)

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

## What I need from the front end

- Do the shapes work for your templates? Check matching and ordering especially.
- Is the request and error format enough for create, refine and edit?
- Send me realistic teacher requests so I can test with them.

If you want a field changed, tell me early. Changes later affect both of us.

The size limits (like 3 to 12 matching pairs) are suggestions. Push back if they don't fit.

---



