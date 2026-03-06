export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { role, qa } = req.body;

  const prompt = `Score this ${role} assessment. Q&A:\n${qa}\n\nReturn ONLY this JSON object with no other text: {"total_score":0,"breakdown":[{"dimension":"Domain Knowledge","score":0},{"dimension":"Problem Solving","score":0},{"dimension":"Communication","score":0},{"dimension":"Role Fit","score":0}],"strengths":["s1","s2","s3"],"recommendation":"ADVANCE","recommendation_reason":"reason"}. Fill in real scores 0-100 and real content based on the answers.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // Use Haiku — much faster than Sonnet
        max_tokens: 400,
        system: "You are an HR scorer. Respond ONLY with valid JSON. No markdown, no extra text.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = (data.content || []).map(b => b.text || "").join("").trim()
      .replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

    const parsed = JSON.parse(raw);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
