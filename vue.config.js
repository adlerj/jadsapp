const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const fs = require("fs");

const plugins = [];
if (process.env.NODE_ENV === "production" && process.arch === "x64") {
  const PrerendererWebpackPlugin = require("@prerenderer/webpack-plugin");

  const blogDir = path.join(__dirname, "src/content/blog");
  const blogSlugs = fs.existsSync(blogDir)
    ? fs
        .readdirSync(blogDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => `/blog/${f.replace(".md", "")}`)
    : [];

  plugins.push(
    new PrerendererWebpackPlugin({
      routes: ["/", "/blog", ...blogSlugs],
      renderer: "@prerenderer/renderer-puppeteer",
      rendererOptions: {
        renderAfterTime: 5000,
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    })
  );
}

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins,
  },
  chainWebpack: (config) => {
    config.module.rule("markdown").test(/\.md$/).type("asset/source");
  },
  pages: {
    index: {
      entry: "src/main.js",
      template: "public/index.html",
      filename: "index.html",
      title:
        "Jeff Adler — Director of Engineering at Dropbox | AI & Agentic Engineering Leader, Denver CO",
    },
  },
  devServer: {
    historyApiFallback: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        onProxyRes(proxyRes) {
          proxyRes.headers["cache-control"] = "no-cache";
          proxyRes.headers["x-accel-buffering"] = "no";
        },
      },
    },
  },
});
