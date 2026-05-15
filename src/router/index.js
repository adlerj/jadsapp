import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "portfolio",
    component: () => import("../views/PortfolioView.vue"),
    meta: {
      title:
        "Jeff Adler — Director of Engineering at Dropbox | AI & Agentic Engineering Leader, Denver CO",
      description:
        "Jeff Adler (jadler/jads) is a Director of Engineering at Dropbox building AI products with LLMs, Claude, and agentic orchestration. Previously Staff iOS Engineer at Reddit, Senior Engineer at Google. Engineering leader specializing in AI, ML, agents, and agentic engineering. Based in Denver, CO.",
    },
  },
  {
    path: "/chat",
    name: "chat",
    component: () => import("../views/TerminalChat.vue"),
    meta: {
      title:
        "Chat with Jeff Adler's AI — Ask About Dropbox, AI, Engineering Leadership | jads.app",
      description:
        "Ask Jeff Adler's AI assistant about his career at Dropbox, Reddit, and Google, his work with LLMs, Claude, agentic engineering, or his hobbies like mountain biking.",
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  document.title =
    to.meta.title ||
    "Jeff Adler — Director of Engineering at Dropbox | jads.app";
  const desc = document.querySelector('meta[name="description"]');
  if (desc && to.meta.description) {
    desc.setAttribute("content", to.meta.description);
  }
  next();
});

export default router;
