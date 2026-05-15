import { ref } from "vue";

export function useChat() {
  const messages = ref([]);
  const isReady = ref(true);
  const isGenerating = ref(false);
  const error = ref(null);

  messages.value.push({
    role: "assistant",
    content:
      "I know everything about Jeff. Ask me about his career, what he's building, his interests, or anything else.",
  });

  const sendMessage = async (userMessage, options = {}) => {
    if (isGenerating.value) return;

    messages.value.push({ role: "user", content: userMessage });
    isGenerating.value = true;

    messages.value.push({ role: "assistant", content: "" });
    const assistantIndex = messages.value.length - 1;

    try {
      const body = {
        messages: messages.value
          .filter((m) => m.content)
          .map((m) => ({ role: m.role, content: m.content })),
      };
      if (options.systemPrompt) {
        body.systemPrompt = options.systemPrompt;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (done) break;
        const value = result.value;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              messages.value[assistantIndex] = {
                ...messages.value[assistantIndex],
                content:
                  messages.value[assistantIndex].content + parsed.content,
              };
            }
            if (parsed.error) {
              messages.value[assistantIndex] = {
                ...messages.value[assistantIndex],
                content: `ERROR: ${parsed.error}`,
              };
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (e) {
      messages.value[assistantIndex].content = `ERROR: ${e.message}`;
    }

    isGenerating.value = false;
  };

  const reset = () => {
    messages.value = [
      {
        role: "assistant",
        content: "MEMORY CLEARED. Ready for new queries.",
      },
    ];
  };

  return {
    messages,
    isReady,
    isGenerating,
    error,
    sendMessage,
    reset,
  };
}
