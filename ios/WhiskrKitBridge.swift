//
//  WhiskrKitBridge.swift
//  react-native-whiskrkit
//
//  Copyright (c) 2026 Dennis Vermeulen
//  Licensed under the MIT License. See LICENSE file for details.
//

import UIKit
import WhiskrKit

/// Thin Swift shim between the ObjC++ Turbo Module and the Swift-only
/// WhiskrKit SDK. All SDK calls hop to the main actor, matching the SDK's
/// `@MainActor` isolation; every method is fire-and-forget, mirroring the
/// SDK's silent-failure contract (failures go to the native log).
///
/// The one event in the other direction is a survey completion, handed to the
/// Turbo Module through `setSurveyCompletedHandler` and emitted to JavaScript.
@objc(WhiskrKitBridge)
public final class WhiskrKitBridge: NSObject {

  /// Registers (or with `nil`, removes) the receiver of survey completions,
  /// as the dictionary shape `NativeSurveyCompletion` in NativeWhiskrkit.ts.
  @objc public static func setSurveyCompletedHandler(_ handler: (@Sendable (NSDictionary) -> Void)?) {
    Task { @MainActor in
      guard let handler else {
        WhiskrKit.shared.onSurveyCompleted = nil
        return
      }
      WhiskrKit.shared.onSurveyCompleted = { completion in
        handler(Self.dictionary(for: completion) as NSDictionary)
      }
    }
  }

  @objc public static func setStringAttribute(key: String, value: String) {
    Task { @MainActor in WhiskrKit.shared.setAttribute(key, .string(value)) }
  }

  @objc public static func setNumberAttribute(key: String, value: Double) {
    guard value.isFinite else { return }
    Task { @MainActor in WhiskrKit.shared.setAttribute(key, .number(value)) }
  }

  @objc public static func setBooleanAttribute(key: String, value: Bool) {
    Task { @MainActor in WhiskrKit.shared.setAttribute(key, .bool(value)) }
  }

  @objc public static func setAttributes(_ attributes: NSDictionary) {
    var values: [String: AttributeValue] = [:]
    for case let (key as String, raw) in attributes {
      if let value = attributeValue(raw) { values[key] = value }
    }
    Task { @MainActor in WhiskrKit.shared.setAttributes(values) }
  }

  @objc public static func removeAttribute(key: String) {
    Task { @MainActor in WhiskrKit.shared.removeAttribute(key) }
  }

  @objc public static func clearAttributes() {
    Task { @MainActor in WhiskrKit.shared.clearAttributes() }
  }

  /// JavaScript booleans and numbers both arrive as NSNumber; only a CFBoolean is a bool.
  static func attributeValue(_ raw: Any) -> AttributeValue? {
    switch raw {
    case let string as String:
      return .string(string)
    case let number as NSNumber:
      if CFGetTypeID(number) == CFBooleanGetTypeID() { return .bool(number.boolValue) }
      let double = number.doubleValue
      return double.isFinite ? .number(double) : nil
    default:
      return nil
    }
  }

  static func dictionary(for completion: SurveyCompletion) -> [String: Any] {
    [
      "surveyId": completion.surveyId,
      "answers": completion.answers.map { answer -> [String: Any] in
        var map: [String: Any] = [
          "questionId": answer.questionId,
          "questionType": answer.questionType.rawValue,
        ]
        switch answer.value {
        case .score(let score):
          map["valueType"] = "score"
          map["score"] = score
        case .thumbs(let isUp):
          map["valueType"] = "thumbs"
          map["isUp"] = isUp
        case .text(let text):
          map["valueType"] = "text"
          map["text"] = text
        case .choices(let ids):
          map["valueType"] = "choices"
          map["optionIds"] = ids
        }
        return map
      },
    ]
  }

  @objc public static func initialize(apiKey: String, withMockedSurveys: Bool) {
    Task { @MainActor in
      WhiskrKit.shared.initialize(apiKey: apiKey, withMockedSurveys: withMockedSurveys)
      attachToHostWindow()
    }
  }

  @objc public static func present(surveyId: String) {
    Task { @MainActor in
      attachToHostWindow()
      WhiskrKit.shared.present(surveyId: surveyId)
    }
  }

  @objc public static func checkAndPresent(surveyId: String) {
    Task { @MainActor in
      attachToHostWindow()
      WhiskrKit.shared.checkAndPresent(surveyId: surveyId)
    }
  }

  /// Registers the app's window as the survey attachment point. Safe to call
  /// repeatedly: the SDK treats a re-attach to the same scene as a no-op, so
  /// each trigger self-heals the attachment if the app's windows changed.
  @MainActor
  private static func attachToHostWindow() {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    guard let window = scene?.windows.first(where: \.isKeyWindow) ?? scene?.windows.first else {
      return
    }
    WhiskrKit.shared.attach(to: window)
  }
}
