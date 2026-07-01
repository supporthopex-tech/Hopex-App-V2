type LogContext = Record<string, unknown>;

export function logInfo(event: string, context: LogContext = {}) {
  console.info(JSON.stringify({ level: "info", event, timestamp: new Date().toISOString(), ...context }));
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  const normalized = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) };
  console.error(JSON.stringify({ level: "error", event, timestamp: new Date().toISOString(), error: normalized, ...context }));
}
