import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const client = new Client({ name: 'cellbridge-integration-test', version: '0.1.0' });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve('dist/index.js')],
  env: { ...process.env, CELLBRIDGE_CONFIG: resolve('config/mock.example.json') } as Record<string, string>,
  stderr: 'pipe',
});
beforeAll(async () => { await client.connect(transport, { timeout: 10000 }); }, 15000);
afterAll(async () => { await client.close(); });
describe('MCP-to-MCP gateway integration', () => {
  it('discovers upstream tools and hides writes in read-only mode', async () => {
    const { tools } = await client.listTools();
    expect(tools.map(t => t.name)).toContain('demo__read_sheet');
    expect(tools.map(t => t.name)).not.toContain('demo__write_sheet');
  });
  it('forwards a tool call and its result', async () => {
    const result = await client.callTool({ name: 'demo__read_sheet', arguments: { sheet: 'Sheet1' } });
    expect(result.isError).not.toBe(true);
    expect(JSON.stringify(result.content)).toContain('Sheet1');
  });
  it('rejects disabled/unknown tools', async () => {
    const result = await client.callTool({ name: 'demo__write_sheet', arguments: {} });
    expect(result.isError).toBe(true);
  });
});
