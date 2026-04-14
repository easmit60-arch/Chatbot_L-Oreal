/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

// Optional local override: define window.LOCAL_CONFIG.WORKER_URL before script.js.
const localConfig = window.LOCAL_CONFIG || {};
const DEFAULT_WORKER_URL = "https://l0realchatbot.easmit60.workers.dev";

function resolveChatEndpoint(url) {
  const trimmedUrl = url.replace(/\/$/, "");

  if (trimmedUrl.endsWith("/api/chat")) {
    return trimmedUrl;
  }

  return `${trimmedUrl}/api/chat`;
}

const WORKER_URL = resolveChatEndpoint(
  localConfig.WORKER_URL || DEFAULT_WORKER_URL,
);

// The conversation history is sent on every request to keep context.
const conversationMessages = [];

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
  return {
    name: userContext.name,
    pastQuestions: [...userContext.pastQuestions],
  };
}

function getFriendlyErrorMessage(error, response) {
  const isAccessProtected =
    response?.status === 302 ||
    response?.url?.includes("cloudflareaccess.com") ||
    error?.message?.includes("status 302");

  if (isAccessProtected) {
    return "Your Worker is behind Cloudflare Access, so this page cannot call it yet. Sign in to Access or use an unprotected Worker URL in secrets.js.";
  }

  if (response?.status === 401 || response?.status === 403) {
    return "The Worker request was blocked (401/403). Check your Worker access policy and deployment settings.";
  }

  if (response?.status === 404) {
    return "The Worker endpoint was not found. Confirm your URL and that /api/chat is deployed.";
  }

  return "Sorry, I hit an error. Check your Worker URL and try again.";
}

async function testWorkerConnection() {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content:
            "Reply with a one-sentence hello so I can confirm the Worker is live.",
        },
      ],
      context: {
        name: "",
        pastQuestions: [],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Worker test failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log("Worker test response:", data);
  return data;
}

window.testWorkerConnection = testWorkerConnection;

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
  "Welcome. Share your beauty goals, and I can help with L'Oréal skincare, haircare, makeup, and fragrance recommendations.",
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

  conversationMessages.push({ role: "user", content: text });

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationMessages,
        context: buildContextSystemMessage(),
      }),
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
    conversationMessages.push({ role: "assistant", content: assistantReply });
  } catch (error) {
    let response;

    // If fetch resolved, response details are in the thrown status message.
    // If fetch failed before getting a response, keep response undefined.
    if (error.message.includes("status")) {
      const statusMatch = error.message.match(/status\s+(\d{3})/i);
      if (statusMatch) {
        response = { status: Number(statusMatch[1]) };
      }
    }

    addMessage("assistant", getFriendlyErrorMessage(error, response));
    console.error(error);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
