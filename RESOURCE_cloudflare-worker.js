addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Let browsers complete CORS checks before the real POST request.
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Serve HTML/CSS/JS files for normal page requests.
  if (request.method === "GET" || request.method === "HEAD") {
    if (typeof ASSETS !== "undefined" && typeof ASSETS.fetch === "function") {
      return ASSETS.fetch(request);
    }

    return new Response("Asset binding not configured.", {
      status: 500,
      headers: corsHeaders,
    });
  }

  // Keep the API route explicit so site routes and API routes do not conflict.
  if (request.method !== "POST" || url.pathname !== "/api/chat") {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: corsHeaders,
    });
  }

  // In service-worker syntax, secrets are available as global bindings.
  const apiKey = OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing OPENAI_API_KEY secret." }),
      { status: 500, headers: corsHeaders },
    );
  }

  let userInput;

  try {
    userInput = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!Array.isArray(userInput.messages)) {
    return new Response(
      JSON.stringify({ error: "Request body must include messages array." }),
      { status: 400, headers: corsHeaders },
    );
  }

  const useWebSearch = Boolean(userInput.useWebSearch);
  const selectedModel = useWebSearch ? "gpt-4o-search-preview" : "gpt-4o";
  const systemPrompt = useWebSearch
    ? "You are a helpful L'Oréal beauty assistant. Give short, clear, beginner-friendly answers focused on L'Oréal products and routines. If you use web information, include a short Sources section with direct URLs."
    : "You are a helpful L'Oréal beauty assistant. Give short, clear, beginner-friendly answers focused on L'Oréal products and routines.";

  // Add one system instruction, then pass student chat messages through.
  const requestBody = {
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...userInput.messages,
    ],
  };

  if (useWebSearch) {
    requestBody.web_search_options = {
      search_context_size: "medium",
    };
  }

  const openAiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  const data = await openAiResponse.json();

  return new Response(JSON.stringify(data), {
    status: openAiResponse.status,
    headers: corsHeaders,
  });
}
