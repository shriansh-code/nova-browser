const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("nova", {
  version: "0.3.0",
  async askAI({ endpoint, apiKey, model, messages }) {
    if (!endpoint) throw new Error("Add an AI endpoint in Nova AI Settings.");
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ model: model || "default", messages, stream: false })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI server returned ${response.status}: ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content
      ?? data?.message?.content
      ?? data?.response
      ?? data?.output_text;

    if (!message) throw new Error("The AI server returned no readable answer.");
    return message;
  }
});
