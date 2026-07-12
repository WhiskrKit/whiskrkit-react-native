import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  initialize(apiKey: string, withMockedSurveys: boolean): void;
  present(surveyId: string): void;
  checkAndPresent(surveyId: string): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Whiskrkit');
