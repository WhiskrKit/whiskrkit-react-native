package com.whiskrkit

import android.view.View
import android.view.ViewGroup
import androidx.compose.ui.platform.ComposeView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import eu.whiskrkit.SurveyCompletion
import eu.whiskrkit.WhiskrKit
import eu.whiskrkit.ui.WhiskrKitHost

class WhiskrkitModule(reactContext: ReactApplicationContext) :
  NativeWhiskrkitSpec(reactContext) {

  init {
    // Called on the main thread; the event is emitted to JavaScript as
    // NativeSurveyCompletion (see src/NativeWhiskrkit.ts).
    WhiskrKit.setOnSurveyCompletedListener { completion ->
      emitOnSurveyCompleted(completion.toWritableMap())
    }
  }

  override fun invalidate() {
    WhiskrKit.setOnSurveyCompletedListener(null)
    super.invalidate()
  }

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

  override fun setStringAttribute(key: String, value: String) {
    UiThreadUtil.runOnUiThread { WhiskrKit.setAttribute(key, value) }
  }

  override fun setNumberAttribute(key: String, value: Double) {
    if (!value.isFinite()) return
    UiThreadUtil.runOnUiThread { WhiskrKit.setAttribute(key, value) }
  }

  override fun setBooleanAttribute(key: String, value: Boolean) {
    UiThreadUtil.runOnUiThread { WhiskrKit.setAttribute(key, value) }
  }

  override fun setAttributes(attributes: ReadableMap) {
    val values = attributeValues(attributes)
    UiThreadUtil.runOnUiThread { WhiskrKit.setAttributes(values) }
  }

  override fun removeAttribute(key: String) {
    UiThreadUtil.runOnUiThread { WhiskrKit.removeAttribute(key) }
  }

  override fun clearAttributes() {
    UiThreadUtil.runOnUiThread { WhiskrKit.clearAttributes() }
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

/** The string, number and boolean entries of a JavaScript object. */
internal fun attributeValues(map: ReadableMap): Map<String, Any> {
  val values = mutableMapOf<String, Any>()
  val iterator = map.keySetIterator()
  while (iterator.hasNextKey()) {
    val key = iterator.nextKey()
    when (map.getType(key)) {
      ReadableType.String -> map.getString(key)?.let { values[key] = it }
      ReadableType.Boolean -> values[key] = map.getBoolean(key)
      ReadableType.Number -> map.getDouble(key).takeIf { it.isFinite() }?.let { values[key] = it }
      else -> Unit
    }
  }
  return values
}

/** The event payload; same shape and type names as the iOS module. */
internal fun SurveyCompletion.toWritableMap(): WritableMap {
  val answersArray = Arguments.createArray()
  for (answer in answers) {
    val map = Arguments.createMap()
    map.putString("questionId", answer.questionId)
    map.putString("questionType", answer.questionType.eventName)
    when (val value = answer.value) {
      is SurveyCompletion.Value.Score -> {
        map.putString("valueType", "score")
        map.putInt("score", value.score)
      }
      is SurveyCompletion.Value.Thumbs -> {
        map.putString("valueType", "thumbs")
        map.putBoolean("isUp", value.isUp)
      }
      is SurveyCompletion.Value.Text -> {
        map.putString("valueType", "text")
        map.putString("text", value.text)
      }
      is SurveyCompletion.Value.Choices -> {
        map.putString("valueType", "choices")
        map.putArray("optionIds", Arguments.fromList(value.optionIds))
      }
    }
    answersArray.pushMap(map)
  }
  return Arguments.createMap().apply {
    putString("surveyId", surveyId)
    putArray("answers", answersArray)
  }
}

internal val SurveyCompletion.QuestionType.eventName: String
  get() = when (this) {
    SurveyCompletion.QuestionType.SCALE_RATING -> "scaleRating"
    SurveyCompletion.QuestionType.SYMBOL_RATING -> "symbolRating"
    SurveyCompletion.QuestionType.THUMBS_RATING -> "thumbsRating"
    SurveyCompletion.QuestionType.TEXTUAL_SURVEY -> "textualSurvey"
    SurveyCompletion.QuestionType.MULTIPLE_CHOICE -> "multipleChoice"
  }
