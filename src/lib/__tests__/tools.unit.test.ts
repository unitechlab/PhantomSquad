import { describe, expect, it } from 'vitest';
import { runAssign, runSimulate } from '@/lib/tools';
import { necrocrewAssign, necrocrewSimulate } from '@/mcp/necroCrew';
import { EngineError } from '@/types';

describe('runAssign', () => {
  it('returns a simulation result', () => {
    const r = runAssign('haunted-mall-webar', 'Speedrun');
    expect(r.assignments.length).toBeGreaterThan(0);
  });
  it('rejects unknown projects and modes', () => {
    expect(() => runAssign('nope', 'Speedrun')).toThrow(EngineError);
    expect(() => runAssign('haunted-mall-webar', 'x')).toThrow(EngineError);
  });
});

describe('runSimulate', () => {
  it('rejects malformed assignments', () => {
    expect(() => runSimulate('haunted-mall-webar', [{ foo: 1 }])).toThrow(EngineError);
  });
});

describe('MCP adapter', () => {
  it('assign then simulate round-trips through JSON', () => {
    const first = necrocrewAssign.handler({ projectId: 'cyber-ghost-vr', mode: 'Balanced' });
    const again = necrocrewSimulate.handler({
      projectId: 'cyber-ghost-vr',
      assignments: JSON.parse(JSON.stringify(first.assignments)),
    });
    expect(again.estimatedDays).toBeCloseTo(first.estimatedDays);
  });
});