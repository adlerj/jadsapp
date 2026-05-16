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
    path: "/blog",
    name: "blog",
    component: () => import("../views/BlogIndex.vue"),
    meta: {
      title:
        "Jads Blog — Jeff Adler | Engineering Leadership, AI, Agentic Development",
      description:
        "Articles on engineering leadership, AI product development, agentic engineering, and building teams. By Jeff Adler, Director of Engineering at Dropbox.",
    },
  },
  {
    path: "/blog/from-tech-lead-to-director",
    redirect: "/blog/staff-to-senior-manager-90-percent-same-job",
  },
  {
    path: "/blog/:slug",
    name: "blog-post",
    component: () => import("../views/BlogPost.vue"),
    meta: {
      title: "Jads Blog — Jeff Adler",
      description:
        "Blog post by Jeff Adler, Director of Engineering at Dropbox.",
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
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute("href", `https://jads.app${to.path}`);
  }
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    ogUrl.setAttribute("content", `https://jads.app${to.path}`);
  }
  const blogLd = document.querySelector("script[data-blog-ld]");
  if (blogLd && to.name !== "blog-post") {
    blogLd.remove();
  }
  const blogIndexLd = document.querySelector("script[data-blog-index-ld]");
  if (blogIndexLd && to.name !== "blog") {
    blogIndexLd.remove();
  }
  document
    .querySelectorAll('meta[property="article:tag"]')
    .forEach((el) => el.remove());
  next();
});

export default router;
