export function isQueueDebugEnabled(): boolean {
  try {
    const val = window.localStorage.getItem('WILD_QUEUE_DEBUG');
    if (val === '1' || val === 'true') return true;
    return false;
  } catch (e) {
    return false;
  }
}

export function setQueueDebug(enabled: boolean) {
  try {
    window.localStorage.setItem('WILD_QUEUE_DEBUG', enabled ? '1' : '0');
  } catch (e) { }
}

function formatPrefix() {
  return `[QueueDebug:${new Date().toISOString()}]`;
}

export function qlog(...args: any[]) {
  if (!isQueueDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log(formatPrefix(), ...args);
}

export function qwarn(...args: any[]) {
  if (!isQueueDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.warn(formatPrefix(), ...args);
}

export function qerr(...args: any[]) {
  if (!isQueueDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.error(formatPrefix(), ...args);
}
