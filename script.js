/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

// secrets.js can define window.LOCAL_CONFIG for local development only.
const localConfig = window.LOCAL_CONFIG || {};
const WORKER_URL =
  localConfig.WORKER_URL || "l0realchatbot.easmit60.workers.dev";

const workerUrlIsPlaceholder = WORKER_URL.includes("l0realchatbot.easmit60.workers.dev");

if (workerUrlIsPlaceholder) {
  console.warn(
    "Worker URL is still a placeholder. Replace secrets.js WORKER_URL with your deployed Cloudflare Worker URL.",
  );
}

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

async function testWorkerConnection() {
  if (workerUrlIsPlaceholder) {
    console.warn(
      "Cannot test the Worker yet because WORKER_URL is still a placeholder.",
    );
    return null;
  }

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
