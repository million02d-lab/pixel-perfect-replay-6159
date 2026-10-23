// @lovable.dev/vite-tanstack-config supplies the TanStack Start, React, Tailwind,
// and path-alias plugins. Keep the Lovable preview on its normal server build,
// while GitHub Actions emits a static client bundle for GitHub Pages.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isLovableSandbox =
  process.env.LOVABLE_SANDBOX === "1" ||
  Boolean(process.env.DEV_SERVER__PROJECT_PATH);

export default defineConfig({
  vite: {
    base: "/pixel-perfect-replay-6159/",
  },
  // GitHub Pages cannot run a Nitro/SSR server. Disable Nitro only in CI and
  // prerender the public entry page into static files for Pages.
  nitro: isLovableSandbox ? undefined : false,
  tanstackStart: isLovableSandbox
    ? {
        server: { entry: "server" },
        prerender: {
          enabled: true,
          crawlLinks: true,
          failOnError: false,
          autoSubfolderIndex: true,
        },
      }
    : {
        prerender: {
          enabled: true,
          crawlLinks: true,
          failOnError: false,
          autoSubfolderIndex: true,
        },
        pages: [{ path: "/" }],
      },
});
