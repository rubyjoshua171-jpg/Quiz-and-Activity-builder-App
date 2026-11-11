# Test Set: 10 Teacher Requests

**Owner:** Thandi (back end)
**Last updated:** Wednesday 11 November 2026

This is the list of realistic teacher requests we run against `/api/generate`. **Rerun it whenever the prompt changes**, and record what happened.

## How to run it

The script logs in as the first test teacher (it needs the `TEST_TEACHER1_...` settings in `.env.local`), sends the 10 requests one after another, prints one line for each, and saves the full answers to `test-set-output.json` (ignored by Git).

**On my computer**
1. Set `FAKE_MODE=false` in `.env.local`. Fake mode returns the same saved sample every time, so it cannot tell us anything about the prompts.
2. Start the app once with `npm run dev`.
3. In a second terminal: `node --env-file=.env.local scripts/run-test-set.mjs`
4. Rename the results file, so the next run does not replace it, and set `FAKE_MODE=true` again.

**On the live site**
```
$env:BASE_URL="https://quiz-and-activity-builder-app-teal.vercel.app"
node --env-file=.env.local scripts/run-test-set.mjs
Remove-Item Env:BASE_URL
```
This uses the live site's real AI allowance, so run it once.

## The requests

| # | Type | Request | What we are checking |
|---|---|---|---|
| 1 | Multiple choice | Grade 7 photosynthesis, 10 questions, mostly easy | Exactly 10 questions, 4 options each, one correct answer, easy level |
| 2 | True or false | Grade 5 the water cycle, 8 statements, a mix of true and false | 8 statements, both true and false answers, short explanations |
| 3 | Flashcards | Grade 9 life sciences: key vocabulary for cell biology, 12 cards | 12 cards, short fronts and backs, no repeats |
| 4 | Matching | Grade 8 match chemical elements to their symbols, 8 pairs | 8 pairs, every right side different, correct pairings |
| 5 | Ordering | Grade 6 the steps of making a paper aeroplane, 6 steps | 6 items, in the correct order, no repeats |
| 6 | Multiple choice | 5 questions from these notes: "Fractions show parts of a whole. The top number is the numerator. The bottom number is the denominator. To add fractions with the same denominator, add the numerators and keep the denominator." | Questions use the pasted notes, not outside facts |
| 7 | Multiple choice | something about history | A vague request: does it produce something sensible, or a friendly error? |
| 8 | Multiple choice | 60 questions on algebra | More than the allowed maximum (30): does the app stay within limits or fail gracefully? |
| 9 | Multiple choice | Make question 3 harder and add two more questions (refining the activity from test 1) | Question 3 changes, 2 questions added, the rest unchanged and at the same level |
| 10 | Flashcards | Grade 4 isiZulu greetings, 6 cards | A non-English request: does it work, and are the cards correct? |

## Run 1: 5 November 2026, real AI (Gemini) on my computer

All 10 requests ran without errors, and I read the answers (not just the status lines).

| # | Result | What the app did | Problems found | Fixed? |
|---|---|---|---|---|
| 1 | OK | 10 questions, "Photosynthesis Basics" | None. Answers checked and correct. But most right answers were option 2 (see test 8) | Yes: the back end now shuffles the options on a first request |
| 2 | OK | 8 statements, "Water Cycle Facts" (4 true, 4 false) | None. Answers checked and correct | N/A |
| 3 | OK | 12 cards, "Cell Biology Basics" | None. Content checked and correct | N/A |
| 4 | OK | 8 pairs, "Chemical Elements and Symbols" | None. All 8 symbols correct | N/A |
| 5 | OK | 6 steps, "Making a paper aeroplane" | None. Order looks sensible | N/A |
| 6 | OK | 5 questions, "Understanding Fractions" | Four questions come from the pasted notes. Question 5 is a new example (1/4 + 2/4) that applies the notes' rule correctly | N/A |
| 7 | OK | Vague request: chose "Ancient Civilizations" and made 3 questions | Gave a sensible result instead of asking what was meant | N/A |
| 8 | OK | Asked for 60, made 30 (our maximum), "Algebra Basics" | The teacher was not told it was capped. 17 of 30 right answers were option 2. The questions were very repetitive | Partly: the shuffle was added, and the screen now shows a notice when the number of items differs from the number asked for (added after this run) |
| 9 | OK | Refined test 1: question 3 made harder, 2 added (12 in total) | The 2 new questions were too advanced for Grade 7 | Prompt rule added (new items must match the level of the existing ones). Not yet checked against the real AI |
| 10 | OK | 6 cards, "isiZulu Greetings" | None found. Not confirmed by an isiZulu speaker | N/A |

## Run 2: 11 November 2026, live site, real AI (Gemini)

All 10 requests ran without errors. For this run I recorded the item counts, which all match what was asked (or our limits). I have **not** read the full content of this run yet.

| # | Result | What the app did | Problems found | Fixed? |
|---|---|---|---|---|
| 1 | OK | 10 questions, "Photosynthesis Basics" | Count correct. Content not yet read | |
| 2 | OK | 8 statements, "The Water Cycle" | Count correct. Content not yet read | |
| 3 | OK | 12 cards, "Cell Biology Basics" | Count correct. Content not yet read | |
| 4 | OK | 8 pairs, "Chemical Elements and Symbols" | Count correct. Pairings not yet read | |
| 5 | OK | 6 steps, "Making a paper aeroplane" | Count correct. Order not yet read | |
| 6 | OK | 5 questions, "Understanding Fractions" | Count correct. Not yet checked that it only uses the pasted notes | |
| 7 | OK | Vague request: made 3 questions, "Ancient Civilizations" | Sensible result, and the same behaviour as Run 1 | |
| 8 | OK | Asked for 60, made 30 (our maximum), "Algebra Basics" | Capped at 30 again. The API itself still does not say so (the screen shows a notice) | |
| 9 | OK | Refined test 1: 12 questions (10 plus 2), "Photosynthesis Basics" | Count correct. Not yet checked whether the 2 new questions are Grade 7 level | |
| 10 | OK | 6 cards, "isiZulu Greetings" | Count correct. Not yet confirmed by an isiZulu speaker | |

## A run that does not count

On 11 November I also ran the script on my computer with `FAKE_MODE` on. Every request returned the saved sample for its type (3 items each, with titles like "Photosynthesis basics" and "Plant vocabulary"), whatever the request said. That only shows the route works in fake mode, so it is not recorded as a result.

## Notes

- Tests 7 and 8 are meant to be awkward. A friendly error is an acceptable result, but a crash, an empty activity or content that breaks a rule is not.
- Test 9 only means something if test 1 worked, because it refines test 1's result.
- Read the content, not just the status. The checker catches structure problems (repeated options, empty text, wrong counts), but not factual mistakes. A person must check the answers are correct.
- Still to do: read the content of Run 2, especially test 9 (are the new questions Grade 7 level?), and ask an isiZulu speaker to check test 10.