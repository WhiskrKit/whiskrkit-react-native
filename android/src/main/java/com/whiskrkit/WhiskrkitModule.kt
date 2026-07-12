package com.whiskrkit

import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import eu.whiskrkit.WhiskrKit
import eu.whiskrkit.ui.WhiskrKitHost

class WhiskrkitModule(reactContext: ReactApplicationContext) :
  NativeWhiskrkitSpec(reactContext) {

  override fun initialize(apiKey: String, withMockedSurveys: Boolean) {
    UiThreadUtil.runOnUiThread {
      WhiskrKit.initialize(reactApplicationContext, apiKey, withMockedSurveys)
      attachHostIfNeeded()
    }
  }

  override fun present(surveyId: String) {
    UiThreadUtil.runOnUiThread {
      attachHostIfNeeded()
      WhiskrKit.present(surveyId)
    }
  }

  override fun checkAndPresent(surveyId: String) {
    UiThreadUtil.runOnUiThread {
      attachHostIfNeeded()
      WhiskrKit.checkAndPresent(surveyId)
    }
  }

  /**
   * Mounts the WhiskrKitHost composable in a ComposeView laid over the
   * current activity's content. This is the React Native equivalent of
   * wrapping the root composable in `WhiskrKitHost { ... }`: the host is
   * where all survey presentations render, and with no survey on screen it
   * draws nothing and consumes no touches.
   *
   * Called before every SDK call (tag-guarded, so at most one host exists per
   * activity) to survive activity recreation and dev reloads. Runs on the UI
   * thread.
   */
  private fun attachHostIfNeeded() {
    val activity = reactApplicationContext.currentActivity ?: return
    val root = activity.findViewById<ViewGroup>(android.R.id.content) ?: return
    if (root.findViewWithTag<View>(HOST_TAG) != null) return

    val host = ComposeView(activity).apply {
      tag = HOST_TAG
      setContent { WhiskrKitHost { } }
    }
    root.addView(
      host,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )
  }

  companion object {
    const val NAME = NativeWhiskrkitSpec.NAME
    private const val HOST_TAG = "whiskrkit_survey_host"
  }
}
