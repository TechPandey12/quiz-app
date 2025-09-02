// simple helper for Open Trivia DB
export async function fetchQuestions({ amount = 10, category, difficulty, type = "multiple", token } = {}) {
  const url = new URL("https://opentdb.com/api.php");
  url.searchParams.set("amount", amount);
  if (category) url.searchParams.set("category", category);
  if (difficulty) url.searchParams.set("difficulty", difficulty);
  if (type) url.searchParams.set("type", type);
  if (token) url.searchParams.set("token", token);
  const res = await fetch(url.toString());
  const data = await res.json(); // { response_code, results: [...] }
  return data;
}

// optionally: request a session token so questions don't repeat in a session
export async function getSessionToken() {
  const res = await fetch("https://opentdb.com/api_token.php?command=request");
  const data = await res.json(); // { response_code, token }
  return data.token;
}
