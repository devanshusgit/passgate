export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server.' });
  }

  try {
    const { parts } = req.body;

    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Invalid request: parts array required.' });
    }

    const PROMPT = `You are PassGate, an expert ATS resume analyzer.
Analyze the resume against the job description provided.
Return ONLY a valid JSON object — no markdown, no backticks, no explanation. Raw JSON only.

{
  "score": <number 0-100>,
  "verdict": "<PASS|PARTIAL|FAIL>",
  "summary": "<2-3 sentence plain-English verdict explaining the score>",
  "keywords_found": ["up to 12 keywords from JD present in resume"],
  "keywords_missing": ["up to 12 important JD keywords missing from resume"],
  "bullet_rewrites": [
    { "before": "<original weak bullet from resume>", "after": "<ATS-optimised rewrite with keywords naturally embedded>" }
  ],
  "action_items": ["5 specific, actionable improvements the candidate should make"]
}

Score rules: PASS if score >= 70, PARTIAL if 40-69, FAIL if below 40.
Pick the 2-3 weakest bullets to rewrite.
Return ONLY the JSON object. Nothing else.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [...parts, { text: PROMPT }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1200 }
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json();
      return res.status(geminiRes.status).json({
        error: errData?.error?.message || 'Gemini API error'
      });
    }

    const data = await geminiRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
