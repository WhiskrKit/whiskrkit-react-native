#import "Whiskrkit.h"
#import "WhiskrkitReactNative-Swift.h"

@implementation Whiskrkit

- (instancetype)init
{
    if (self = [super init]) {
        __weak Whiskrkit *weakSelf = self;
        [WhiskrKitBridge setSurveyCompletedHandler:^(NSDictionary *completion) {
            [weakSelf emitOnSurveyCompleted:completion];
        }];
    }
    return self;
}

- (void)invalidate
{
    [WhiskrKitBridge setSurveyCompletedHandler:nil];
}

- (void)initialize:(NSString *)apiKey withMockedSurveys:(BOOL)withMockedSurveys {
    [WhiskrKitBridge initializeWithApiKey:apiKey withMockedSurveys:withMockedSurveys];
}

- (void)present:(NSString *)surveyId {
    [WhiskrKitBridge presentWithSurveyId:surveyId];
}

- (void)checkAndPresent:(NSString *)surveyId {
    [WhiskrKitBridge checkAndPresentWithSurveyId:surveyId];
}

- (void)setStringAttribute:(NSString *)key value:(NSString *)value {
    [WhiskrKitBridge setStringAttributeWithKey:key value:value];
}

- (void)setNumberAttribute:(NSString *)key value:(double)value {
    [WhiskrKitBridge setNumberAttributeWithKey:key value:value];
}

- (void)setBooleanAttribute:(NSString *)key value:(BOOL)value {
    [WhiskrKitBridge setBooleanAttributeWithKey:key value:value];
}

- (void)setAttributes:(NSDictionary *)attributes {
    [WhiskrKitBridge setAttributes:attributes];
}

- (void)removeAttribute:(NSString *)key {
    [WhiskrKitBridge removeAttributeWithKey:key];
}

- (void)clearAttributes {
    [WhiskrKitBridge clearAttributes];
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
