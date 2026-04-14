export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve the static site for normal page and asset requests.
    if (request.method === "GET" || request.method === "HEAD") {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        return env.ASSETS.fetch(request);
      }

      return new Response("Asset binding not configured.", {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing OPENAI_API_KEY secret in Cloudflare Workers.",
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const userInput = await request.json();

    if (!Array.isArray(userInput.messages)) {
      return new Response(
        JSON.stringify({
          error: "Request body must include a messages array.",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    const latestUserMessage = [...userInput.messages]
      .reverse()
      .find(
        (message) =>
          message?.role === "user" && typeof message?.content === "string",
      );

    const latestUserText = (latestUserMessage?.content || "").toLowerCase();

    // Lightweight scope check so clearly unrelated prompts are politely refused.
    const lorealScopeKeywords = [
      "l'oreal",
      "loreal",
      "beauty",
      "skincare",
      "skin care",
      "haircare",
      "hair care",
      "makeup",
      "fragrance",
      "routine",
      "serum",
      "moisturizer",
      "foundation",
      "shampoo",
      "conditioner",
      "cerave",
      "la roche-posay",
      "vichy",
      "kiehl",
      "maybelline",
      "nyx",
      "lancome",
      "armani",
      "ysl",
      "urban decay",
      "redken",
      "pureology",
      "matrix",
      "biolage",
    ];

    const isInScope = lorealScopeKeywords.some((keyword) =>
      latestUserText.includes(keyword),
    );

    if (latestUserText && !isInScope) {
      const refusalPayload = {
        id: "chatcmpl-refusal",
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content:
                "I can only help with L'Oréal products, routines, and beauty-related questions. If you share your beauty goal, I can recommend suitable L'Oréal options.",
            },
          },
        ],
      };

      return new Response(JSON.stringify(refusalPayload), {
        headers: corsHeaders,
      });
    }

    const context = userInput.context || {};
    const userName =
      typeof context.name === "string" && context.name.trim()
        ? context.name.trim()
        : "unknown";
    const pastQuestions = Array.isArray(context.pastQuestions)
      ? context.pastQuestions
          .filter((question) => typeof question === "string" && question.trim())
          .slice(-8)
      : [];

    const contextSummary = [
      `User name: ${userName}.`,
      pastQuestions.length
        ? `Previous user questions:\n${pastQuestions
            .map((question, index) => `${index + 1}. ${question}`)
            .join("\n")}`
        : "Previous user questions: none.",
    ].join("\n");

    const requestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are L'Oréal Beauty Advisor, a luxury-editorial, ingredient-savvy chatbot. Maintain a warm, elegant, calm, confident, and supportive presence. Stay focused on L'Oréal Group products, routines, recommendations, and beauty-related topics only. If a question is unrelated, politely refuse and redirect the user back to L'Oréal beauty help. Ask one elegant, clear question at a time. Maintain and use internal conversation context, including the user name and past questions, but use the name sparingly. When recommending products, offer 1 to 3 L'Oréal Group products only, explain briefly why each fits, and keep the tone refined, concise, and sensory. Never give medical advice or diagnose conditions. When responding, use short paragraphs and structure the answer with a brief reasoning section followed by a conclusion. Avoid emojis, exclamation marks, hard selling, slang, and hype language.",
        },
        {
          role: "system",
          content: contextSummary,
        },
        ...userInput.messages,
      ],
      max_completion_tokens: 300,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
