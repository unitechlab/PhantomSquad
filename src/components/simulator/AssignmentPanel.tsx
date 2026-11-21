'use client';

import { useEffect, useRef, useState } from 'react';
import type { Assignment, AssignmentMode, Member } from '@/types';
import { ASSIGNMENT_MODES } from '@/types';
import { Portrait } from '@/components/art/Portrait';
import { SkillIcon } from '@/components/art/SkillIcon';
import { StatusBar } from '@/components/art/StatusBar';
import { ParticleBurst } from '@/components/art/ParticleBurst';
import { useL10n } from '@/hooks/useL10n';
import { useNecroCrew } from '@/store/useNecroCrew';
import { memberAccentVar, memberLoad } from '@/lib/derive';
import { playWhoosh } from '@/lib/sound';

const SLIDER_DEBOUNCE_MS = 16;
const DRAG_TYPE = 'text/necrocrew-member';

function ModeSelector(): JSX.Element {
  const { t, mode: modeLabel } = useL10n();
  const mode = useNecroCrew((s) => s.mode);
  const setMode = useNecroCrew((s) => s.setMode);
  return (
    <div role="radiogroup" aria-label={t('assign.modeLabel')} className="flex flex-wrap gap-2">
      {ASSIGNMENT_MODES.map((m: AssignmentMode) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => setMode(m)}
          className={`rounded-md border px-3 py-2 text-sm ${
            mode === m ? 'border-specter bg-shadow text-bone' : 'border-shadow text-ash hover:text-bone'
          }`}
        >
          {modeLabel(m)}
        </button>
      ))}
    </div>
  );
}

function AssignButton({ projectId }: { projectId: string }): JSX.Element {
  const { t } = useL10n();
  const summon = useNecroCrew((s) => s.summon);
  const muted = useNecroCrew((s) => s.muted);
  const [burst, setBurst] = useState(0);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          summon(projectId);
          setBurst((b) => b + 1);
          if (!muted) playWhoosh();
        }}
        className="rounded-md border border-ecto bg-crypt px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-ecto shadow-ecto hover:bg-ecto hover:text-void"
      >
        {t('assign.summon')}
      </button>
      <ParticleBurst trigger={burst} />
    </span>
  );
}

function AssignmentRow({ assignment, member }: { assignment: Assignment; member: Member }): JSX.Element {
  const { t, skill, memberName } = useL10n();
  const setRate = useNecroCrew((s) => s.setRate);
  const remove = useNecroCrew((s) => s.removeAssignment);
  const assignments = useNecroCrew((s) => s.assignments);
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const rate = draft ?? assignment.allocatedRate;
  const load = memberLoad(member.id, assignments);
  const onChange = (value: number): void => {
    setDraft(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setRate(assignment.projectId, member.id, value);
      setDraft(null);
    }, SLIDER_DEBOUNCE_MS);
  };

  return (
    <li className="rounded-lg border border-shadow bg-crypt p-3 focus-within:shadow-specter hover:shadow-specter">
      <div className="flex items-center gap-3">
        <span className="shrink-0 overflow-hidden rounded-md border-2" style={{ borderColor: memberAccentVar(member) }}>
          <Portrait id={member.characterId} name="" kind="face" width={56} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-bone">{memberName(member)}</p>
          <ul className="flex flex-wrap gap-2">
            {assignment.assignedSkills.map((s) => (
              <li key={s} className="flex items-center gap-1 rounded bg-shadow px-2 py-1 text-sm text-ash">
                <SkillIcon skill={s} size={18} />
                {skill(s)}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => remove(assignment.projectId, member.id)}
          aria-label={t('assign.remove', { name: memberName(member) })}
          className="rounded-md border border-shadow px-2 py-1 text-ash hover:text-bone"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        <label htmlFor={`rate-${member.id}`} className="w-20 text-ash">
          {t('assign.allocation')}
        </label>
        <input
          id={`rate-${member.id}`}
          type="range"
          min={10}
          max={100}
          step={5}
          value={rate}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-[var(--color-ecto)]"
        />
        <span className="w-12 text-right font-mono text-ecto">{rate}%</span>
      </div>
      <div className="mt-2">
        <StatusBar
          kind="energy"
          label={t('assign.load', { name: memberName(member) })}
          value={load}
          max={member.capacity}
          caption={`${load} / ${member.capacity}%`}
        />
      </div>
    </li>
  );
}

/** Every creator as a button that adds them to the quest. Also the drag source: dropping on the panel does the same. */
function AddCreators({ projectId, assignments, members }: { projectId: string; assignments: Assignment[]; members: Member[] }): JSX.Element {
  const { t, memberName } = useL10n();
  const addMember = useNecroCrew((s) => s.addMember);
  return (
    <div className="space-y-2">
      <p className="text-sm text-ash">
        {t('assign.add')}. {t('assign.addHint')}
      </p>
      <ul className="flex flex-wrap gap-2">
        {members.map((m) => {
          const already = assignments.some((a) => a.memberId === m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                draggable={!already}
                disabled={already}
                onDragStart={(e) => e.dataTransfer.setData(DRAG_TYPE, m.id)}
                onClick={() => addMember(projectId, m.id)}
                aria-label={t('assign.addAria', { name: memberName(m) })}
                className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm ${
                  already ? 'border-shadow text-ash opacity-50' : 'cursor-grab border-shadow text-bone hover:border-specter'
                }`}
              >
                <span className="overflow-hidden rounded border" style={{ borderColor: memberAccentVar(m) }}>
                  <Portrait id={m.characterId} name="" kind="face" width={28} />
                </span>
                {memberName(m)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AssignmentPanel({
  projectId,
  assignments,
  members,
}: {
  projectId: string;
  assignments: Assignment[];
  members: Member[];
}): JSX.Element {
  const { t } = useL10n();
  const addMember = useNecroCrew((s) => s.addMember);
  const [over, setOver] = useState(false);
  const onDrop = (e: React.DragEvent): void => {
    e.preventDefault();
    setOver(false);
    const id = e.dataTransfer.getData(DRAG_TYPE);
    if (id) addMember(projectId, id);
  };
  return (
    <section
      aria-labelledby="assign-title"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_TYPE)) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`space-y-4 rounded-lg border bg-crypt p-4 ${over ? 'border-ecto shadow-ecto' : 'border-specter/30'}`}
    >
      <h2 id="assign-title" className="text-lg">
        {t('assign.title')}
      </h2>
      <ModeSelector />
      <AssignButton projectId={projectId} />
      <AddCreators projectId={projectId} assignments={assignments} members={members} />
      {over && <p className="text-sm text-ecto">{t('assign.drop')}</p>}
      {assignments.length === 0 ? (
        <p className="text-sm text-ash">{t('assign.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => {
            const m = members.find((x) => x.id === a.memberId);
            return m ? <AssignmentRow key={a.memberId} assignment={a} member={m} /> : null;
          })}
        </ul>
      )}
    </section>
  );
}