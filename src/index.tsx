import { useEffect } from 'react';
import Whiskrkit from './NativeWhiskrkit';

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
