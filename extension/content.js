// content.js — Page content extractor and form filler

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_CONTENT") {
    try {
      const pageData = extractPageContent();
      sendResponse({ success: true, ...pageData });
    } catch (e) {
      sendResponse({ error: "Failed to extract page content." });
    }
    return true;
  }

  if (message.type === "DO_FILL_FORM") {
    try {
      const result = fillFormFields(message.fields);
      sendResponse({ success: true, filled: result });
    } catch (e) {
      sendResponse({ error: "Failed to fill form." });
    }
    return true;
  }
});

function extractPageContent() {
  const title = document.title || "";
  const url = window.location.href;
  const metaDescription =
    document.querySelector('meta[name="description"]')?.content || "";

  // Extract main readable text (prefer article/main content)
  let bodyText = "";
  const mainSelectors = ["article", "main", "[role='main']", ".content", "#content"];
  let mainEl = null;
  for (const sel of mainSelectors) {
    mainEl = document.querySelector(sel);
    if (mainEl) break;
  }

  if (mainEl) {
    bodyText = mainEl.innerText;
  } else {
    // Fallback: full body minus nav/footer/scripts
    const clone = document.body.cloneNode(true);
    ["script", "style", "nav", "footer", "header", "aside", "noscript"].forEach(
      (tag) => clone.querySelectorAll(tag).forEach((el) => el.remove())
    );
    bodyText = clone.innerText;
  }

  // Clean up whitespace
  bodyText = bodyText.replace(/\n{3,}/g, "\n\n").trim();

  // Detect page type for smart chips
  const pageType = detectPageType(url, title);

  // Extract form fields if present
  const formFields = extractFormFields();

  return {
    title,
    url,
    metaDescription,
    bodyText: bodyText.slice(0, 12000), // cap at 12k chars
    pageType,
    formFields,
    hasForm: formFields.length > 0,
  };
}

function detectPageType(url, title) {
  const combined = (url + " " + title).toLowerCase();

  if (/github\.com/.test(url)) return "github";
  if (/stackoverflow\.com/.test(url)) return "stackoverflow";
  if (/amazon|flipkart|myntra|shopify|shop|product|buy|cart/.test(combined))
    return "ecommerce";
  if (/youtube\.com|youtu\.be/.test(url)) return "video";
  if (/docs\.|documentation|readme|wiki|api\./.test(combined)) return "docs";
  if (/news|article|blog|post|medium\.com|substack/.test(combined)) return "article";
  if (/linkedin\.com/.test(url)) return "linkedin";
  if (/twitter\.com|x\.com/.test(url)) return "social";

  return "general";
}

function extractFormFields() {
  const fields = [];
  const inputs = document.querySelectorAll("input, textarea, select");

  inputs.forEach((el) => {
    if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;

    const label =
      el.labels?.[0]?.innerText ||
      el.placeholder ||
      el.name ||
      el.id ||
      el.getAttribute("aria-label") ||
      "";

    if (label) {
      fields.push({
        selector: getCSSSelector(el),
        label: label.trim(),
        type: el.type || el.tagName.toLowerCase(),
        name: el.name || el.id || "",
      });
    }
  });

  return fields.slice(0, 20); // cap at 20 fields
}

function getCSSSelector(el) {
  if (el.id) return `#${el.id}`;
  if (el.name) return `[name="${el.name}"]`;
  // fallback: nth-child path
  const path = [];
  let node = el;
  while (node && node !== document.body) {
    let selector = node.nodeName.toLowerCase();
    if (node.id) {
      selector = `#${node.id}`;
      path.unshift(selector);
      break;
    } else {
      let i = 1;
      let sibling = node.previousElementSibling;
      while (sibling) {
        if (sibling.nodeName === node.nodeName) i++;
        sibling = sibling.previousElementSibling;
      }
      selector += `:nth-of-type(${i})`;
    }
    path.unshift(selector);
    node = node.parentElement;
  }
  return path.join(" > ");
}

function fillFormFields(fields) {
  let filled = 0;
  fields.forEach(({ selector, value }) => {
    try {
      const el = document.querySelector(selector);
      if (!el) return;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      const nativeTextAreaSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;

      if (el.tagName === "TEXTAREA" && nativeTextAreaSetter) {
        nativeTextAreaSetter.call(el, value);
      } else if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, value);
      } else {
        el.value = value;
      }

      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      filled++;
    } catch (e) {
      // skip fields that can't be filled
    }
  });
  return filled;
}
