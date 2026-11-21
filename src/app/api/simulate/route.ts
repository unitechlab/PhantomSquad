import { NextResponse } from 'next/server';
import { EngineError } from '@/types';
import { runSimulate } from '@/lib/tools';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json().catch(() => null);
    const { projectId, assignments } = (body ?? {}) as { projectId?: unknown; assignments?: unknown };
    return NextResponse.json(runSimulate(projectId, assignments));
  } catch (e) {
    if (e instanceof EngineError) {
      return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: 422 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL', message: 'Internal error' } }, { status: 500 });
  }
}