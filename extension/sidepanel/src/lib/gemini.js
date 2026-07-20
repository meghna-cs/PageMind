// gemini.js — Gemini 3.5 Flash streaming API

const MODEL = "gemini-3.5-flash";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent`;

export async function streamGemini({ apiKey, pageText, pageTitle, pageUrl, messages, onChunk, onDone, onError }) {
  const systemPrompt = `You are PageMind, an AI companion embedded in the user's browser. You help users understand and interact with webpages.

Current page: "${pageTitle}"
URL: ${pageUrl}

Page content:
---
${pageText.slice(0, 8000)}
---

Instructions:
- Answer questions based on the page content above
- Be concise, specific, and helpful
- Format responses with markdown when it helps readability
- If asked to summarize, use exactly 3 bullet points starting with •
- If the page content is insufficient to answer, say so clearly`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}&alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Understood. I'm ready to help you with this page." }] },
          ...messages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `API error ${response.status}`;
      onError(errMsg);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.replace("data: ", "").trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch {
          // skip malformed chunks
        }
      }
    }

    onDone?.();
  } catch (err) {
    onError(err.message || "Network error. Check your connection.");
  }
}

export async function getSuggestedFillValues({ apiKey, formFields, pageTitle }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const fieldList = formFields.map((f) => `- ${f.label} (type: ${f.type})`).join("\n");

  const prompt = `You are helping auto-fill a web form on the page: "${pageTitle}".

Form fields:
${fieldList}

Generate realistic placeholder values for each field. Use plausible developer/professional persona data.

Respond ONLY with a JSON array like:
[
  { "label": "field label", "value": "suggested value" },
  ...
]

No markdown, no explanation, just the JSON array.`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}
