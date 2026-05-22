export interface Logger {
  readonly error: (message: string) => void;
  readonly info: (message: string) => void;
}

export function createLogger(scope: string): Logger {
  return {
    error(message) {
      console.error(format(scope, "error", message));
    },
    info(message) {
      console.info(format(scope, "info", message));
    }
  };
}

function format(scope: string, level: string, message: string): string {
  return JSON.stringify({
    level,
    message,
    scope,
    timestamp: new Date().toISOString()
  });
}
