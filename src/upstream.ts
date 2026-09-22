import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';
import type { UpstreamConfig } from './config.js';
import { log } from './log.js';

export class Upstream {
  readonly client: Client;
  private readonly transport: StdioClientTransport;
  tools: Tool[] = [];
  constructor(readonly config: UpstreamConfig) {
    this.client = new Client({ name: `cellbridge-client-${config.id}`, version: '0.1.0' });
    this.transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      cwd: config.cwd,
      env: { ...process.env, ...config.env } as Record<string, string>,
      stderr: 'pipe',
    });
    this.transport.stderr?.on('data', (chunk: Buffer) => {
      log('info', 'upstream.stderr', { server: config.id, message: chunk.toString().slice(0, 2000) });
    });
    this.transport.onclose = () => log('warn', 'upstream.closed', { server: config.id });
    this.transport.onerror = error => log('error', 'upstream.error', { server: config.id, error: error.message });
  }

  async start(timeoutMs: number): Promise<void> {
    await this.client.connect(this.transport, { timeout: timeoutMs });
    let cursor: string | undefined;
    const all: Tool[] = [];
    do {
      const page = await this.client.listTools({ cursor }, { timeout: timeoutMs });
      all.push(...page.tools);
      cursor = page.nextCursor;
    } while (cursor);
    this.tools = all.filter(tool =>
      (!this.config.toolAllowlist || this.config.toolAllowlist.includes(tool.name)) &&
      !this.config.toolDenylist.includes(tool.name),
    );
    log('info', 'upstream.connected', { server: this.config.id, tools: this.tools.length });
  }

  async call(name: string, args: Record<string, unknown>, timeoutMs: number): Promise<CallToolResult> {
    return await this.client.callTool({ name, arguments: args }, undefined, { timeout: timeoutMs }) as CallToolResult;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
