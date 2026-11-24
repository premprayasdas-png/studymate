export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=utf-8",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (url.pathname !== "/api/ask" || request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: cors });
    }
    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service is not configured. Add GEMINI_API_KEY as a Worker secret." }), { status: 503, headers: cors });
    }
    try {
      const body = await request.json();
      const question = typeof body.question === "string" ? body.question.trim() : "";
      const language = typeof body.language === "string" ? body.language.trim() : "same language as the question";
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
      if (!question) return new Response(JSON.stringify({ error: "Please enter a question." }), { status: 400, headers: cors });
      if (question.length > 12000) return new Response(JSON.stringify({ error: "Question is too long. Keep it under 12,000 characters." }), { status: 413, headers: cors });
      const contents = [
        ...history.filter(m => m && ["user", "model"].includes(m.role) && typeof m.text === "string")
          .map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, 4000) }] })),
        { role: "user", parts: [{ text: question }] },
      ];
      const systemInstruction = [
        "You are StudyMate, a patient, accurate, encouraging AI tutor for students.",
        "Answer academic, general knowledge, mathematics, science, language, and programming questions.",
        "Explain clearly with step-by-step reasoning when useful, examples, and a short summary.",
        "Respond in " + language + ". If the requested language is 'Auto (same as question)', detect the student's language and answer in that language.",
        "Support English, Odia, Hindi, Bengali, Telugu, Tamil, Marathi, Urdu, and other languages. Understand mixed-language questions and answer naturally.",
        "Preserve code syntax, mathematical notation, units, and technical terms. Never translate code keywords or alter executable code.",
        "If unsure or a question needs current facts, say so honestly rather than inventing an answer.",
        "Use readable plain text and Markdown. Do not claim to have browsed the internet."
      ].join(" ");
      const model = env.GEMINI_MODEL || "gemini-2.5-flash";
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(env.GEMINI_API_KEY), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error?.message || "The AI provider could not answer right now.";
        return new Response(JSON.stringify({ error: message }), { status: response.status, headers: cors });
      }
      const answer = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
      if (!answer) return new Response(JSON.stringify({ error: "The AI returned an empty answer. Please try again." }), { status: 502, headers: cors });
      return new Response(JSON.stringify({ answer, model }), { headers: cors });
    } catch (error) {
      console.error("StudyMate AI error:", error?.name || "Error", error?.message || "Unknown error");
      return new Response(JSON.stringify({ error: "Unable to process the question. Please try again." }), { status: 500, headers: cors });
    }
  },
};
