// Test-only upstream MCP server. No Excel installation needed.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
const server = new Server({ name: 'mock-excel', version: '0.1.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [
  { name: 'read_sheet', description: 'Read a mock Excel worksheet', inputSchema: { type: 'object', properties: { sheet: { type: 'string' } }, required: ['sheet'] }, annotations: { readOnlyHint: true } },
  { name: 'write_sheet', description: 'Mock workbook write operation', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: false } }
] }));
server.setRequestHandler(CallToolRequestSchema, async request => ({
  content: [{ type: 'text', text: JSON.stringify({ sheet: request.params.arguments?.sheet, rows: [[1, 2], [3, 4]] }) }]
}));
await server.connect(new StdioServerTransport());
