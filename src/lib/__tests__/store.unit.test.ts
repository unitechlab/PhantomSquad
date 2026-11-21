import { beforeEach, describe, expect, it } from 'vitest';
import { useNecroCrew } from '@/store/useNecroCrew';

const state = () => useNecroCrew.getState();

beforeEach(() => {
  state().resetGame();
});

describe('addMember', () => {
  it('adds a creator with the skills they qualify for and their free time', () => {
    state().addMember('haunted-mall-webar', 'luna');
    const list = state().assignments['haunted-mall-webar'];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ memberId: 'luna', allocatedRate: 100, assignedSkills: ['AR'] });
    expect(state().error).toBeNull();
  });

  it('does nothing when the creator is already on the quest', () => {
    state().addMember('haunted-mall-webar', 'luna');
    state().addMember('haunted-mall-webar', 'luna');
    expect(state().assignments['haunted-mall-webar']).toHaveLength(1);
  });

  it('refuses a creator with no skill the quest needs', () => {
    state().addMember('haunted-mall-webar', 'azria');
    expect(state().assignments['haunted-mall-webar'] ?? []).toHaveLength(0);
    expect(state().error).toBe('No matching skill');
  });

  it('refuses a creator with no free time left', () => {
    state().addMember('haunted-mall-webar', 'luna');
    state().addMember('phantom-museum-ar', 'luna');
    expect(state().assignments['phantom-museum-ar'] ?? []).toHaveLength(0);
    expect(state().error).toBe('Luna is over capacity');
  });

  it('refuses an unknown quest', () => {
    state().addMember('no-such-quest', 'luna');
    expect(state().error).toBe('Unknown quest');
  });
});

describe('setSkillLevel', () => {
  it('sets a level and keeps it between 0 and 5', () => {
    state().setSkillLevel('luna', 'VR', 4);
    expect(state().members.find((m) => m.id === 'luna')?.skills.find((s) => s.skillName === 'VR')?.level).toBe(4);
    state().setSkillLevel('luna', 'VR', 9);
    expect(state().members.find((m) => m.id === 'luna')?.skills.find((s) => s.skillName === 'VR')?.level).toBe(5);
    state().setSkillLevel('luna', 'VR', -3);
    expect(state().members.find((m) => m.id === 'luna')?.skills.find((s) => s.skillName === 'VR')?.level).toBe(0);
  });

  it('leaves other creators unchanged', () => {
    const before = state().members.find((m) => m.id === 'seven');
    state().setSkillLevel('luna', 'VR', 4);
    expect(state().members.find((m) => m.id === 'seven')).toEqual(before);
  });
});
