/** Never write diagnostics to stdout: stdout is reserved for MCP stdio. */
export function log(level: 'info' | 'warn' | 'error', event: string, details: Record<string, unknown> = {}): void {
  process.stderr.write(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details }) + '\n');
}
