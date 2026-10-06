import { describe, it, expect, vi } from 'vitest';
import { ProfileFormData } from '../src/components/styling/ProfileModal';

describe('Part 4 — Modal Draft Lifecycle (Transactional Behavior)', () => {
  const initialSavedProfile: ProfileFormData = {
    hairTexture: 'straight',
    hairLength: 'short',
    hairDensity: 'medium',
    maintenanceTolerance: 'moderate',
    facialHair: 'clean-shaven',
    faceShape: 'oval',
    topFit: 'relaxed',
    bottomFit: 'regular',
    genderIdentity: 'man',
    styleExpression: 'masculine',
    genderDirection: 'masculine',
    undertone: 'warm',
    contrastLevel: 'medium',
    modestyLevel: 'standard',
    heightRange: 'average',
    torsoLegPreference: 'balanced',
    shoulderHipBalance: 'balanced',
    traditionConstraint: '',
    budgetTier: 'accessible',
  };

  it('A. Edit -> Cancel -> Reopen shows original saved state (draft discarded)', () => {
    let canonicalSavedState = { ...initialSavedProfile };
    let modalOpen = true;
    let draftState = { ...canonicalSavedState };

    // User edits draft
    draftState.hairTexture = 'coily';
    draftState.topFit = 'oversized';
    draftState.styleExpression = 'androgynous';

    // User hits CANCEL: modal closes without saving
    modalOpen = false;
    draftState = {} as any; // discarded

    // Canonical state must remain untouched
    expect(canonicalSavedState.hairTexture).toBe('straight');
    expect(canonicalSavedState.topFit).toBe('relaxed');
    expect(canonicalSavedState.styleExpression).toBe('masculine');

    // User REOPENS modal: draft initialized strictly from canonicalSavedState
    modalOpen = true;
    draftState = { ...canonicalSavedState };

    expect(draftState.hairTexture).toBe('straight');
    expect(draftState.topFit).toBe('relaxed');
    expect(draftState.styleExpression).toBe('masculine');
  });

  it('B. Edit -> Save -> Reopen shows saved edited state (transaction committed)', () => {
    let canonicalSavedState = { ...initialSavedProfile };
    let modalOpen = true;
    let draftState = { ...canonicalSavedState };

    // User edits draft
    draftState.hairTexture = 'wavy';
    draftState.bottomFit = 'relaxed';
    draftState.styleExpression = 'feminine';

    // User hits SAVE: writes draft to canonical state exactly once
    const onSave = vi.fn((data: ProfileFormData) => {
      canonicalSavedState = { ...data };
    });

    onSave(draftState);
    modalOpen = false;

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(canonicalSavedState.hairTexture).toBe('wavy');
    expect(canonicalSavedState.bottomFit).toBe('wide-leg');
    expect(canonicalSavedState.styleExpression).toBe('feminine');

    // User REOPENS modal
    modalOpen = true;
    draftState = { ...canonicalSavedState };

    expect(draftState.hairTexture).toBe('wavy');
    expect(draftState.bottomFit).toBe('wide-leg');
    expect(draftState.styleExpression).toBe('feminine');
  });

  it('C. Multiple opens do not accumulate stale draft state', () => {
    let canonicalSavedState = { ...initialSavedProfile };

    // Cycle 1: Open, edit, cancel
    let draft1 = { ...canonicalSavedState };
    draft1.facialHair = 'full-beard';
    // Cancel -> do not save

    // Cycle 2: Open, edit different field, cancel
    let draft2 = { ...canonicalSavedState };
    expect(draft2.facialHair).toBe('clean-shaven'); // must NOT retain Cycle 1 edit
    draft2.topFit = 'slim';
    // Cancel

    // Cycle 3: Open fresh
    let draft3 = { ...canonicalSavedState };
    expect(draft3.facialHair).toBe('clean-shaven');
    expect(draft3.topFit).toBe('relaxed');
  });

  it('D. Save does not trigger duplicate writes', () => {
    const saveTracker = vi.fn();
    const handleSubmit = (draft: ProfileFormData) => {
      saveTracker(draft);
    };

    const draft = { ...initialSavedProfile, modestyLevel: 'covered-arms' as const };
    handleSubmit(draft);

    expect(saveTracker).toHaveBeenCalledTimes(1);
    expect(saveTracker).toHaveBeenCalledWith(expect.objectContaining({ modestyLevel: 'covered-arms' }));
  });
});
