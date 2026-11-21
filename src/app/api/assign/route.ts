import { NextResponse } from 'next/server';
import { EngineError } from '@/types';
import { runAssign } from '@/lib/tools';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json().catch(() => null);
    const { projectId, mode } = (body ?? {}) as { projectId?: unknown; mode?: unknown };
    return NextResponse.json(runAssign(projectId, mode));
  } catch (e) {
    if (e instanceof EngineError) {
      return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: 422 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal error' } }, { status: 500 });
  }
}