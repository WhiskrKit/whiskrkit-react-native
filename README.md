![WhiskrKit logo](https://whiskrkit.eu/WhiskrKit_logo.png)
# WhiskrKit for React Native - The purr-fect feedback toolkit for modern apps.

![version](https://img.shields.io/badge/version-0.1.2-blue) ![MIT](https://img.shields.io/badge/license-MIT-green)

WhiskrKit provides a flexible and easy-to-use API for presenting questionnaires and
feedback forms in your React Native applications. This is the React Native wrapper for
[WhiskrKit for iOS](https://whiskrkit.eu) and the [Android SDK](https://whiskrkit.eu);
all three talk to the same backend and share the same survey templates.

Surveys render as fully native UI (toast, sheet, or fullscreen) presented by the native
WhiskrKit SDKs — this package only triggers presentation, no survey UI lives in
JavaScript. It is a thin bridge by design: it exposes exactly what the native SDKs
expose. Like them, it is **fire-and-forget** — calls do not report outcomes, and
failures are logged natively rather than surfaced to JavaScript (see
[Design notes](#design-notes)).

## Features

Surveys are rendered by the native WhiskrKit SDKs, so you get their full feature set
from JavaScript:

* **Multiple question types**: star ratings, thumbs up/down, NPS scales, free text, multiple choice
* **Flexible presentation styles**: toasts (banners), sheets, full-screen forms
* **Fully native UI**: SwiftUI on iOS, Jetpack Compose on Android — no JavaScript survey UI
* **Backend-driven targeting**: session counts, time intervals, audience percentages, repeat policies
* **Offline-safe**: failed submissions queue natively and retry when connectivity returns
* **Accessibility first**: native VoiceOver and TalkBack support on every component

## Requirements

- React Native 0.85+ with the New Architecture (this is a Turbo Module)
- iOS 17+
- Android minSdk 26+

## Installation

```sh
yarn add react-native-whiskrkit
```

### iOS

The native WhiskrKit SDK is distributed as a Swift package, consumed through
the [`cocoapods-spm`](https://github.com/trinhngocthuyen/cocoapods-spm) plugin:

```sh
gem install cocoapods-spm
```

In your app's `Podfile`, declare the plugin and the package source, and make
sure the platform is at least iOS 17:

```ruby
platform :ios, '17.0'
plugin 'cocoapods-spm'

target 'YourApp' do
  spm_pkg "WhiskrKit",
          :url => "https://github.com/whiskrkit/whiskrkit-swift.git",
          :version => "0.1.10"
  # ...
end
```

Then install pods:

```sh
cd ios && pod install
```

### Android

The `eu.whiskrkit:whiskrkit-android` dependency resolves from Maven Central —
no extra setup. Just make sure your app's `minSdkVersion` is 26 or higher.

## Quick start

```tsx
import { initialize, present, checkAndPresent } from 'react-native-whiskrkit';

// Once, at startup — e.g. at the top of your root component's mount.
initialize('your-api-key');

// Manual trigger (bypasses eligibility rules): a feedback button,
// a push notification handler, etc.
present('your-survey-id');

// Backend-controlled targeting, your timing: checks eligibility rules
// configured in the dashboard and presents only if the user qualifies.
checkAndPresent('your-survey-id');
```

During development you can use the SDK's built-in mock surveys without a
backend:

```tsx
initialize('any-string', { withMockedSurveys: true });
present('welcome-toast');
```

## API reference

| Method | Parameters | Returns | Platforms |
| --- | --- | --- | --- |
| `initialize(apiKey, options?)` | `apiKey: string`, `options?: { withMockedSurveys?: boolean }` | `void` | iOS, Android |
| `present(surveyId)` | `surveyId: string` | `void` | iOS, Android |
| `checkAndPresent(surveyId)` | `surveyId: string` | `void` | iOS, Android |

All methods are synchronous and return nothing. `initialize` must be called
before the other two; calls made without it are silent no-ops (logged
natively).

## Design notes

**Fire-and-forget, silent failure.** The native WhiskrKit SDKs deliberately
never surface errors or survey lifecycle events to the host app: the SDK
keeps its own record of shown and completed surveys for eligibility and
repeat-policy decisions, and failures (bad API key, unknown survey ID, no
network) simply mean no survey appears. The wrapper mirrors that contract
instead of inventing a richer one, so there are no promises to await, no
event emitter, and no error codes. When debugging, watch the native logs:
Console.app (subsystem `WhiskrKit`) on iOS, Logcat (tag `WhiskrKit`) on
Android.

**How attachment works.** Native apps attach WhiskrKit with a SwiftUI view
modifier or a Compose host composable. The wrapper does the equivalent
automatically on `initialize`: on iOS it registers your app's window via the
SDK's UIKit attachment point (`WhiskrKit.attach(to:)`), and on Android it
mounts the SDK's `WhiskrKitHost` composable in an overlay over the current
activity. While no survey is on screen the overlay is invisible and passes
all touches through.

## Platform differences

- **Presentation styles** — both platforms render toast (called *banner* in
  the Android SDK), sheet, and fullscreen surveys. The style comes from the
  survey's dashboard configuration, not from the caller.
- **iPad placement (`SheetPlacement` / `ToastPlacement`)** — an iOS-only
  concept controlling where sheet panels and toasts sit on wide screens. The
  wrapper currently leaves the SDK defaults (`bottomCentered`, safe in any
  layout) in place; there is no Android equivalent.
- **Trigger buffering** — on Android, a `present()` fired before the host
  exists is buffered and delivered once it appears; on iOS it is a no-op.
  Calling `initialize` first (which attaches the host) makes this moot.

## Example app

`example/` contains a manual test harness: initialize with mocked surveys,
an editable survey ID with per-style presets, and buttons for both triggers.

```sh
yarn
yarn example ios
yarn example android
```

## License

WhiskrKit is available under the MIT license. See [LICENSE](LICENSE).

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
