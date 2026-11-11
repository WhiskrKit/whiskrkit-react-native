import { useEffect, useState } from 'react';
import Whiskrkit, {
  type NativeSurveyAnswer,
  type NativeSurveyCompletion,
} from './NativeWhiskrkit';

/**
 * Options for {@link initialize}.
 */
export interface InitializeOptions {
  /**
   * When `true`, the SDK serves built-in mock surveys and logs submissions
   * instead of calling the backend. Use any string as the API key. Intended
   * for development; this option will be removed once the SDK reaches
   * production state.
   */
  withMockedSurveys?: boolean;
}

/**
 * Initializes WhiskrKit with the provided API key.
 *
 * Must be called before any other WhiskrKit function, as early as possible
 * (e.g. at the top of your root component's mount). On iOS this also attaches
 * the survey overlay to your app's window; on Android it mounts the survey
 * host over the current activity.
 *
 * WhiskrKit fails silently by design: if something is wrong (bad API key,
 * no network), no survey appears and details go to the native log
 * (Console.app / Logcat). There is no error callback.
 *
 * @param apiKey Your WhiskrKit API key from the dashboard.
 * @param options See {@link InitializeOptions}.
 */
export function initialize(apiKey: string, options?: InitializeOptions): void {
  Whiskrkit.initialize(apiKey, options?.withMockedSurveys ?? false);
}

/**
 * Imperatively presents a survey, bypassing eligibility checks.
 *
 * Use this for manual triggers: a feedback button, a push notification
 * handler, or any other in-app event where you decide the survey should
 * appear.
 *
 * Fire-and-forget: the call does not report whether a survey was shown.
 * If the survey ID is unknown or the SDK is not initialized, nothing
 * appears and the reason is logged natively.
 *
 * @param surveyId The identifier of the survey to present.
 */
export function present(surveyId: string): void {
  Whiskrkit.present(surveyId);
}

/**
 * Checks eligibility for a survey and presents it only if the user qualifies.
 *
 * Use this when the timing is yours (after a flow completes, a screen closes)
 * but the targeting decision should stay with the backend. Unlike
 * {@link present}, this respects the eligibility rules configured in the
 * WhiskrKit dashboard (session counts, cooldowns, repeat policies).
 *
 * Fire-and-forget: the call does not report the outcome of the eligibility
 * check. Not eligible, unknown survey ID, and network failure all look the
 * same from JavaScript: no survey appears.
 *
 * @param surveyId The identifier of the survey to evaluate and potentially present.
 */
export function checkAndPresent(surveyId: string): void {
  Whiskrkit.checkAndPresent(surveyId);
}

/**
 * Runs an eligibility check for `surveyId` when the component mounts,
 * presenting the survey if the user qualifies. This is the hook form of the
 * native automatic presentation (SwiftUI's `.whiskrKitSurvey` modifier,
 * Jetpack Compose's `WhiskrKitSurvey`): drop it into a screen component and a
 * survey appears on that screen, subject to the eligibility rules configured
 * in the dashboard.
 *
 * Internally it calls {@link checkAndPresent} once per mount, and again if
 * `surveyId` changes. WhiskrKit must be initialized first; see
 * {@link initialize}.
 *
 * @param surveyId The identifier of the survey to evaluate and potentially present.
 */
export function useWhiskrKitSurvey(surveyId: string): void {
  useEffect(() => {
    checkAndPresent(surveyId);
  }, [surveyId]);
}

/** A value that can be sent as a survey attribute. */
export type AttributeValue = string | number | boolean;

function checkAttributeValue(key: string, value: unknown): AttributeValue {
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return value;
  }
  throw new TypeError(
    `WhiskrKit attribute "${key}" must be a string, a finite number or a boolean`
  );
}

/**
 * Sets a global attribute that is sent with every survey response submitted
 * afterwards, for example the user's plan or an experiment variant; it is
 * stored with each response. Attributes live in memory only, so set them
 * again at launch. See https://whiskrkit.eu/docs/attributes/.
 *
 * `value` must be a string, a finite number or a boolean; `null` removes the
 * attribute. Any other type throws a `TypeError`.
 *
 * Do not send personal data (emails, phone numbers, names, IBANs, card
 * numbers): the server drops it. Limits: 20 attributes, keys of 1 to 64
 * characters, text values up to 256 characters; the SDK trims the rest.
 */
export function setAttribute(key: string, value: AttributeValue | null): void {
  if (value === null) {
    Whiskrkit.removeAttribute(key);
    return;
  }
  const checked = checkAttributeValue(key, value);
  if (typeof checked === 'string') {
    Whiskrkit.setStringAttribute(key, checked);
  } else if (typeof checked === 'number') {
    Whiskrkit.setNumberAttribute(key, checked);
  } else {
    Whiskrkit.setBooleanAttribute(key, checked);
  }
}

