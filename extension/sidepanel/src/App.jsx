// App.jsx — Main chat interface
import { useState, useEffect, useRef, useCallback } from "react";
import ApiKeySetup from "./components/ApiKeySetup";
import ChatMessage from "./components/ChatMessage";
import ActionChips from "./components/ActionChips";
import { streamGemini, getSuggestedFillValues } from "./lib/gemini";

export default function App() {
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true); // initial load
  const [pageData, setPageData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [fillStatus, setFillStatus] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamingContentRef = useRef("");

  // Load API key and check for pending explain from context menu
  useEffect(() => {
    chrome.storage.local.get(["geminiApiKey", "pendingExplain"], (result) => {
      if (result.geminiApiKey) {
        setApiKey(result.geminiApiKey);
      }
      setLoading(false);

      // Handle explain from context menu
      if (result.pendingExplain) {
        chrome.storage.local.remove("pendingExplain");
        // Will be handled after page data loads
        sessionStorage.setItem("pendingExplain", result.pendingExplain);
      }
    });
  }, []);

  // Load page content when API key is ready
  useEffect(() => {
    if (!apiKey) return;
    loadPageContent();
  }, [apiKey]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadPageContent() {
    setPageLoading(true);
    setPageError(null);

    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_PAGE_CONTENT" }, (response) => {
        setPageLoading(false);
        if (chrome.runtime.lastError || !response || response.error) {
          setPageError(response?.error || "Could not read this page.");
          resolve(null);
          return;
        }
        setPageData(response);

        // Handle pending explain from context menu
        const pending = sessionStorage.getItem("pendingExplain");
        if (pending) {
          sessionStorage.removeItem("pendingExplain");
          setTimeout(() => {
            sendMessage(
              `Explain this selected text in simple terms, in the context of this page:\n\n"${pending}"`,
              response
            );
          }, 500);
        }

        resolve(response);
      });
    });
  }

  async function sendMessage(text, overridePageData) {
    if (isStreaming || (!text.trim() && !overridePageData)) return;

    const messageText = text.trim();
    if (!messageText) return;

    const currentPage = overridePageData || pageData;

    // Add user message
    const newMessages = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Add empty assistant message to stream into
    const assistantIndex = newMessages.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    streamingContentRef.current = "";

    await streamGemini({
      apiKey,
      pageText: currentPage?.bodyText || "",
      pageTitle: currentPage?.title || "",
      pageUrl: currentPage?.url || "",
      messages: newMessages,
      onChunk: (chunk) => {
        streamingContentRef.current += chunk;
        const captured = streamingContentRef.current;
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = { role: "assistant", content: captured };
          return updated;
        });
      },
      onDone: () => {
        setIsStreaming(false);
        inputRef.current?.focus();
      },
      onError: (err) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: "assistant",
            content: `⚠️ ${err}`,
          };
          return updated;
        });
        setIsStreaming(false);
      },
    });
  }

  async function handleFillForm() {
    if (!pageData?.formFields?.length) return;
    setFillStatus("analyzing");

    try {
      const suggestions = await getSuggestedFillValues({
        apiKey,
        formFields: pageData.formFields,
        pageTitle: pageData.title,
      });

      // Map suggestions back to selectors
      const fields = suggestions.map((s) => {
        const field = pageData.formFields.find(
          (f) => f.label.toLowerCase() === s.label.toLowerCase()
        );
        return field ? { selector: field.selector, value: s.value } : null;
      }).filter(Boolean);

      chrome.runtime.sendMessage(
        { type: "FILL_FORM", fields },
        (response) => {
          if (response?.success) {
            setFillStatus(`Filled ${response.filled} field${response.filled !== 1 ? "s" : ""}!`);
          } else {
            setFillStatus("Could not fill form on this page.");
          }
          setTimeout(() => setFillStatus(null), 3000);
        }
      );
    } catch (e) {
      setFillStatus("Error generating fill values.");
      setTimeout(() => setFillStatus(null), 3000);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function clearChat() {
    setMessages([]);
    loadPageContent();
  }

  function changeApiKey() {
    chrome.storage.local.remove("geminiApiKey", () => {
      setApiKey(null);
      setMessages([]);
      setPageData(null);
    });
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading PageMind...</p>
      </div>
    );
  }

  if (!apiKey) {
    return <ApiKeySetup onSave={setApiKey} />;
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="header-icon">🧠</span>
          <span className="header-title">PageMind</span>
        </div>
        <div className="header-actions">
          {messages.length > 0 && (
            <button className="icon-btn" onClick={clearChat} title="Clear chat & refresh page">
              🔄
            </button>
          )}
          <button className="icon-btn" onClick={changeApiKey} title="Change API key">
            🔑
          </button>
        </div>
      </header>

      {/* Page status bar */}
      {pageData && (
        <div className="page-bar">
          <span className="page-type-badge">{pageData.pageType}</span>
          <span className="page-title-text" title={pageData.url}>
            {pageData.title?.slice(0, 40) || "Untitled page"}
          </span>
        </div>
      )}

      {pageLoading && (
        <div className="page-loading-bar">
          <div className="bar-inner" />
          Reading page...
        </div>
      )}

      {pageError && (
        <div className="page-error">
          ⚠️ {pageError}
          <button onClick={loadPageContent} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 && !pageLoading && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p className="empty-title">Ask anything about this page</p>
            <p className="empty-sub">Use the chips below or type your question</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Fill status toast */}
      {fillStatus && (
        <div className={`fill-toast ${fillStatus.includes("!") ? "fill-success" : "fill-error"}`}>
          {fillStatus === "analyzing" ? "🔍 Analyzing form fields..." : fillStatus}
        </div>
      )}

      {/* Action chips */}
      {pageData && (
        <ActionChips
          pageType={pageData.pageType}
          hasForm={pageData.hasForm}
          onChipClick={(prompt) => sendMessage(prompt)}
          onFillForm={handleFillForm}
          isLoading={isStreaming || fillStatus === "analyzing"}
        />
      )}

      {/* Input area */}
      <div className="input-area">
        <textarea
          ref={inputRef}
          className="message-input"
          placeholder="Ask anything about this page..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreaming}
        />
        <button
          className={`send-btn ${isStreaming ? "sending" : ""}`}
          onClick={() => sendMessage(input)}
          disabled={isStreaming || !input.trim()}
          title="Send (Enter)"
        >
          {isStreaming ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}
