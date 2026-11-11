import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  clearAttributes,
  onSurveyCompleted,
  removeAttribute,
  setAttribute,
  setAttributes,
  toSurveyCompletion,
  type SurveyCompletion,
} from '../index';
import NativeWhiskrkit, {
  type NativeSurveyCompletion,
} from '../NativeWhiskrkit';

type Listener = (event: NativeSurveyCompletion) => void;
const mockListeners = new Set<Listener>();

jest.mock('../NativeWhiskrkit', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    present: jest.fn(),
    checkAndPresent: jest.fn(),
    setStringAttribute: jest.fn(),
    setNumberAttribute: jest.fn(),
    setBooleanAttribute: jest.fn(),
    setAttributes: jest.fn(),
    removeAttribute: jest.fn(),
    clearAttributes: jest.fn(),
    onSurveyCompleted: jest.fn((listener: Listener) => {
      mockListeners.add(listener);
      return { remove: () => mockListeners.delete(listener) };
    }),
  },
}));

const native = jest.mocked(NativeWhiskrkit);

function emit(event: NativeSurveyCompletion) {
  mockListeners.forEach((listener) => listener(event));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockListeners.clear();
});

describe('setAttribute', () => {
  it('sends strings, numbers and booleans to the matching native method', () => {
    setAttribute('plan', 'pro');
    setAttribute('sessions', 3);
    setAttribute('beta', true);

    expect(native.setStringAttribute).toHaveBeenCalledWith('plan', 'pro');
    expect(native.setNumberAttribute).toHaveBeenCalledWith('sessions', 3);
    expect(native.setBooleanAttribute).toHaveBeenCalledWith('beta', true);
  });

  it('removes the attribute for null', () => {
    setAttribute('plan', null);

    expect(native.removeAttribute).toHaveBeenCalledWith('plan');
    expect(native.setStringAttribute).not.toHaveBeenCalled();
  });

  it('rejects other types and non-finite numbers', () => {
    expect(() => setAttribute('n', Number.NaN)).toThrow(TypeError);
    expect(() => setAttribute('n', Infinity)).toThrow(TypeError);
    expect(() => setAttribute('o', {} as unknown as string)).toThrow(TypeError);
    expect(native.setNumberAttribute).not.toHaveBeenCalled();
  });
});

describe('setAttributes', () => {
  it('passes the attributes through as one object', () => {
    setAttributes({ tier: 'gold', onboarded: true, seats: 4 });

    expect(native.setAttributes).toHaveBeenCalledWith({
      tier: 'gold',
      onboarded: true,
      seats: 4,
    });
  });

  it('rejects the whole call when one value is invalid', () => {
    expect(() =>
      setAttributes({ ok: 'yes', bad: [] as unknown as string })
    ).toThrow(TypeError);
    expect(native.setAttributes).not.toHaveBeenCalled();
  });
});

it('removeAttribute and clearAttributes forward to native', () => {
  removeAttribute('tier');
  clearAttributes();

  expect(native.removeAttribute).toHaveBeenCalledWith('tier');
  expect(native.clearAttributes).toHaveBeenCalledTimes(1);
});

describe('onSurveyCompleted', () => {
  const event: NativeSurveyCompletion = {
    surveyId: 's1',
    answers: [
      {
        questionId: 's1-q1',
        questionType: 'scaleRating',
        valueType: 'score',
        score: 9,
      },
      {
        questionId: 's1-q2',
        questionType: 'thumbsRating',
        valueType: 'thumbs',
        isUp: false,
      },
      {
        questionId: 's1-q3',
        questionType: 'textualSurvey',
        valueType: 'text',
        text: 'Great',
      },
      {
        questionId: 's1-q4',
        questionType: 'multipleChoice',
        valueType: 'choices',
        optionIds: ['a', 'c'],
      },
    ],
  };

  const expected: SurveyCompletion = {
    surveyId: 's1',
    answers: [
      {
        questionId: 's1-q1',
        questionType: 'scaleRating',
        value: { type: 'score', score: 9 },
      },
      {
        questionId: 's1-q2',
        questionType: 'thumbsRating',
        value: { type: 'thumbs', isUp: false },
      },
      {
        questionId: 's1-q3',
        questionType: 'textualSurvey',
        value: { type: 'text', text: 'Great' },
      },
      {
        questionId: 's1-q4',
        questionType: 'multipleChoice',
        value: { type: 'choices', optionIds: ['a', 'c'] },
      },
    ],
  };

  it('delivers each native event as a SurveyCompletion', () => {
    const received: SurveyCompletion[] = [];
    onSurveyCompleted((completion) => received.push(completion));

    emit(event);

    expect(received).toEqual([expected]);
  });

  it('stops delivering after remove()', () => {
    const listener = jest.fn();
    const subscription = onSurveyCompleted(listener);

    subscription.remove();
    emit(event);

    expect(listener).not.toHaveBeenCalled();
  });

  it('skips answers with an unknown question or value type', () => {
    const completion = toSurveyCompletion({
      surveyId: 's',
      answers: [
        {
          questionId: 'a',
          questionType: 'futureType',
          valueType: 'score',
          score: 1,
        },
        {
          questionId: 'b',
          questionType: 'symbolRating',
          valueType: 'futureValue',
        },
        { questionId: 'c', questionType: 'symbolRating', valueType: 'score' },
        {
          questionId: 'd',
          questionType: 'symbolRating',
          valueType: 'score',
          score: 4,
        },
      ],
    });

    expect(completion.answers).toEqual([
      {
        questionId: 'd',
        questionType: 'symbolRating',
        value: { type: 'score', score: 4 },
      },
    ]);
  });
});
