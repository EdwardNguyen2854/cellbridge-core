import type { AppConfig } from './config.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Conservative discovery filter: this is NOT a filesystem security boundary.
const SAFE_READ_TOOL = /^(?:get|read|list|search|find|inspect|describe|fetch|view|query|retrieve|show|analy[sz]e|audit|check|count|preview|info|metadata|sheet_info|workbook_info)(?:_|[A-Z]|$)/i;
const MUTATING_WORD = /(?:write|edit|update|set|add|create|delete|remove|clear|format|insert|replace|save|macro|execute|run|export|import|rename|copy|move|merge|sort|filter|calculate|refresh|close|open_workbook)/i;

export function isAllowedTool(tool: Tool, config: AppConfig): boolean {
  if (!config.readOnly) return true;
  if (tool.annotations?.readOnlyHint === false || tool.annotations?.destructiveHint === true) return false;
  return SAFE_READ_TOOL.test(tool.name) && !MUTATING_WORD.test(tool.name);
}
