// ActionChips.jsx — Context-aware suggestion chips

const PAGE_CHIPS = {
  article: [
    { label: "Summarize", prompt: "Summarize this page in exactly 3 bullet points starting with •. Be specific about this article, not generic." },
    { label: "Key Argument", prompt: "What is the author's main argument or thesis in this article?" },
    { label: "Key Facts", prompt: "What are the most important facts or statistics mentioned in this article?" },
    { label: "Bias Check", prompt: "Does this article show any bias or one-sided perspective? Explain briefly." },
  ],
  ecommerce: [
    { label: "Summarize", prompt: "Summarize this page in exactly 3 bullet points starting with •." },
    { label: "Pros & Cons", prompt: "What are the pros and cons of this product based on the page?" },
    { label: "Worth Buying?", prompt: "Based on this page, is this product worth buying? Give a quick verdict." },
    { label: "Key Specs", prompt: "List the most important specifications or features of this product." },
  ],
  github: [
    { label: "Summarize", prompt: "Summarize this page in exactly 3 bullet points starting with •." },
    { label: "What Does It Do?", prompt: "In plain English, what does this project/repo do and who is it for?" },
    { label: "Quick Start", prompt: "How do I get started with this? Give me the quickest setup path." },
    { label: "Key API", prompt: "What is the main API or interface of this project? Give a quick example." },
  ],
  docs: [
    { label: "Summarize", prompt: "Summarize this page in exactly 3 bullet points starting with •." },
    { label: "ELI5", prompt: "Explain the main concept of this page like I'm 5 years old." },
    { label: "Code Example", prompt: "Give me a practical code example based on this documentation." },
    { label: "Key Points", prompt: "What are the 3 most important things I need to know from this page?" },
  ],
  video: [
    { label: "Summarize", prompt: "Summarize this page in exactly 3 bullet points starting with •." },
    { label: "What's This?", prompt: "What is this video about based on the page information?" },
    { label: "Key Topics", prompt: "What are the main topics or sections covered in this video?" },
  ],
  stackoverflow: [
    { label: "Summarize", prompt: "Summarize this page in exactly 3 bullet points starting with •." },
    { label: "Best Answer", prompt: "What is the best solution to the question on this page? Summarize it." },
    { label: "Explain Code", prompt: "Explain the main code solution in simple terms." },
  ],
  general: [
    { label: "Summarize", prompt: "Summarize this page in exactly 3 bullet points starting with •." },
    { label: "What Is This?", prompt: "What is this page about and who is it for?" },
    { label: "Key Info", prompt: "What are the most important pieces of information on this page?" },
    { label: "Important Dates", prompt: "Are there any important dates, deadlines, or time-sensitive information on this page?" },
  ],
};

PAGE_CHIPS.social = PAGE_CHIPS.general;
PAGE_CHIPS.linkedin = PAGE_CHIPS.general;

export default function ActionChips({ pageType, hasForm, onChipClick, onFillForm, isLoading }) {
  const chips = PAGE_CHIPS[pageType] || PAGE_CHIPS.general;

  return (
    <div className="chips-container">
      <div className="chips-row">
        {chips.map((chip) => (
          <button
            key={chip.label}
            className="chip"
            onClick={() => onChipClick(chip.prompt)}
            disabled={isLoading}
          >
            {chip.label}
          </button>
        ))}
        {hasForm && (
          <button
            className="chip chip-fill"
            onClick={onFillForm}
            disabled={isLoading}
            title="AI fills all form fields on this page"
          >
            ✨ Fill Form
          </button>
        )}
      </div>
    </div>
  );
}
