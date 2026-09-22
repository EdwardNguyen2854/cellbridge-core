#!/usr/bin/env node
import { loadConfig } from './config.js';
import { Gateway } from './gateway.js';
import { log } from './log.js';

let gateway: Gateway | undefined;
let stopping = false;
async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  log('info', 'gateway.shutdown', { signal });
  try { await gateway?.close(); } catch (error) { log('error', 'gateway.shutdown_error', { error: String(error) }); }
  process.exit(0);
}
process.once('SIGINT', () => { void shutdown('SIGINT'); });
process.once('SIGTERM', () => { void shutdown('SIGTERM'); });

try {
  const config = await loadConfig();
  gateway = new Gateway(config);
  await gateway.start();
} catch (error) {
  log('error', 'gateway.fatal', { error: error instanceof Error ? error.stack ?? error.message : String(error) });
  await gateway?.close().catch(() => {});
  process.exitCode = 1;
}
