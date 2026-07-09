package com.whiskrkit

import com.facebook.react.bridge.ReactApplicationContext

class WhiskrkitModule(reactContext: ReactApplicationContext) :
  NativeWhiskrkitSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeWhiskrkitSpec.NAME
  }
}
