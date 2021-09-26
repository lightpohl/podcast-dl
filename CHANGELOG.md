# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [7.0.0-async.1](https://github.com/lightpohl/podcast-dl/compare/v7.0.0-async.0...v7.0.0-async.1) (2021-09-26)


### Features

* check for ffmpeg during validation if option requires it ([d8638d2](https://github.com/lightpohl/podcast-dl/commit/d8638d26b7deafc4b025a827214fbbc276a536ea))


### Bug Fixes

* set max on number of threads to 32 ([22b8b99](https://github.com/lightpohl/podcast-dl/commit/22b8b997c1272d8bd5448f7c169c88e24fa450e3))

## [7.0.0-async.0](https://github.com/lightpohl/podcast-dl/compare/v6.1.0...v7.0.0-async.0) (2021-09-22)


### ⚠ BREAKING CHANGES

* support multiple downloads via --threads

### Features

* support multiple downloads via --threads ([c4d3ef1](https://github.com/lightpohl/podcast-dl/commit/c4d3ef10b0d393cebdce78037bf121a6018b3bc1))

## [6.1.0](https://github.com/lightpohl/podcast-dl/compare/v6.0.0...v6.1.0) (2021-08-15)


### Features

* add 'static' log level support ([66b5934](https://github.com/lightpohl/podcast-dl/commit/66b593430ccbfea110cc0c6a809646b0390d02ba)), closes [#32](https://github.com/lightpohl/podcast-dl/issues/32)


### Bug Fixes

* cleanup any temp files if ffmpeg fails ([c4a5408](https://github.com/lightpohl/podcast-dl/commit/c4a5408c05445f43cbb3d651dbab4d7cb2e81d72))

## [6.0.0](https://github.com/lightpohl/podcast-dl/compare/v5.4.0...v6.0.0) (2021-08-13)


### ⚠ BREAKING CHANGES

* consolidate '--list' and '--list-format'

### Features

* consolidate '--list' and '--list-format' ([ce47051](https://github.com/lightpohl/podcast-dl/commit/ce47051475cb212c0460bcad4071d4166b9633ca))


### Bug Fixes

* better error message when archive write fails ([42de1f0](https://github.com/lightpohl/podcast-dl/commit/42de1f029d118de7a936e40d205459d674d76592))
* issue with '--archive' default ([551c0a8](https://github.com/lightpohl/podcast-dl/commit/551c0a891423d5d4e1458f35c17161dd386c30f4))

## [5.4.0](https://github.com/lightpohl/podcast-dl/compare/v5.3.0...v5.4.0) (2021-08-13)


### Features

* add '--before' and '--after' options ([a45e95a](https://github.com/lightpohl/podcast-dl/commit/a45e95a892ee939ab3b3eb8e5d36133b1bf9e1f0)), closes [#31](https://github.com/lightpohl/podcast-dl/issues/31)
* add default path when '--archive' is enabled ([8100739](https://github.com/lightpohl/podcast-dl/commit/8100739dfc887da3a943823dd26bd5c46dcd5430))


### Bug Fixes

* don't create folder when running info commands ([0a3e884](https://github.com/lightpohl/podcast-dl/commit/0a3e88484a66627d739039fce160185c39e8bfa6))
* log a message when ffmpeg starts ([037f448](https://github.com/lightpohl/podcast-dl/commit/037f448e00164bcc48298bbb8a9df9f5596f5b41))

## [5.3.0](https://github.com/lightpohl/podcast-dl/compare/v5.2.0...v5.3.0) (2021-08-11)


### Features

* add '--mono' option ([ade68aa](https://github.com/lightpohl/podcast-dl/commit/ade68aa6e7612a21e1354143b4d6bf673b20aad4))

## [5.2.0](https://github.com/lightpohl/podcast-dl/compare/v5.1.0...v5.2.0) (2021-08-11)


### Features

* add '--adjust-bitrate' option ([029ef66](https://github.com/lightpohl/podcast-dl/commit/029ef66143031ff51be748f68c2fb667bb6f3384))

## [5.1.0](https://github.com/lightpohl/podcast-dl/compare/v5.0.2...v5.1.0) (2021-08-08)


### Features

* add '--list-format' options ([c68aa43](https://github.com/lightpohl/podcast-dl/commit/c68aa43ba9c6eafcb667fac9b530b06aa2141f9c)), closes [#29](https://github.com/lightpohl/podcast-dl/issues/29)
* allow '--list' to support filtering options ([0dda386](https://github.com/lightpohl/podcast-dl/commit/0dda386b2881bf5c4114f52f9ae49772a12fae94)), closes [#28](https://github.com/lightpohl/podcast-dl/issues/28)
* filter with '--episode-regex' before starting downloads ([6690a82](https://github.com/lightpohl/podcast-dl/commit/6690a82f1c650b513c27bf8d24cac036c68b4f1a))

### [5.0.2](https://github.com/lightpohl/podcast-dl/compare/v5.0.1...v5.0.2) (2021-08-03)


### Bug Fixes

* output path incorrectly set ([03d99fb](https://github.com/lightpohl/podcast-dl/commit/03d99fb82409d5619c0477814aace37d7db35936))

### [5.0.1](https://github.com/lightpohl/podcast-dl/compare/v5.0.0...v5.0.1) (2021-08-03)


### Bug Fixes

* log item info when skipped due to conflict or existing in archive ([7a324e6](https://github.com/lightpohl/podcast-dl/commit/7a324e65fcf031d94039c5b6a2ee76c1eafd9470))

## [5.0.0](https://github.com/lightpohl/podcast-dl/compare/v4.3.1...v5.0.0) (2021-07-31)


### ⚠ BREAKING CHANGES

* exit with error code 2 when no episodes are downloaded (#27)

### Features

* add --exec option ([#25](https://github.com/lightpohl/podcast-dl/issues/25)) ([f39966f](https://github.com/lightpohl/podcast-dl/commit/f39966f7b015807bf061b47276495b8671e66cb3))
* exit with error code 2 when no episodes are downloaded ([#27](https://github.com/lightpohl/podcast-dl/issues/27)) ([0ef921e](https://github.com/lightpohl/podcast-dl/commit/0ef921e00c960be971228ea2845d6b134015aca4))


### Bug Fixes

* move onAfterDownload to after error checks ([f148041](https://github.com/lightpohl/podcast-dl/commit/f148041930118d4246ab9016bbfb0f949bbba355))
* only run --add-mp3-metadata on new downloads ([e06a7e9](https://github.com/lightpohl/podcast-dl/commit/e06a7e90a54ed3b74d6e53dc88a6ee7265895166))

### [4.3.1](https://github.com/lightpohl/podcast-dl/compare/v4.3.0...v4.3.1) (2021-05-09)


### Bug Fixes

* always log error messages that trigger an exit ([e856f3c](https://github.com/lightpohl/podcast-dl/commit/e856f3c7fca1afb9c7d4e49fdcd30a84181f1ea7))
* gracefully handle feed items missing audio extensions ([b0a03de](https://github.com/lightpohl/podcast-dl/commit/b0a03ded86b2d87e64edd29fc2e51d64cb5597a7)), closes [#24](https://github.com/lightpohl/podcast-dl/issues/24)
* missing newline when download exits on error ([2672676](https://github.com/lightpohl/podcast-dl/commit/267267667414ec17300ca2db07f148010f4be1f1))

## [4.3.0](https://github.com/lightpohl/podcast-dl/compare/v4.2.0...v4.3.0) (2021-04-10)


### Features

* add support for LOG_LEVEL env variable ([3a2deb0](https://github.com/lightpohl/podcast-dl/commit/3a2deb05425352d870b0824cddd404751ab0dcbc)), closes [#22](https://github.com/lightpohl/podcast-dl/issues/22)

## [4.2.0](https://github.com/lightpohl/podcast-dl/compare/v4.1.4...v4.2.0) (2021-03-13)


### Features

* add --add-mp3-metadata option ([#21](https://github.com/lightpohl/podcast-dl/issues/21)) ([2825a36](https://github.com/lightpohl/podcast-dl/commit/2825a360ffe9ea59d6fbad6fd8b68413731a9e45))

### [4.1.4](https://github.com/lightpohl/podcast-dl/compare/v4.1.3...v4.1.4) (2021-02-20)


### Bug Fixes

* check enclosure for audio type/ext if file is missing ext ([58bcc4b](https://github.com/lightpohl/podcast-dl/commit/58bcc4b97eac8ea662fa8da0e05ddc0a630f2a99))

### [4.1.3](https://github.com/lightpohl/podcast-dl/compare/v4.1.2...v4.1.3) (2021-01-27)

### [4.1.2](https://github.com/lightpohl/podcast-dl/compare/v4.1.1...v4.1.2) (2021-01-22)


### Bug Fixes

* disable download progress logging in non-TTY envs ([c0f0dde](https://github.com/lightpohl/podcast-dl/commit/c0f0ddebc5635e0c9b162cadecab8760c4b00e17))

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
