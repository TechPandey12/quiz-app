import { useMemo, useState, useEffect } from "react";
import { shuffle } from "../utils/shuffle";

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function QuestionCard({ q, onAnswer, disabled }) {
  // q: {question, correct_answer, incorrect_answers}
  const options = useMemo(() => {
    const items = [q.correct_answer, ...q.incorrect_answers];
    return shuffle(items).map(opt => ({ raw: opt, text: decodeHtml(opt) }));
  }, [q]);

  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct'|'wrong'|null

  useEffect(() => {
    setSelected(null); setFeedback(null);
  }, [q]);

  const handleChoose = (opt) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt.raw === q.correct_answer;
    setFeedback(isCorrect ? "correct" : "wrong");
    onAnswer?.({ isCorrect, selected: opt.raw });
  };

  return (
    <div className="question-card" aria-live="polite">
      <h2 dangerouslySetInnerHTML={{__html: decodeHtml(q.question)}} />
      <div className="options">
        {options.map((opt, idx) => {
          const isSelected = selected?.raw === opt.raw;
          const cls = [
            "option",
            isSelected ? (feedback === "correct" ? "correct" : "wrong") : ""
          ].join(" ");
          return (
            <button
              key={idx}
              className={cls}
              onClick={() => handleChoose(opt)}
              disabled={!!selected || disabled}
              dangerouslySetInnerHTML={{__html: opt.text}}
            />
          );
        })}
      </div>
    </div>
  );
}
