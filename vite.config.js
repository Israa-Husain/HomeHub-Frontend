import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = Object.fromEntries(
    ["/api", "/uploads"].map((path) => [
      path,
      {
        target: env.API_PROXY_TARGET || "http://localhost:8070",
        changeOrigin: true,
      },
    ]),
  );
  return {
    plugins: [react()],
    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  };
});
