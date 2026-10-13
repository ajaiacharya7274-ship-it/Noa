
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    const url = new URL(request.url);

    // Health check
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("NOA Brain Online", {
        status: 200,
        headers: {
          ...cors,
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    // Chat endpoint
    if (
      request.method !== "POST" ||
      url.pathname !== "/api/chat"
    ) {
      return json({ ok: false, error: "Not Found" }, 404, cors);
    }

    try {
      const apiKey = String(env.LLAMA_API_KEY || "").trim();

      if (!apiKey) {
        return json({
          ok: false,
          error: "Missing Cloudflare secret: LLAMA_API_KEY"
        }, 500, cors);
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({
          ok: false,
          error: "Invalid JSON request"
        }, 400, cors);
      }

      const message =
        typeof body.message === "string"
          ? body.message.trim()
          : "";

      if (!message) {
        return json({
          ok: false,
          error: "Message is required"
        }, 400, cors);
      }

      const messages = [{
        role: "system",
        content:
          "You are NOA, a helpful personal AI assistant. " +
          "Be accurate, direct, useful, and honest. " +
          "Help with research, coding, planning, and design. " +
          "Never claim an action was completed unless it really was. " +
          "Never claim access to tools or devices that are not connected."
      }];

      if (Array.isArray(body.messages)) {
        for (const item of body.messages.slice(-20)) {
          if (
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          ) {
            messages.push({
              role: item.role,
              content: item.content
            });
          }
        }
      }

      messages.push({
        role: "user",
        content: message
      });

      const model = "z-ai/glm-5.3-flash";

      const response = await fetch(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.5,
            max_tokens: 1024,
            stream: false
          })
        }
      );

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 2000);

        return json({
          ok: false,
          error: "NVIDIA API request failed",
          status: response.status,
          provider_error: detail
        }, 502, cors);
      }

      const result = await response.json();
      const content = result?.choices?.[0]?.message?.content;

      let reply = "";

      if (typeof content === "string") {
        reply = content.trim();
      } else if (Array.isArray(content)) {
        reply = content
          .filter(part => part && typeof part.text === "string")
          .map(part => part.text)
          .join("\n")
          .trim();
      }

      if (!reply) {
        return json({
          ok: false,
          error: "NVIDIA returned no readable answer"
        }, 502, cors);
      }

      return json({
        ok: true,
        reply: reply,
        message: reply,
        model: model,
        provider: "NVIDIA NIM",
        timestamp: new Date().toISOString()
      }, 200, cors);

    } catch (error) {
      return json({
        ok: false,
        error: "NOA Brain internal error",
        details: String(error?.message || error)
      }, 500, cors);
    }
  }
};

function json(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      ...cors,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
              }
        
