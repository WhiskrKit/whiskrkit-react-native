# Changelog

All notable changes to the WhiskrKit React Native wrapper are listed here.
Versions follow [Semantic Versioning](https://semver.org) and mirror the native
SDK version they require.

Add a line under **Unreleased** in each pull request. When releasing, rename
**Unreleased** to the new version and date, and start a new empty section.

## Unreleased

## 0.3.0 - 2026-11-23

Mirrors native SDK version 0.3.0. No changes to the JavaScript API.

- Requires whiskrkit-swift 0.3.0 and whiskrkit-android 0.3.0. Those versions
  render the rating metric the server sends with scale questions (NPS, CSAT,
  CES or custom): fixed colors per metric with an outline on the selected
  score, translated end labels under the scale, stars for 1 to 5 ratings shown
  as stars, and buttons that grow with the text size. No app changes are
  needed. Scale questions from a server without metrics show the neutral
  selected color instead of the old red to green gradient.
- The native SDKs now send `X-WhiskrKit-SDK` with their platform and version,
  for example `ios/0.3.0`. It names the native SDK, not this wrapper.

### Fixed

- On iOS, deselecting a scale rating (tapping the selected score again) no
  longer submits the old score. Fixed in whiskrkit-swift 0.3.0.

## 0.2.0 and earlier

Not recorded here; see the git history and the release tags.
