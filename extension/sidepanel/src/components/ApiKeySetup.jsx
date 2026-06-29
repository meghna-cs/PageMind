// ApiKeySetup.jsx — First-launch API key entry screen
import { useState } from "react";

export default function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const trimmed = key.trim();
    if (trimmed.length < 10) {
      setError("Please enter a valid Gemini API key.");
      return;
    }

    setLoading(true);
    setError("");

    // Quick validation ping
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message || "Invalid API key. Please check and try again.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Could not validate key. Check your internet connection.");
      setLoading(false);
      return;
    }

    chrome.storage.local.set({ geminiApiKey: trimmed }, () => {
      onSave(trimmed);
    });
  }

  return (
    <div className="setup-screen">
      <div className="setup-icon">🧠</div>
      <h1 className="setup-title">Welcome to PageMind</h1>
      <p className="setup-subtitle">
        Your AI companion for every webpage. To get started, you need a free Gemini API key.
      </p>

      <div className="setup-steps">
        <div className="step">
          <span className="step-num">1</span>
          <span>
            Visit{" "}
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noreferrer"
              className="link"
            >
              aistudio.google.com
            </a>
          </span>
        </div>
        <div className="step">
          <span className="step-num">2</span>
          <span>Click "Get API key" → Create API key</span>
        </div>
        <div className="step">
          <span className="step-num">3</span>
          <span>Paste it below</span>
        </div>
      </div>

      <div className="key-input-group">
        <input
          type="password"
          className="key-input"
          placeholder="Paste your Gemini API key here"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={loading || !key.trim()}
        >
          {loading ? "Checking..." : "Save & Start"}
        </button>
      </div>

      {error && <p className="setup-error">{error}</p>}

      <p className="setup-note">
        🔒 Your key is stored locally on your device and never sent anywhere except Google's API.
        Free tier: 15 requests/min, 1M tokens/day.
      </p>
    </div>
  );
}
