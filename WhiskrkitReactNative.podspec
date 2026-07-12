require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  # Deliberately not "Whiskrkit": the WhiskrKit SDK ships as a Swift package
  # whose module is `WhiskrKit`, and a pod that differs only in letter case
  # collides with it in build products on case-insensitive file systems.
  s.name         = "WhiskrkitReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # WhiskrKit requires iOS 17.
  s.platforms    = { :ios => "17.0" }
  s.source       = { :git => "https://github.com/WhiskrKit/whiskrkit-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  s.private_header_files = "ios/**/*.h"
  s.swift_version = "5.0"

  # The native WhiskrKit SDK, consumed as a Swift package via the
  # cocoapods-spm plugin. The consuming app's Podfile must declare the
  # package source with `spm_pkg` — see the example app's Podfile and the
  # README's installation section.
  s.spm_dependency "WhiskrKit/WhiskrKit"

  install_modules_dependencies(s)
end
