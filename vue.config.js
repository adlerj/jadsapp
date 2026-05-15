const { defineConfig } = require("@vue/cli-service");
const path = require("path");

const plugins = [];
if (process.env.NODE_ENV === "production") {
  const PrerendererWebpackPlugin = require("@prerenderer/webpack-plugin");
  plugins.push(
    new PrerendererWebpackPlugin({
      routes: ["/", "/chat"],
      renderer: "@prerenderer/renderer-puppeteer",
      rendererOptions: {
        renderAfterTime: 5000,
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      },
    })
  );
}

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    plugins,
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
