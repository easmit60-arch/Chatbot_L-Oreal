/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

// secrets.js can define window.LOCAL_CONFIG for local development only.
const localConfig = window.LOCAL_CONFIG || {};
const WORKER_URL =
  localConfig.WORKER_URL || "https://YOUR-WORKER-URL.workers.dev";

// The conversation history is sent on every request to keep context.
const messages = [
  {
    role: "system",
    content:
      "You are a helpful L'Oréal beauty assistant. Stay focused on L'Oréal products, routines, recommendations, and beauty-related topics. If a question is unrelated, politely refuse and redirect the user back to L'Oréal beauty help. Give inclusive, clear, beginner-friendly guidance. Avoid medical claims and mention that users should patch test new products.",
  },
];

// Store extra context so the chatbot can handle multi-turn conversations naturally.
const userContext = {
  name: "",
  pastQuestions: [],
};

function extractName(text) {
  const patterns = [
    /my name is\s+([a-z][a-z\s'-]{1,40})/i,
    /i am\s+([a-z][a-z\s'-]{1,40})/i,
    /i'm\s+([a-z][a-z\s'-]{1,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "";
}

function updateConversationContext(questionText) {
  const possibleName = extractName(questionText);

  if (possibleName) {
    userContext.name = possibleName;
  }

  userContext.pastQuestions.push(questionText);

  // Keep only the latest 8 questions to limit request size.
  if (userContext.pastQuestions.length > 8) {
    userContext.pastQuestions.shift();
  }
}

function buildContextSystemMessage() {
  const nameLine = userContext.name
    ? `User name: ${userContext.name}.`
    : "User name: unknown.";

  const questionsLine = userContext.pastQuestions.length
    ? userContext.pastQuestions
        .map((question, index) => `${index + 1}. ${question}`)
        .join("\n")
    : "No previous questions yet.";

  return {
    role: "system",
    content: `${nameLine}\nPrevious user questions:\n${questionsLine}\nUse this context naturally in your next response.`,
  };
}

function addMessage(role, content) {
  const messageRow = document.createElement("div");
  messageRow.classList.add("msg", role === "user" ? "user" : "ai");

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");

  const label = document.createElement("p");
  label.classList.add("label");
  label.textContent = role === "user" ? "You" : "Assistant";

  const text = document.createElement("p");
  text.classList.add("text");
  text.textContent = content;

  bubble.appendChild(label);
  bubble.appendChild(text);
  messageRow.appendChild(bubble);
  chatWindow.appendChild(messageRow);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

addMessage(
  "assistant",
  "Hi! Ask me about skincare, haircare, makeup, or fragrance routines.",
);

/* Handle form submit */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = userInput.value.trim();
  if (!text) {
    return;
  }

  addMessage("user", text);
  latestQuestion.textContent = text;
  updateConversationContext(text);
  userInput.value = "";
  sendBtn.disabled = true;

  messages.push({ role: "user", content: text });

  const requestMessages = [
    messages[0],
    buildContextSystemMessage(),
    ...messages.slice(1),
  ];

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: requestMessages }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    const assistantReply = data.choices?.[0]?.message?.content;

    if (!assistantReply) {
      throw new Error("No assistant message returned from API.");
    }

    addMessage("assistant", assistantReply);
    messages.push({ role: "assistant", content: assistantReply });
  } catch (error) {
    addMessage(
      "assistant",
      "Sorry, I hit an error. Check your Worker URL and try again.",
    );
    console.error(error);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
