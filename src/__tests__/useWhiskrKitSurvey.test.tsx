import { describe, expect, it, jest } from '@jest/globals';

// Run effects synchronously so the hook can be exercised without a renderer.
jest.mock('react', () => ({
  __esModule: true,
  useEffect: (effect: () => void) => effect(),
}));

jest.mock('../NativeWhiskrkit', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    present: jest.fn(),
    checkAndPresent: jest.fn(),
  },
}));

import { useWhiskrKitSurvey } from '../index';
import NativeWhiskrkit from '../NativeWhiskrkit';

const native = jest.mocked(NativeWhiskrkit);

describe('useWhiskrKitSurvey', () => {
  it('runs an eligibility check for the survey id on mount', () => {
    useWhiskrKitSurvey('nps-survey');

    expect(native.checkAndPresent).toHaveBeenCalledTimes(1);
    expect(native.checkAndPresent).toHaveBeenCalledWith('nps-survey');
  });
});
