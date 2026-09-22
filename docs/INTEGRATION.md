# AI harness integration

Build using `npm install && npm run build`. Set `CELLBRIDGE_CONFIG` to an **absolute** path to the reviewed server configuration. Install/test each upstream Excel MCP server separately.

## LM Studio

Add to LM Studio MCP `mcp.json`:
```json
{"mcpServers":{"cellbridge":{"command":"node","args":["C:/dev/cellbridge-core/dist/index.js"],"env":{"CELLBRIDGE_CONFIG":"C:/dev/cellbridge-core/config/servers.json"}}}}
```

## OpenCode (illustrative)

```json
{"mcp":{"cellbridge":{"type":"local","command":["node","C:/dev/cellbridge-core/dist/index.js"],"environment":{"CELLBRIDGE_CONFIG":"C:/dev/cellbridge-core/config/servers.json"},"enabled":true}}}
```

## Codex (illustrative)

```toml
[mcp_servers.cellbridge]
command = "node"
args = ["C:/dev/cellbridge-core/dist/index.js"]
[mcp_servers.cellbridge.env]
CELLBRIDGE_CONFIG = "C:/dev/cellbridge-core/config/servers.json"
```

Client configuration syntax can change: verify against your installed harness version. The selected model/client must support MCP tools and have tool calling enabled. Test with: "List the Excel tools available from CellBridge and read the worksheet names from a disposable workbook."
