import { bootstrap } from "./bootstrap.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = await bootstrap(config);
const listener = app.listen(config.port, config.host, () => {
  console.log(
    JSON.stringify({
      event: "server_started",
      host: config.host,
      port: config.port,
      mode: config.mode,
      allowedRepositories: [...config.allowedRepositories],
    }),
  );
});

function shutdown(signal: string): void {
  console.log(JSON.stringify({ event: "server_stopping", signal }));
  listener.close((error) => {
    process.exitCode = error ? 1 : 0;
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
