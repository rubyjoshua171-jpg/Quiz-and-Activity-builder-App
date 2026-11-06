"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicActivity } from "@/lib/supabase/public-activity";
import type { Activity } from "@/shared/schemas";

function shuffled<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const optionClass = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-base text-gray-900";
const primaryClass = "w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white";

function Score({ score, total, onRestart }: { score: number; total: number; onRestart: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold">All done!</h2>
      <p className="text-4xl font-bold">{score} / {total}</p>
      <button onClick={onRestart} className={primaryClass}>Play again</button>
    </div>
  );
}

type Choice = { prompt: string; options: string[]; correct: number; explanation: string };

function ChoiceQuiz({ items }: { items: Choice[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return <Score score={score} total={items.length} onRestart={() => { setIndex(0); setPicked(null); setScore(0); setDone(false); }} />;
  }

  const item = items[index];
  const answered = picked !== null;

  function choose(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === item.correct) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= items.length) setDone(true);
    else { setIndex(index + 1); setPicked(null); }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Question {index + 1} of {items.length}</p>
      <h2 className="text-xl font-semibold">{item.prompt}</h2>
      {item.options.map((option, i) => {
        const style = !answered ? "" : i === item.correct ? "border-green-600 bg-green-50" : i === picked ? "border-red-600 bg-red-50" : "opacity-60";
        return <button key={i} onClick={() => choose(i)} className={`${optionClass} ${style}`}>{option}</button>;
      })}
      {answered && (
        <>
          <p className="text-sm text-gray-700">{item.explanation}</p>
          <button onClick={next} className={primaryClass}>{index + 1 >= items.length ? "See my score" : "Next"}</button>
        </>
      )}
    </div>
  );
}

function Flashcards({ cards }: { cards: { front: string; back: string }[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    return <Score score={score} total={cards.length} onRestart={() => { setIndex(0); setFlipped(false); setScore(0); setDone(false); }} />;
  }

  function rate(knew: boolean) {
    if (knew) setScore((s) => s + 1);
    if (index + 1 >= cards.length) setDone(true);
    else { setIndex(index + 1); setFlipped(false); }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Card {index + 1} of {cards.length}</p>
      <button onClick={() => setFlipped(!flipped)} className="flex min-h-40 w-full items-center justify-center rounded-2xl border border-gray-300 bg-gray-50 p-6 text-center text-xl font-semibold">
        {flipped ? cards[index].back : cards[index].front}
      </button>
      {!flipped && <p className="text-center text-sm text-gray-500">Tap the card to flip it</p>}
      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => rate(false)} className={optionClass}>Not yet</button>
          <button onClick={() => rate(true)} className={primaryClass}>I knew it</button>
        </div>
      )}
    </div>
  );
}

function Matching({ pairs }: { pairs: { left: string; right: string }[] }) {
  const rights = useMemo(() => shuffled(pairs.map((p) => p.right)), [pairs]);
  const [choices, setChoices] = useState<string[]>(pairs.map(() => ""));
  const [checked, setChecked] = useState(false);
  const score = pairs.filter((p, i) => choices[i] === p.right).length;

  if (checked) {
    return <Score score={score} total={pairs.length} onRestart={() => { setChoices(pairs.map(() => "")); setChecked(false); }} />;
  }

  return (
    <div className="space-y-4">
      {pairs.map((pair, i) => (
        <div key={i} className="space-y-1">
          <p className="font-semibold">{pair.left}</p>
          <select
            value={choices[i]}
            onChange={(e) => setChoices(choices.map((c, j) => (j === i ? e.target.value : c)))}
            className={optionClass}
          >
            <option value="">Choose…</option>
            {rights.map((right) => <option key={right} value={right}>{right}</option>)}
          </select>
        </div>
      ))}
      <button disabled={choices.some((c) => c === "")} onClick={() => setChecked(true)} className={`${primaryClass} disabled:opacity-50`}>Check my answers</button>
    </div>
  );
}

function Ordering({ items }: { items: string[] }) {
  const mixed = useMemo(() => shuffled(items), [items]);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const remaining = mixed.filter((item) => !picked.includes(item));
  const score = picked.filter((item, i) => item === items[i]).length;

  if (checked) {
    return <Score score={score} total={items.length} onRestart={() => { setPicked([]); setChecked(false); }} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Tap the items in the right order.</p>
      <ol className="list-decimal space-y-2 pl-6">
        {picked.map((item) => <li key={item}>{item}</li>)}
      </ol>
      {remaining.map((item) => (
        <button key={item} onClick={() => setPicked([...picked, item])} className={optionClass}>{item}</button>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setPicked([])} className={optionClass}>Start again</button>
        <button disabled={remaining.length > 0} onClick={() => setChecked(true)} className={`${primaryClass} disabled:opacity-50`}>Check</button>
      </div>
    </div>
  );
}

function Player({ activity }: { activity: Activity }) {
  switch (activity.type) {
    case "multiple_choice":
      return <ChoiceQuiz items={activity.questions.map((q) => ({ prompt: q.question, options: q.options, correct: q.correctIndex, explanation: q.explanation }))} />;
    case "true_false":
      return <ChoiceQuiz items={activity.statements.map((s) => ({ prompt: s.statement, options: ["True", "False"], correct: s.answer ? 0 : 1, explanation: s.explanation }))} />;
    case "flashcards":
      return <Flashcards cards={activity.cards} />;
    case "matching":
      return <Matching pairs={activity.pairs} />;
    case "ordering":
      return <Ordering items={activity.items} />;
  }
}

export default function PublicActivity({ id }: { id: string }) {
  const [activity, setActivity] = useState<Activity | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getPublicActivity(id)
      .then((result) => {
        if (!cancelled) setActivity(result);
      })
      .catch((error: unknown) => {
        console.error("Failed to load public activity", error);
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-white p-6 text-gray-900">
      {activity === undefined && <p>Loading…</p>}
      {loadError && <p>We couldn&apos;t load this activity. Check your connection and refresh the page.</p>}
      {activity === null && <p>Sorry, we couldn&apos;t find this activity. Check the link and try again.</p>}
      {activity && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{activity.title}</h1>
            <p className="text-gray-600">{activity.instructions}</p>
          </div>
          <Player activity={activity} />
        </div>
      )}
    </main>
  );
}