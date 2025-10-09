export type DebugLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

type LoggerFunction = (...messages: any[]) => void;

interface Logger {
  trace: LoggerFunction;
  debug: LoggerFunction;
  info: LoggerFunction;
  warn: LoggerFunction;
  error: LoggerFunction;
  setLevel: (level: DebugLevel) => void;
  performance: {
    start: (label: string) => void;
    end: (label: string) => number;
    measure: (label: string, fn: () => void | Promise<void>) => Promise<number>;
  };
}

// Default to 'warn' in production, 'debug' in development to reduce noise
let currentLevel: DebugLevel =
  (import.meta.env.VITE_LOG_LEVEL as DebugLevel) || (import.meta.env.PROD ? 'warn' : 'debug');

const isWorker = 'HTMLRewriter' in globalThis;
const supportsColor = !isWorker;
const performanceMarks = new Map<string, number>();
const levelOrder: DebugLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];

export const logger: Logger = {
  trace: (...messages: any[]) => log('trace', undefined, messages),
  debug: (...messages: any[]) => log('debug', undefined, messages),
  info: (...messages: any[]) => log('info', undefined, messages),
  warn: (...messages: any[]) => log('warn', undefined, messages),
  error: (...messages: any[]) => log('error', undefined, messages),
  setLevel,
  performance: {
    start: (label: string) => {
      if (levelOrder.indexOf('debug') < levelOrder.indexOf(currentLevel)) {
        return;
      }

      performanceMarks.set(label, performance.now());
    },
    end: (label: string): number => {
      if (levelOrder.indexOf('debug') < levelOrder.indexOf(currentLevel)) {
        return 0;
      }

      const startTime = performanceMarks.get(label);

      if (startTime === undefined) {
        logger.warn(`Performance mark "${label}" not found`);
        return 0;
      }

      const duration = performance.now() - startTime;
      performanceMarks.delete(label);
      logger.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);

      return duration;
    },
    measure: async (label: string, fn: () => void | Promise<void>): Promise<number> => {
      logger.performance.start(label);
      await fn();

      return logger.performance.end(label);
    },
  },
};

export function createScopedLogger(scope: string): Logger {
  return {
    trace: (...messages: any[]) => log('trace', scope, messages),
    debug: (...messages: any[]) => log('debug', scope, messages),
    info: (...messages: any[]) => log('info', scope, messages),
    warn: (...messages: any[]) => log('warn', scope, messages),
    error: (...messages: any[]) => log('error', scope, messages),
    setLevel,
    performance: {
      start: (label: string) => {
        if (levelOrder.indexOf('debug') < levelOrder.indexOf(currentLevel)) {
          return;
        }

        performanceMarks.set(`${scope}:${label}`, performance.now());
      },
      end: (label: string): number => {
        if (levelOrder.indexOf('debug') < levelOrder.indexOf(currentLevel)) {
          return 0;
        }

        const startTime = performanceMarks.get(`${scope}:${label}`);

        if (startTime === undefined) {
          logger.warn(`Performance mark "${scope}:${label}" not found`);
          return 0;
        }

        const duration = performance.now() - startTime;
        performanceMarks.delete(`${scope}:${label}`);
        logger.debug(`⏱️ ${scope}:${label}: ${duration.toFixed(2)}ms`);

        return duration;
      },
      measure: async (label: string, fn: () => void | Promise<void>): Promise<number> => {
        const scopedLabel = `${scope}:${label}`;
        logger.performance.start(scopedLabel);
        await fn();

        return logger.performance.end(scopedLabel);
      },
    },
  };
}

function setLevel(level: DebugLevel) {
  if ((level === 'trace' || level === 'debug') && import.meta.env.PROD) {
    return;
  }

  currentLevel = level;
}

function formatMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message instanceof Error) {
    return message.stack ?? message.message ?? 'Error';
  }

  if (message === null || message === undefined) {
    return String(message);
  }

  if (typeof message === 'number' || typeof message === 'boolean' || typeof message === 'bigint') {
    return message.toString();
  }

  if (typeof message === 'symbol') {
    return message.description ? `Symbol(${message.description})` : message.toString();
  }

  if (typeof message === 'object') {
    try {
      return JSON.stringify(message);
    } catch {
      return Object.prototype.toString.call(message);
    }
  }

  return String(message);
}

function log(level: DebugLevel, scope: string | undefined, messages: any[]) {
  if (levelOrder.indexOf(level) < levelOrder.indexOf(currentLevel)) {
    return;
  }

  const allMessages = messages.reduce((acc, current) => {
    const formatted = formatMessage(current);

    if (acc.endsWith('\n')) {
      return acc + formatted;
    }

    if (!acc) {
      return formatted;
    }

    return `${acc} ${formatted}`;
  }, '');

  if (!supportsColor) {
    console.log(`[${level.toUpperCase()}]`, allMessages);

    return;
  }

  const labelBackgroundColor = getColorForLevel(level);
  const labelTextColor = level === 'warn' ? 'black' : 'white';

  const labelStyles = getLabelStyles(labelBackgroundColor, labelTextColor);
  const scopeStyles = getLabelStyles('#77828D', 'white');

  const styles = [labelStyles];

  if (typeof scope === 'string') {
    styles.push('', scopeStyles);
  }

  console.log(`%c${level.toUpperCase()}${scope ? `%c %c${scope}` : ''}`, ...styles, allMessages);
}

function getLabelStyles(color: string, textColor: string) {
  return `background-color: ${color}; color: white; border: 4px solid ${color}; color: ${textColor};`;
}

function getColorForLevel(level: DebugLevel): string {
  switch (level) {
    case 'trace':
    case 'debug': {
      return '#77828D';
    }
    case 'info': {
      return '#1389FD';
    }
    case 'warn': {
      return '#FFDB6C';
    }
    case 'error': {
      return '#EE4744';
    }
    default: {
      return 'black';
    }
  }
}

export const renderLogger = createScopedLogger('Render');
