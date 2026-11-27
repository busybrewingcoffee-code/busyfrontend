// Localhost preview against the mock API (scripts/mock-api.mjs), reachable from
// any device on the same Wi-Fi. .env.mock points Supabase at this dev server
// (Mac's Wi-Fi address), which forwards to the mock, so phones can reach it.
// Not used for production builds.
import { defineConfig } from "vite";

const mock = `http://127.0.0.1:${process.env.MOCK_PORT || 54330}`;
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5190,
    strictPort: true,
    proxy: { "/auth/v1": mock, "/rest/v1": mock },
  },
});