/**
 * Sets several global attributes at once, merged into the current ones. See
 * {@link setAttribute} for the allowed values.
 */
export function setAttributes(
  attributes: Record<string, AttributeValue>
): void {
  const checked: Record<string, AttributeValue> = {};
  for (const [key, value] of Object.entries(attributes)) {
    checked[key] = checkAttributeValue(key, value);
  }
  Whiskrkit.setAttributes(checked);
}

/** Removes one global attribute. */
export function removeAttribute(key: string): void {
  Whiskrkit.removeAttribute(key);
}

/** Removes all global attributes. */
export function clearAttributes(): void {
  Whiskrkit.clearAttributes();
}

/** The kind of question that was answered. */
export type SurveyQuestionType =
  | 'scaleRating'
  | 'symbolRating'
  | 'thumbsRating'
  | 'textualSurvey'
  | 'multipleChoice';

/** The value the user submitted for one question. */
export type SurveyAnswerValue =
  | { type: 'score'; score: number }
  | { type: 'thumbs'; isUp: boolean }
  | { type: 'text'; text: string }
  | { type: 'choices'; optionIds: string[] };

/** One answered question. */
export interface SurveyAnswer {
  questionId: string;
  questionType: SurveyQuestionType;
  value: SurveyAnswerValue;
}

/**
 * A submitted survey: its id and the answers given, ordered by question id.
 * Questions the user left unanswered are not included.
 */
export interface SurveyCompletion {
  surveyId: string;
  answers: SurveyAnswer[];
}

const questionTypes: ReadonlySet<string> = new Set<SurveyQuestionType>([
  'scaleRating',
  'symbolRating',
  'thumbsRating',
  'textualSurvey',
  'multipleChoice',
]);

function toAnswerValue(answer: NativeSurveyAnswer): SurveyAnswerValue | null {
  switch (answer.valueType) {
    case 'score':
      return typeof answer.score === 'number'
        ? { type: 'score', score: answer.score }
        : null;
    case 'thumbs':
      return typeof answer.isUp === 'boolean'
        ? { type: 'thumbs', isUp: answer.isUp }
        : null;
    case 'text':
      return typeof answer.text === 'string'
        ? { type: 'text', text: answer.text }
        : null;
    case 'choices':
      return Array.isArray(answer.optionIds)
        ? { type: 'choices', optionIds: [...answer.optionIds] }
        : null;
    default:
      return null;
  }
}

/**
 * Converts the native event into a {@link SurveyCompletion}. Answers with an
 * unknown question or value type (from a newer native SDK) are skipped.
 */
export function toSurveyCompletion(
  event: NativeSurveyCompletion
): SurveyCompletion {
  const answers: SurveyAnswer[] = [];
  for (const answer of event.answers) {
    if (!questionTypes.has(answer.questionType)) continue;
    const value = toAnswerValue(answer);
    if (value === null) continue;
    answers.push({
      questionId: answer.questionId,
      questionType: answer.questionType as SurveyQuestionType,
      value,
    });
  }
  return { surveyId: event.surveyId, answers };
}

/** Returned by {@link onSurveyCompleted}; call `remove()` to stop listening. */
export interface Subscription {
  remove(): void;
}

/**
 * Calls `listener` each time the user submits a survey, with the survey id
 * and the answers given (question id, question type and value).
 *
 * It fires as soon as the user submits, whether or not the response reaches
 * the server (a failed submission is queued and retried natively), and never
 * when a survey is dismissed without submitting. It also fires with mocked
 * surveys.
 *
 * ```ts
 * const subscription = onSurveyCompleted((completion) => {
 *   analytics.log('survey_completed', completion.surveyId);
 * });
 * // later
 * subscription.remove();
 * ```
 */
export function onSurveyCompleted(
  listener: (completion: SurveyCompletion) => void
): Subscription {
  return Whiskrkit.onSurveyCompleted((event) =>
    listener(toSurveyCompletion(event))
  );
}

/**
 * Hook form of {@link onSurveyCompleted}: listens while the component is
 * mounted. The latest `listener` is always called, so it can be an inline
 * function.
 */
export function useSurveyCompleted(
  listener: (completion: SurveyCompletion) => void
): void {
  const latest = useLatest(listener);
  useEffect(() => {
    const subscription = onSurveyCompleted((completion) =>
      latest.current(completion)
    );
    return () => subscription.remove();
  }, [latest]);
}

function useLatest<T>(value: T): { current: T } {
  const [ref] = useState(() => ({ current: value }));
  ref.current = value;
  return ref;
}
