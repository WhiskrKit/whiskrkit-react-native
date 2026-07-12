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
@objc(WhiskrKitBridge)
public final class WhiskrKitBridge: NSObject {

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
