import {
  TurboModuleRegistry,
  type CodegenTypes,
  type TurboModule,
} from 'react-native';

/**
 * One submitted answer as the native modules send it. Codegen has no union
 * types, so exactly one of the value fields is set, named by `valueType`
 * (`score`, `thumbs`, `text` or `choices`).
 */
export type NativeSurveyAnswer = {
  questionId: string;
  questionType: string;
  valueType: string;
  score?: CodegenTypes.Int32;
  isUp?: boolean;
  text?: string;
  optionIds?: ReadonlyArray<string>;
};

export type NativeSurveyCompletion = {
  surveyId: string;
  answers: ReadonlyArray<NativeSurveyAnswer>;
};

export interface Spec extends TurboModule {
  initialize(apiKey: string, withMockedSurveys: boolean): void;
  present(surveyId: string): void;
  checkAndPresent(surveyId: string): void;

  setStringAttribute(key: string, value: string): void;
  setNumberAttribute(key: string, value: CodegenTypes.Double): void;
  setBooleanAttribute(key: string, value: boolean): void;
  setAttributes(attributes: CodegenTypes.UnsafeObject): void;
  removeAttribute(key: string): void;
  clearAttributes(): void;

  readonly onSurveyCompleted: CodegenTypes.EventEmitter<NativeSurveyCompletion>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Whiskrkit');
