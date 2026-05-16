const fs = require("fs");
const path = require("path");

const SITE_URL = "https://jads.app";
const blogDir = path.join(__dirname, "../src/content/blog");

function getDateFromFrontmatter(content) {
  if (!content.startsWith("---")) return null;
  const end = content.indexOf("---", 3);
  if (end === -1) return null;
  const match = content.slice(3, end).match(/^date:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

const urls = [{ loc: "/", priority: "1.0", changefreq: "monthly" }];

if (fs.existsSync(blogDir)) {
  const posts = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));

  if (posts.length > 0) {
    urls.push({ loc: "/blog", priority: "0.8", changefreq: "weekly" });

    for (const file of posts) {
      const content = fs.readFileSync(path.join(blogDir, file), "utf-8");
      const date = getDateFromFrontmatter(content);
      const slug = file.replace(".md", "");
      urls.push({
        loc: `/blog/${slug}`,
        priority: "0.6",
        changefreq: "monthly",
        lastmod: date,
      });
    }
  }
}

const today = new Date().toISOString().split("T")[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, "../public/sitemap.xml"), xml);
console.log(`Sitemap generated with ${urls.length} URLs`);
