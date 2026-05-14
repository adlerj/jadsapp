import { ref } from "vue";
import { systemPrompt } from "../data/systemPrompt";

export function useWebLLM() {
  const messages = ref([]);
  const isLoading = ref(false);
  const isReady = ref(false);
  const loadingProgress = ref("");
  const loadingPercent = ref(0);
  const error = ref(null);
  const isGenerating = ref(false);

  let engine = null;

  const MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

  const checkWebGPU = async () => {
    if (!navigator.gpu) {
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  };

  const initialize = async () => {
    const hasWebGPU = await checkWebGPU();
    if (!hasWebGPU) {
      error.value = "NO_WEBGPU";
      return;
    }

    isLoading.value = true;
    loadingProgress.value = "IMPORTING ENGINE MODULE...";

    try {
      const webllm = await import("@mlc-ai/web-llm");

      loadingProgress.value = "INITIALIZING NEURAL CORE...";

      engine = await webllm.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (report) => {
          loadingProgress.value = report.text;
          if (report.progress !== undefined) {
            loadingPercent.value = Math.round(report.progress * 100);
          }
        },
      });

      isReady.value = true;
      isLoading.value = false;
      loadingProgress.value = "";

      messages.value.push({
        role: "assistant",
        content:
          "SOLARIS ONLINE. I am Jeff Adler's AI terminal assistant. Ask me anything about his career, skills, or interests.\n\nType a question and press ENTER.",
      });
    } catch (e) {
      isLoading.value = false;
      error.value = "LOAD_FAILED";
      loadingProgress.value = `ERROR: ${e.message}`;
    }
  };

  const sendMessage = async (userMessage) => {
    if (!engine || isGenerating.value) return;

    messages.value.push({ role: "user", content: userMessage });
    isGenerating.value = true;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages.value.map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      messages.value.push({ role: "assistant", content: "" });
      const assistantIndex = messages.value.length - 1;

      const chunks = await engine.chat.completions.create({
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 300,
        stream: true,
      });

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || "";
        messages.value[assistantIndex].content += delta;
      }
    } catch (e) {
      messages.value.push({
        role: "assistant",
        content: `ERROR: ${e.message}`,
      });
    }

    isGenerating.value = false;
  };

  const reset = () => {
    messages.value = [];
    if (isReady.value) {
      messages.value.push({
        role: "assistant",
        content: "MEMORY CLEARED. Ready for new queries.",
      });
    }
  };

  return {
    messages,
    isLoading,
    isReady,
    loadingProgress,
    loadingPercent,
    error,
    isGenerating,
    initialize,
    sendMessage,
    reset,
  };
}
