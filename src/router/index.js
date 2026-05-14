import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "portfolio",
    component: () => import("../views/PortfolioView.vue"),
  },
  {
    path: "/chat",
    name: "chat",
    component: () => import("../views/TerminalChat.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
