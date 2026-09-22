import { describe, expect, it } from 'vitest';
import { publicToolName } from '../src/config.js';
import { isAllowedTool } from '../src/policy.js';
import type { AppConfig } from '../src/config.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
const cfg: AppConfig = { servers: [], executionTimeoutMs: 30000, readOnly: true, allowedRoots: [] };
const tool = (name: string, readOnlyHint?: boolean): Tool => ({ name, inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint } });
describe('namespaced tool naming', () => {
  it('is deterministic', () => expect(publicToolName('excel_py', 'read-data')).toBe('excel_py__read-data'));
  it('normalizes invalid characters', () => expect(publicToolName('excel_py', 'read/data')).toBe('excel_py__read_data'));
});
describe('read-only policy', () => {
  it('exposes read operations', () => expect(isAllowedTool(tool('read_sheet', true), cfg)).toBe(true));
  it('rejects writes', () => expect(isAllowedTool(tool('write_sheet', false), cfg)).toBe(false));
  it('rejects unknown operations', () => expect(isAllowedTool(tool('do_something'), cfg)).toBe(false));
  it('rejects misleading names with mutating hints', () => expect(isAllowedTool(tool('read_then_write', false), cfg)).toBe(false));
  it('permits writes only when read-only is disabled', () => expect(isAllowedTool(tool('write_sheet', false), { ...cfg, readOnly: false })).toBe(true));
});
