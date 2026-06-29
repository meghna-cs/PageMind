// demo.js — Live interactive demo on the landing page

const ARTICLE_CONTEXT = `Article: "AI Energy Claims: UK Regulator Opens Probe"

The UK's Competition and Markets Authority (CMA) has opened a formal investigation into claims made by three major cloud computing companies about the environmental impact of their AI data centres. The probe, announced on Tuesday, focuses on whether energy efficiency claims made in public marketing materials are substantiated by independent data.

The companies under scrutiny — which the CMA has not yet named pending legal review — have marketed their AI infrastructure as "carbon-neutral" or "net-zero compatible." However, leaked internal documents, published by environmental nonprofit DataCentre Watch, suggest actual power usage effectiveness (PUE) ratios are significantly higher than claimed.

CMA chief executive Sarah Cardell stated that the investigation would seek to "establish a clear baseline of truth in AI environmental disclosures." The ruling is expected by Q3 2025. Fines of up to 10% of global turnover may apply if misleading claims are confirmed.`;

let demoApiKey = null;
let demoMessages = [];
let isStreaming = false;

function activateDemo() {
  const keyInput = document.getElementById("demoApiKey");
  const key = keyInput.value.trim();

  if (!key.startsWith("AIza")) {
    showDemoError("That doesn't look like a valid Gemini key. It should start with 'AIza'.");
    return;
  }

  demoApiKey = key;

  // Hide key input area
  document.getElementById("keyInputArea").style.display = "none";
  document.getElementById("demoChips").style.display = "flex";

  // Enable input
  const input = document.getElementById("demoInput");
  const sendBtn = document.getElementById("demoSendBtn");
  input.disabled = false;
  sendBtn.disabled = false;

  // Clear and show welcome
  const messagesEl = document.getElementById("demoMessages");
  messagesEl.innerHTML = "";
  addDemoMessage("ai", "I've read the article about the UK regulator's AI energy probe. Ask me anything about it, or use the chips above to get started! 👆");
}

function showDemoError(msg) {
  const area = document.getElementById("keyInputArea");
  let errEl = area.querySelector(".demo-err");
  if (!errEl) {
    errEl = document.createElement("p");
    errEl.className = "demo-err";
    errEl.style.cssText = "color: #ef9a9a; font-size: 11px; margin-top: 8px;";
    area.appendChild(errEl);
  }
  errEl.textContent = msg;
}

function addDemoMessage(role, content) {
  const messagesEl = document.getElementById("demoMessages");
  const div = document.createElement("div");
  div.className = role === "user" ? "demo-msg-user" : "demo-msg-ai";

  // Simple markdown: bullets
  const html = content
    .replace(/• (.+)/g, "<span style='display:block;padding-left:10px;position:relative'><span style='position:absolute;left:0;color:#9b94ff'>•</span>$1</span>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code style='background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:4px;font-family:monospace'>$1</code>")
    .replace(/\n/g, "<br/>");

  div.innerHTML = html;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const messagesEl = document.getElementById("demoMessages");
  const div = document.createElement("div");
  div.className = "demo-typing";
  div.id = "demoTyping";
  div.innerHTML = "<span></span><span></span><span></span>";
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("demoTyping");
  if (el) el.remove();
}

async function sendDemoPrompt(prompt) {
  if (isStreaming || !demoApiKey) return;
  document.getElementById("demoInput").value = "";
  await runDemoQuery(prompt);
}

async function sendDemo() {
  const input = document.getElementById("demoInput");
  const text = input.value.trim();
  if (!text || isStreaming || !demoApiKey) return;
  input.value = "";
  await runDemoQuery(text);
}

async function runDemoQuery(userText) {
  isStreaming = true;

  // Add user message to UI and history
  addDemoMessage("user", userText);
  demoMessages.push({ role: "user", content: userText });

  addTypingIndicator();

  const systemPrompt = `You are PageMind, an AI companion helping users understand a news article.

Article context:
---
${ARTICLE_CONTEXT}
---

Instructions:
- Answer questions based on the article above
- Be concise and specific to this article
- If asked to summarize, use exactly 3 bullet points starting with •
- Keep responses under 150 words`;

  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent";

  try {
    const response = await fetch(`${GEMINI_URL}?key=${demoApiKey}&alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Ready to help with this article." }] },
          ...demoMessages.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
      }),
    });

    removeTypingIndicator();

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      addDemoMessage("ai", `⚠️ ${err?.error?.message || "API error. Check your key."}`);
      isStreaming = false;
      return;
    }

    // Stream the response
    const aiMsgEl = addDemoMessage("ai", "");
    let fullText = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.replace("data: ", "").trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const json = JSON.parse(jsonStr);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullText += text;
            // Render with basic markdown
            const html = fullText
              .replace(/• (.+)/g, "<span style='display:block;padding-left:10px;position:relative'><span style='position:absolute;left:0;color:#9b94ff'>•</span>$1</span>")
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/`([^`]+)`/g, "<code style='background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:4px;font-family:monospace'>$1</code>")
              .replace(/\n/g, "<br/>");
            aiMsgEl.innerHTML = html + '<span style="animation:blink 0.8s step-end infinite;color:#9b94ff">▋</span>';

            const messagesEl = document.getElementById("demoMessages");
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
        } catch { /* skip */ }
      }
    }

    // Final render without cursor
    const finalHtml = fullText
      .replace(/• (.+)/g, "<span style='display:block;padding-left:10px;position:relative'><span style='position:absolute;left:0;color:#9b94ff'>•</span>$1</span>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code style='background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:4px;font-family:monospace'>$1</code>")
      .replace(/\n/g, "<br/>");
    aiMsgEl.innerHTML = finalHtml;

    demoMessages.push({ role: "assistant", content: fullText });

  } catch (err) {
    removeTypingIndicator();
    addDemoMessage("ai", `⚠️ Network error: ${err.message}`);
  }

  isStreaming = false;
}

// Add blink keyframe dynamically
const style = document.createElement("style");
style.textContent = "@keyframes blink { 50% { opacity: 0; } }";
document.head.appendChild(style);
