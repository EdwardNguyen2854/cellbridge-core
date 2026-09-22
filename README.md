# CellBridge Core — v0.1.0

**An Excel-focused MCP-to-MCP integration gateway.** Connect existing AI harnesses (OpenCode, Codex, LM Studio) to existing open-source Excel MCP servers without modifying their source. CellBridge **does not** implement Excel operations or another AI agent.

> Local stdio integration preview. The management UI, remote hosting, automatic upstream installation, session-aware routing and managed server updates are future milestones.

## Architecture

```mermaid
flowchart LR
  A[OpenCode / Codex / LM Studio] -->|MCP stdio| B[CellBridge]
  B --> C[Discover / namespace / filter / route]
  C -->|MCP stdio| D[Existing Excel MCP server]
  D --> E[Excel files / running Excel]
```

## Prerequisites

Node.js 20+ (Node.js 22 recommended), npm, and an independently installed Excel MCP server. Individual upstream servers may require Python, uv, or desktop Microsoft Excel.

## Install and test (mock upstream; no Excel required)

```bash
npm install
npm run build
npm test
```

The integration test launches the built gateway and a mock MCP Excel server, discovers tools, forwards a read call, and checks the returned result. It does **not** validate actual Microsoft Excel or the three AI harnesses.

## Connect an existing Excel MCP server

1. Install the upstream server using its own instructions, verify its executable/arguments and license.
2. Copy `config/servers.example.json` to `config/servers.json`. Adjust `command`, `args`, optional `cwd` and `env` to the real upstream installation. The supplied `uvx excel-mcp-server stdio` is **an illustrative command** and may not match your chosen server.
3. Run `npm run build`.
4. Register CellBridge in your AI harness as a **local stdio MCP server**: command `node`, args `["C:/dev/cellbridge-core/dist/index.js"]`, env `CELLBRIDGE_CONFIG=C:/dev/cellbridge-core/config/servers.json`.
5. Verify tool discovery and read operations on a disposable workbook. LM Studio, OpenCode, and Codex examples: [Integration guide](docs/INTEGRATION.md).

By default `readOnly: true` hides tools not matching conservative read-only naming/metadata rules. This is a **tool-discovery filter, NOT a sandbox or write-protection guarantee**. An upstream tool may modify files even when it is named `read_*`. Enforce filesystem access in the upstream configuration and OS. The `allowedRoots` setting is reserved and **not enforced** in v0.1. Only register trusted upstream executable commands. Configure backups and test before setting `readOnly: false`.

## Configuration

```json
{
  "readOnly": true,
  "executionTimeoutMs": 30000,
  "servers": [
    {
      "id": "excel_python",
      "name": "Python Excel MCP",
      "enabled": true,
      "transport": "stdio",
      "command": "uvx",
      "args": ["excel-mcp-server", "stdio"],
      "env": {},
      "toolDenylist": []
    }
  ]
}
```

Optional per-server `toolAllowlist` limits exposed tool names. Tools are prefixed with `<server-id>__`, preserving upstream descriptions, argument schemas and results. Unusual upstream tool names may normalize to the same public name: collisions are warned about and later duplicates are skipped. Each harness launch has independent gateway/upstream processes; configuration is static until restart.

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
```

See [Architecture](docs/ARCHITECTURE.md) and [Roadmap](docs/ROADMAP.md). Diagnostic logs go to stderr; stdout remains reserved for MCP protocol traffic.

## License

MIT for CellBridge only. Upstream Excel MCP repos are not bundled; review each upstream license and security posture separately.
