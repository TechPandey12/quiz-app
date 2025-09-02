import { useCallback, useEffect, useState } from "react";
import Timer from "../components/Timer";
import QuestionCard from "../components/QuestionCard";
import useLocalStorage from "../hooks/useLocalStorage";
import { fetchQuestions, getSessionToken } from "../api/opentdb";

const PER_QUESTION_SECONDS = 20;
const SCORE_FOR_CORRECT = 10;

export default function QuizPage() {
  // 🔹 Quiz states
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [quizOver, setQuizOver] = useState(false);
  const [token, setToken] = useState(null);
  const [resetTimerKey, setResetTimerKey] = useState(0);

  // 🔹 New start screen states
  const [difficulty, setDifficulty] = useState("easy");
  const [category, setCategory] = useState("");
  const [started, setStarted] = useState(false);

  // 🔹 Review answers
  const [review, setReview] = useState([]);

  // 🔹 Leaderboard in localStorage
  const [leaderboard, setLeaderboard] = useLocalStorage("quiz_leaderboard_v1", []);

  // ✅ Handle user answer
  const handleAnswer = useCallback(
    ({ isCorrect, selected }) => {
      if (isCorrect) {
        setScore((s) => s + SCORE_FOR_CORRECT);
        new Audio("/correct.mp3").play().catch(() => {}); // optional sound
      } else {
        new Audio("/wrong.mp3").play().catch(() => {}); // optional sound
      }

      // Save review
      setReview((r) => [
        ...r,
        {
          question: questions[idx].question,
          correct: questions[idx].correct_answer,
          chosen: selected,
        },
      ]);

      // Move to next question after delay
      setTimeout(() => {
        const next = idx + 1;
        if (next >= questions.length) {
          setQuizOver(true);
        } else {
          setIdx(next);
          setResetTimerKey((k) => k + 1);
        }
      }, 900);
    },
    [idx, questions]
  );

  // ✅ Handle timer expiry (countdown runs out)
  const onTimerExpire = useCallback(() => {
    setReview((r) => [
      ...r,
      {
        question: questions[idx].question,
        correct: questions[idx].correct_answer,
        chosen: null,
      },
    ]);

    setTimeout(() => {
      const next = idx + 1;
      if (next >= questions.length) setQuizOver(true);
      else {
        setIdx(next);
        setResetTimerKey((k) => k + 1);
      }
    }, 300);
  }, [idx, questions]);

  // ✅ Save score to leaderboard
  const saveScore = (name) => {
    const entry = {
      name: name || "Anonymous",
      score,
      date: new Date().toISOString(),
    };
    setLeaderboard((prev) => {
      const next = [entry, ...prev].sort((a, b) => b.score - a.score).slice(0, 10);
      return next;
    });
  };

  // ✅ Start screen
  if (!started) {
    return (
      <div className="start-screen">
        <h1>Welcome to the Quiz 🎉</h1>

        <label>
          Difficulty:
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>

        <label>
          Category:
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Any</option>
            <option value="9">General Knowledge</option>
            <option value="21">Sports</option>
            <option value="17">Science & Nature</option>
            <option value="23">History</option>
            <option value="18">Computers</option>
            <option value="22">Geography</option>
            <option value="11">Film</option>
            <option value="12">Music</option>
            <option value="27">Animals</option>
          </select>
        </label>

        <button
          onClick={async () => {
            setLoading(true);
            const t = await getSessionToken();
            setToken(t);
            const r = await fetchQuestions({
              amount: 10,
              type: "multiple",
              token: t,
              difficulty,
              category,
            });
            setQuestions(r.results || []);
            setIdx(0);
            setScore(0);
            setQuizOver(false);
            setReview([]);
            setResetTimerKey((k) => k + 1);
            setLoading(false);
            setStarted(true);
          }}
        >
          Start Quiz
        </button>
      </div>
    );
  }

  // ✅ Loading / no questions
  if (loading) return <div>Loading questions…</div>;
  if (!questions.length) return <div>No questions found.</div>;

  // ✅ End of quiz: show results + leaderboard + review
  if (quizOver) {
    return (
      <div className="results">
        <h2>Your score: {score}</h2>
        <SaveScoreForm onSave={saveScore} />
        <Leaderboard data={leaderboard} />

        <h2>Review</h2>
        <ul>
          {review.map((r, i) => (
            <li key={i}>
              <strong dangerouslySetInnerHTML={{ __html: r.question }} /> <br />
              ✅ Correct: {r.correct} <br />
              ❌ You chose: {r.chosen || "No answer"}
            </li>
          ))}
        </ul>

        <button onClick={() => window.location.reload()}>Play again</button>
      </div>
    );
  }

  // ✅ Active quiz screen
  const q = questions[idx];
  return (
    <main className="quiz-page">
      <header>
        <h1>Quiz</h1>
        <div>Question {idx + 1} / {questions.length}</div>
        <div>Score: {score}</div>
      </header>

      <Timer
        seconds={PER_QUESTION_SECONDS}
        running={true}
        onExpire={onTimerExpire}
        resetKey={resetTimerKey}
      />

      <QuestionCard q={q} onAnswer={handleAnswer} />

      <footer>
        <progress value={idx + 1} max={questions.length}></progress>
      </footer>
    </main>
  );
}

/* -----------------
   Small helper components
------------------ */

function SaveScoreForm({ onSave }) {
  const [name, setName] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(name);
      }}
    >
      <label>
        Save your score:
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </label>
      <button type="submit">Save</button>
    </form>
  );
}

function Leaderboard({ data }) {
  if (!data || !data.length) return <div>No leaderboard entries yet.</div>;
  return (
    <aside className="leaderboard">
      <h3>Top scores</h3>
      <ol>
        {data.map((r, i) => (
          <li key={i}>
            {r.name} — {r.score}{" "}
            <small>({new Date(r.date).toLocaleString()})</small>
          </li>
        ))}
      </ol>
    </aside>
  );
}
