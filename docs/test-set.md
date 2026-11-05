# Test Set: 10 Teacher Requests

**Owner:** Thandi (back end)
**Last updated:** Wednesday 4 November 2026

This is the list of realistic teacher requests we run against `/api/generate`. **Rerun it whenever the prompt changes**, and record what happened.

## How to run it

1. Start the app: `npm run dev`
2. Set `FAKE_MODE=false` in `.env.local` (and restart the app), because fake mode returns the same sample every time, so it can't tell us anything about the prompts.
3. In a second terminal: `node scripts/run-test-set.mjs`
4. Copy the results into the table below, and set `FAKE_MODE=true` again afterwards.

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
| 9 | Multiple choice | Make question 3 harder and add two more questions (refining the activity from test 1) | Question 3 changes, 2 questions added, the rest unchanged |
| 10 | Flashcards | Grade 4 isiZulu greetings, 6 cards | A non-English request: does it work, and are the cards correct? |

## Results

Fill this in after each run. Record the date, and what the app actually did.

| # | Date | Result (OK / error) | What the app did | Problems found | Fixed? |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |
| 8 | | | | | |
| 9 | | | | | |
| 10 | | | | | |

## Notes

- Tests 7 and 8 are meant to be awkward. A friendly error is an acceptable result, but a crash, an empty activity or content that breaks a rule is not.
- Test 9 only means something if test 1 worked, because it refines test 1's result.
- Read the content, not just the status. The checker catches structure problems (repeated options, empty text, wrong counts), but not factual mistakes. A person must check the answers are correct.
- The real AI has not been run against this set yet (no API key at the time of writing).