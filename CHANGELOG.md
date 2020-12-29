# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [4.1.1](https://github.com/lightpohl/podcast-dl/compare/v4.1.0...v4.1.1) (2020-12-29)


### Bug Fixes

* the most recent episode should be downloaded when using '--reverse' ([709312b](https://github.com/lightpohl/podcast-dl/commit/709312b1307d35e6082447719fc786892700f3e8)), closes [#16](https://github.com/lightpohl/podcast-dl/issues/16)

## [4.1.0](https://github.com/lightpohl/podcast-dl/compare/v4.0.1...v4.1.0) (2020-08-15)


### Features

* add templating support to '--archive' option ([f8ed4fb](https://github.com/lightpohl/podcast-dl/commit/f8ed4fb7192b5d9441516c8ce262d568a76992b5)), closes [#15](https://github.com/lightpohl/podcast-dl/issues/15)

### [4.0.1](https://github.com/lightpohl/podcast-dl/compare/v4.0.0...v4.0.1) (2020-08-09)


### Bug Fixes

* include generic accept header for compatibility with some podcast servers ([a12b1da](https://github.com/lightpohl/podcast-dl/commit/a12b1da11418c5dc3180885376b1d87b8db43f93)), closes [#13](https://github.com/lightpohl/podcast-dl/issues/13)

## [4.0.0](https://github.com/lightpohl/podcast-dl/compare/v3.0.0...v4.0.0) (2020-08-01)

### Breaking Changes

* remove `--prompt` option

### Features

* add '--episode-regex' option ([24c74ba](https://github.com/lightpohl/podcast-dl/commit/24c74ba822e2dde5cc63ee24770c1cf8dc1b0a44))


### [3.0.1](https://github.com/lightpohl/podcast-dl/compare/v3.0.0...v3.0.1) (2020-07-15)


### Bug Fixes

* better handle missing properties for name templating ([ae25272](https://github.com/lightpohl/podcast-dl/commit/ae25272366bdd7229448008f59ccb942b56eb742))

## [3.0.0](https://github.com/lightpohl/podcast-dl/compare/v2.0.0...v3.0.0) (2020-07-04)

### Breaking Changes

* guard against overriding local files
* add '--override' flag for previous behavior

## [2.0.0](https://github.com/lightpohl/podcast-dl/compare/v1.6.1...v2.0.0) (2020-06-06)

### Breaking Changes

* add recursive flag to mkdir for '--out-dir'
* use podcast title in meta file name if available
* default '--out-dir' to podcast specific folder
* include podcast title name in feed image

### [1.6.1](https://github.com/lightpohl/podcast-dl/compare/v1.6.0...v1.6.1) (2020-05-24)


### Bug Fixes

* do not show "100%" progress when dowload first starts ([3bc3152](https://github.com/lightpohl/podcast-dl/commit/3bc315265e95fee54464e6125598d668b9f3f27e))

## [1.6.0](https://github.com/lightpohl/podcast-dl/compare/v1.5.0...v1.6.0) (2020-05-17)


### Features

* add podcast title/link templating options to '--out-dir' ([b4c526b](https://github.com/lightpohl/podcast-dl/commit/b4c526bf54c83863262c81b0e9a35c6a0adc411f))

## [1.5.0](https://github.com/lightpohl/podcast-dl/compare/v1.4.6...v1.5.0) (2020-05-17)


### Features

* add '--episode-template' option ([93044d5](https://github.com/lightpohl/podcast-dl/commit/93044d5da53b05eddbc10ec4efda2711609916b8)), closes [#4](https://github.com/lightpohl/podcast-dl/issues/4)

### [1.4.6](https://github.com/lightpohl/podcast-dl/compare/v1.4.5...v1.4.6) (2020-05-11)


### Bug Fixes

* do not archive if file fails to save ([dfe9656](https://github.com/lightpohl/podcast-dl/commit/dfe96560724fd6d1f5462c86595d4d613037c669))

### [1.4.5](https://github.com/lightpohl/podcast-dl/compare/v1.4.4...v1.4.5) (2020-05-10)


### Bug Fixes

* infinite error after unable to find episode URL ([43817d6](https://github.com/lightpohl/podcast-dl/commit/43817d6e096fb1b7de7914e25ecf55ec77065b7a))

### [1.4.4](https://github.com/lightpohl/podcast-dl/compare/v1.4.3...v1.4.4) (2020-05-10)


### Bug Fixes

* add HEAD check before asset downloads ([2b6edf2](https://github.com/lightpohl/podcast-dl/commit/2b6edf27ac5d1a6602f33326daef7a3b597b78c7))

### [1.4.3](https://github.com/lightpohl/podcast-dl/compare/v1.4.2...v1.4.3) (2020-05-09)

### [1.4.2](https://github.com/lightpohl/podcast-dl/compare/v1.4.1...v1.4.2) (2020-05-09)


### Bug Fixes

* add download cleanup on error: ([978db00](https://github.com/lightpohl/podcast-dl/commit/978db005148e5f44cb7f0341ca49b48b60848dfc))

### [1.4.1](https://github.com/lightpohl/podcast-dl/compare/v1.4.0...v1.4.1) (2020-05-09)


### Bug Fixes

* episode images should not override episodes ([7716bdc](https://github.com/lightpohl/podcast-dl/commit/7716bdc45629fc7a1f2fe84b13e3167a924117d0))

## [1.4.0](https://github.com/lightpohl/podcast-dl/compare/v1.3.1...v1.4.0) (2020-05-09)


### Features

* add --archive option ([29b6399](https://github.com/lightpohl/podcast-dl/commit/29b63996e07e44b142fda470904c12dbc948ba72)), closes [#2](https://github.com/lightpohl/podcast-dl/issues/2)


### Bug Fixes

* 'episodes' typo in prompt after selecting episodes ([6e06ec3](https://github.com/lightpohl/podcast-dl/commit/6e06ec37cea6b3a17c7607d5820955b389e81cc0))

### [1.3.1](https://github.com/lightpohl/podcast-dl/compare/v1.3.0...v1.3.1) (2020-05-08)


### Bug Fixes

* counter in prompt loop incorrect ([2f2f0ae](https://github.com/lightpohl/podcast-dl/commit/2f2f0aea8a4e3d28b0ae3915a3f087999d9b1763))

## [1.3.0](https://github.com/lightpohl/podcast-dl/compare/v1.2.0...v1.3.0) (2020-05-08)


### Features

* add basic --prompt option ([225db58](https://github.com/lightpohl/podcast-dl/commit/225db58767112e39f28db5b859a9c9d61f7cafeb))

## [1.2.0](https://github.com/lightpohl/podcast-dl/compare/v1.1.1...v1.2.0) (2020-05-07)


### Features

* add --list option for episode data ([90b3b80](https://github.com/lightpohl/podcast-dl/commit/90b3b80464e96f14a23c8a21ddd502c591ec6a0f))
* add --reverse option ([dcae39c](https://github.com/lightpohl/podcast-dl/commit/dcae39c0552de9401846e4a41beda7db077a77e8))

### [1.1.1](https://github.com/lightpohl/podcast-dl/compare/v1.1.0...v1.1.1) (2020-04-30)

## [1.1.0](https://github.com/lightpohl/podcast-dl/compare/v1.0.2...v1.1.0) (2020-04-27)


### Features

* add --offset and --limit options ([b71bc91](https://github.com/lightpohl/podcast-dl/commit/b71bc91e53ce2b6b8a32255afca6cc9b1cfa244e))


### Bug Fixes

* only pluralize episodes when not 1 item ([9449899](https://github.com/lightpohl/podcast-dl/commit/94498990569a81b6f06d37f2a2a0f64d72bdcc56))

### [1.0.2](https://github.com/lightpohl/podcast-dl/compare/v1.0.1...v1.0.2) (2020-04-26)


### Bug Fixes

* incorrectly referenced bin ([921a887](https://github.com/lightpohl/podcast-dl/commit/921a887508160bc3e58cb633301da9774062d586))

### [1.0.1](https://github.com/lightpohl/podcast-dl/compare/v1.0.0...v1.0.1) (2020-04-26)

## 1.0.0 (2020-04-26)


### Features

* add initial download script ([166426a](https://github.com/lightpohl/podcast-dl/commit/166426a54a135f558f9665188cee2c50ea8a3f7f))
* add metadata retrieval options ([912062a](https://github.com/lightpohl/podcast-dl/commit/912062adfbd163c44f36c4fd73d0fc47fb12f195))
