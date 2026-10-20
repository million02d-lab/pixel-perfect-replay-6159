export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} — Ozannif` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — Ozannif` },
    { property: "og:description", content: description },
  ],
});
