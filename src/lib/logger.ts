/** Centralized logger. Replaces all direct console.log/error usage. */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = process.env.NODE_ENV === "development";

function log(level: LogLevel, message: string, ...args: unknown[]) {
  if (!isDev && level === "debug") return;

  const prefix = `[tcg-tracker] [${level.toUpperCase()}]`;

  switch (level) {
    case "debug":
      console.debug(prefix, message, ...args);
      break;
    case "info":
      console.info(prefix, message, ...args);
      break;
    case "warn":
      console.warn(prefix, message, ...args);
      break;
    case "error":
      console.error(prefix, message, ...args);
      break;
  }
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => log("debug", message, ...args),
  info: (message: string, ...args: unknown[]) => log("info", message, ...args),
  warn: (message: string, ...args: unknown[]) => log("warn", message, ...args),
  error: (message: string, ...args: unknown[]) => log("error", message, ...args),
};
