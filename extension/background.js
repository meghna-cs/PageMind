// background.js — Service Worker

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Set up context menu for "Explain with PageMind"
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explain-selection",
    title: "✨ Explain with PageMind",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain-selection" && info.selectionText) {
    // Store the selected text, then open the side panel
    chrome.storage.local.set(
      { pendingExplain: info.selectionText },
      () => {
        chrome.sidePanel.open({ tabId: tab.id });
      }
    );
  }
});

// Relay messages between content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_CONTENT") {
    // Forward to content script of the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "EXTRACT_CONTENT" },
          (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({ error: "Could not read this page." });
            } else {
              sendResponse(response);
            }
          }
        );
      } else {
        sendResponse({ error: "No active tab found." });
      }
    });
    return true; // keep message channel open for async response
  }

  if (message.type === "FILL_FORM") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "DO_FILL_FORM", fields: message.fields },
          (response) => {
            if (chrome.runtime.lastError) {
              sendResponse({ error: "Could not fill form on this page." });
            } else {
              sendResponse(response);
            }
          }
        );
      }
    });
    return true;
  }
});
