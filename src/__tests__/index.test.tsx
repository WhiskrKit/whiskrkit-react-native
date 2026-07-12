import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { initialize, present, checkAndPresent } from '../index';
import NativeWhiskrkit from '../NativeWhiskrkit';

jest.mock('../NativeWhiskrkit', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    present: jest.fn(),
    checkAndPresent: jest.fn(),
  },
}));

const native = jest.mocked(NativeWhiskrkit);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('initialize', () => {
  it('forwards the API key with mocked surveys disabled by default', () => {
    initialize('api-key-123');

    expect(native.initialize).toHaveBeenCalledTimes(1);
    expect(native.initialize).toHaveBeenCalledWith('api-key-123', false);
  });

  it('forwards withMockedSurveys when set', () => {
    initialize('any-key', { withMockedSurveys: true });

    expect(native.initialize).toHaveBeenCalledWith('any-key', true);
  });

  it('treats an explicit withMockedSurveys: false as false', () => {
    initialize('any-key', { withMockedSurveys: false });

    expect(native.initialize).toHaveBeenCalledWith('any-key', false);
  });
});

describe('present', () => {
  it('forwards the survey id', () => {
    present('welcome-toast');

    expect(native.present).toHaveBeenCalledTimes(1);
    expect(native.present).toHaveBeenCalledWith('welcome-toast');
  });
});

describe('checkAndPresent', () => {
  it('forwards the survey id', () => {
    checkAndPresent('choice-survey');

    expect(native.checkAndPresent).toHaveBeenCalledTimes(1);
    expect(native.checkAndPresent).toHaveBeenCalledWith('choice-survey');
  });
});
