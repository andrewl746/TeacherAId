// ── config.js ────────────────────────────────────────────────
// PASTE YOUR CLOUDFLARE WORKER URL HERE after deploying claude-proxy-worker.js
const CLAUDE_PROXY_URL = 'https://teacheraid.andrewli746.workers.dev';

// ── Claude API call (goes through your Cloudflare Worker) ────
async function callClaude(prompt, maxTokens = 1000) {
  const res = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Claude proxy error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return text;
}

// Parse JSON from Claude response safely
function parseClaudeJSON(text) {
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ── AI: Classify a student submission ───────────────────────
// Language-agnostic — works for Python, C++, Java, math, anything
async function classifySubmission({ subject, concept, prompt, codeSnippet, correctAnswer, studentAnswer, studentReasoning }) {
  const text = await callClaude(`You are an expert educator. Evaluate this student's response.

  Subject: ${subject || 'General'}
  Concept: ${concept || 'general'}
  Question: ${prompt}
  ${codeSnippet ? `Supporting Material:\n${codeSnippet}\n` : ''}
  ${expectedReasoning ? `Expected Reasoning: ${expectedReasoning}\n` : ''}
  Correct Answer: ${correctAnswer}
  Student Answer: ${studentAnswer}
  Student Reasoning: ${studentReasoning}
  
  Important rules:
  - If the student's answer is correct AND their reasoning is mathematically or logically valid, set isCorrect to true and misconception to null — even if they phrased it differently from the expected approach.
  - Only flag a misconception if the reasoning contains a genuine conceptual error, not just a different but valid method.
  - Do not invent misconceptions for correct reasoning.
  
  Analyze the student's understanding and respond ONLY with valid JSON (no markdown, no backticks):
  {
    "isCorrect": true or false,
    "misconception": "Short label for the main misconception if wrong, or null if correct",
    "analysis": "1-2 sentences explaining what the student got right or wrong and why",
    "reasoningPattern": "Describe the student's thinking pattern — what mental model are they using?",
    "strength": "One thing the student demonstrated understanding of, or null",
    "confidence": 0.0 to 1.0,
    "evidence": ["quote or paraphrase from student reasoning that supports your classification"]
  }`);
  
  return parseClaudeJSON(text);
}

// ── AI: Generate a question ──────────────────────────────────
async function generateQuestion({ subject, concept, difficulty, questionType, feedbackHistory, weakestConcept }) {
  const fbCtx = feedbackHistory?.length
    ? `\n\nApply this teacher feedback from previous generations:\n${feedbackHistory.map((f,i)=>`${i+1}. ${f}`).join('\n')}`
    : '';
  const weakCtx = weakestConcept && weakestConcept.toLowerCase() !== (concept||'').toLowerCase()
    ? `\n\nNote: Analytics show the class is weakest at "${weakestConcept}". If possible, incorporate that into this question.`
    : '';

  const text = await callClaude(`You are an expert ${subject || 'programming'} teacher for Grade 10 students. Generate a diagnostic question targeting: "${concept}".
Difficulty: ${difficulty || 'medium'}
Question type: ${questionType || 'predict_output'}${fbCtx}${weakCtx}

The question should require students to explain their reasoning, not just give an answer.

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "prompt": "The question text",
  "codeSnippet": "Code if applicable (use \\n for newlines), or null",
  "correctAnswer": "The concise correct answer",
  "concept": "${concept}",
  "subject": "${subject || 'Programming'}"
}`);
  return parseClaudeJSON(text);
}

// ── AI: Generate class insights ──────────────────────────────
async function generateClassInsights(submissions, questions) {
  if (!submissions.length) return null;
  const summary = submissions.map(s =>
    `Student: ${s.studentName}, Q: ${s.questionPrompt||'?'}, Correct: ${s.isCorrect}, Misconception: ${s.misconception||'none'}, Analysis: ${s.analysis||''}`
  ).join('\n');

  const text = await callClaude(`You are an expert educator reviewing class performance data.

Here are student submissions:
${summary}

Generate a class insights report. Respond ONLY with valid JSON (no markdown):
{
  "topMisconceptions": [{"misconception": "...", "concept": "...", "count": N, "trend": "persistent|recurring|emerging"}],
  "suggestedReteachTopics": ["...","...","..."],
  "teacherSummary": "2-3 sentence paragraph summarizing class performance and what to do next",
  "weakestConcept": "the single concept the class struggles most with"
}`);
  return parseClaudeJSON(text);
}

// ── AI: Generate student insights ───────────────────────────
async function generateStudentInsights(studentName, submissions) {
  if (!submissions.length) return null;
  const summary = submissions.map(s =>
    `Q: ${s.questionPrompt||'?'}, Correct: ${s.isCorrect}, Misconception: ${s.misconception||'none'}, Analysis: ${s.analysis||''}`
  ).join('\n');

  const text = await callClaude(`You are an expert educator reviewing one student's performance.

Student: ${studentName}
Submissions:
${summary}

Generate a student insights report. Respond ONLY with valid JSON (no markdown):
{
  "recurringMisconceptions": [{"misconception": "...", "concept": "...", "count": N, "trend": "recurring|new"}],
  "suggestedInterventions": ["...","...","..."],
  "teacherSummary": "2-3 sentence paragraph about this student's understanding and what help they need",
  "strengths": ["..."]
}`);
  return parseClaudeJSON(text);
}
