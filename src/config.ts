import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';

const server = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_-]{0,39}$/),
  name: z.string().min(1).max(100),
  enabled: z.boolean().default(true),
  transport: z.literal('stdio'),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  cwd: z.string().optional(),
  env: z.record(z.string()).default({}),
  toolAllowlist: z.array(z.string()).optional(),
  toolDenylist: z.array(z.string()).default([]),
});
export type UpstreamConfig = z.infer<typeof server>;
const configSchema = z.object({
  servers: z.array(server).min(1),
  executionTimeoutMs: z.number().int().min(1000).max(300000).default(30000),
  readOnly: z.boolean().default(true),
  allowedRoots: z.array(z.string()).default([]),
});
export type AppConfig = z.infer<typeof configSchema>;

export async function loadConfig(file = process.env.CELLBRIDGE_CONFIG ?? 'config/servers.json'): Promise<AppConfig> {
  const path = resolve(file);
  const parsed: unknown = JSON.parse(await readFile(path, 'utf8'));
  const result = configSchema.parse(parsed);
  const ids = result.servers.map(s => s.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate server IDs in configuration');
  return result;
}

export function publicToolName(serverId: string, toolName: string): string {
  const clean = toolName.replace(/[^A-Za-z0-9_-]/g, '_');
  return `${serverId}__${clean}`;
}
