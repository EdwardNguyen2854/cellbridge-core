import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { AppConfig } from './config.js';
import { publicToolName } from './config.js';
import { isAllowedTool } from './policy.js';
import { Upstream } from './upstream.js';
import { log } from './log.js';

type Route = { upstream: Upstream; tool: Tool };
export class Gateway {
  private readonly server = new Server(
    { name: 'cellbridge-core', version: '0.1.0' },
    { capabilities: { tools: { listChanged: false } } },
  );
  private readonly upstreams: Upstream[] = [];
  private readonly routes = new Map<string, Route>();
  private closing = false;

  constructor(private readonly config: AppConfig) {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [...this.routes.entries()].map(([name, route]) => ({
        ...route.tool,
        name,
        description: `[${route.upstream.config.name}] ${route.tool.description ?? route.tool.name}`,
      })),
    }));
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const route = this.routes.get(request.params.name);
      if (!route) return errorResult(`Unknown or disabled tool: ${request.params.name}`);
      const started = Date.now();
      try {
        const result = await route.upstream.call(
          route.tool.name,
          (request.params.arguments ?? {}) as Record<string, unknown>,
          this.config.executionTimeoutMs,
        );
        log('info', 'tool.called', { tool: request.params.name, durationMs: Date.now() - started, isError: !!result.isError });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log('error', 'tool.failed', { tool: request.params.name, error: message });
        return errorResult(`Upstream tool failed: ${message}`);
      }
    });
  }

  async start(): Promise<void> {
    for (const spec of this.config.servers.filter(s => s.enabled)) {
      const upstream = new Upstream(spec);
      try {
        await upstream.start(this.config.executionTimeoutMs);
        this.upstreams.push(upstream);
        for (const tool of upstream.tools) {
          if (!isAllowedTool(tool, this.config)) continue;
          const name = publicToolName(spec.id, tool.name);
          if (this.routes.has(name)) {
            log('warn', 'tool.collision', { server: spec.id, name });
            continue;
          }
          this.routes.set(name, { upstream, tool });
        }
      } catch (error) {
        log('error', 'upstream.start_failed', { server: spec.id, error: String(error) });
        await upstream.close().catch(() => {});
      }
    }
    if (this.upstreams.length === 0) throw new Error('No upstream MCP servers connected; check config and stderr logs');
    log('info', 'gateway.ready', { upstreams: this.upstreams.length, exposedTools: this.routes.size, readOnly: this.config.readOnly });
    await this.server.connect(new StdioServerTransport());
  }

  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true;
    await Promise.allSettled(this.upstreams.map(s => s.close()));
    await this.server.close();
  }
}
function errorResult(message: string): CallToolResult {
  return { content: [{ type: 'text', text: message }], isError: true };
}
