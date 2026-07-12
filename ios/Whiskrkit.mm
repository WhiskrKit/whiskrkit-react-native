#import "Whiskrkit.h"
#import "WhiskrkitReactNative-Swift.h"

@implementation Whiskrkit

- (void)initialize:(NSString *)apiKey withMockedSurveys:(BOOL)withMockedSurveys {
    [WhiskrKitBridge initializeWithApiKey:apiKey withMockedSurveys:withMockedSurveys];
}

- (void)present:(NSString *)surveyId {
    [WhiskrKitBridge presentWithSurveyId:surveyId];
}

- (void)checkAndPresent:(NSString *)surveyId {
    [WhiskrKitBridge checkAndPresentWithSurveyId:surveyId];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeWhiskrkitSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"Whiskrkit";
}

@end
