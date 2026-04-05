export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Groq API key not configured on server.' });
  }

  try {
    const { resumeText, resumeImage, resumeImageMime, jobDescription } = req.body;

    if ((!resumeText && !resumeImage) || !jobDescription) {
      return res.status(400).json({ error: 'Resume and job description are required.' });
    }

    const ANALYSIS_PROMPT = `You are PassGate, an expert ATS resume analyzer.
Analyze the resume against the job description below and return ONLY a valid JSON object — no markdown, no backticks, no explanation.

JOB DESCRIPTION:
${jobDescription}

Return ONLY this exact JSON structure:
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
Pick the 2-3 weakest bullets to rewrite. Return ONLY the JSON object. Nothing else.`;

    let model;
    let messages;

    if (resumeImage) {
      // Vision model for scanned images / photos of resumes
      model = 'llama-3.2-11b-vision-preview';
      messages = [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${resumeImageMime};base64,${resumeImage}` }
          },
          {
            type: 'text',
            text: `The image above is a resume.\n\n${ANALYSIS_PROMPT}`
          }
        ]
      }];
    } else {
      // Fast text model for DOCX / PDF text
      model = 'llama-3.3-70b-versatile';
      messages = [{
        role: 'user',
        content: `RESUME:\n${resumeText}\n\n${ANALYSIS_PROMPT}`
      }];
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    if (!groqRes.ok) {
      const errData = await groqRes.json();
      return res.status(groqRes.status).json({
        error: errData?.error?.message || 'Groq API error'
      });
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
