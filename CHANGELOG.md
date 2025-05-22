# Changelog

## [11.0.0](https://github.com/lightpohl/podcast-dl/compare/v10.5.0...v11.0.0) (2025-05-22)


### ⚠ BREAKING CHANGES

* update to Node 22 LTS
* remove legacy archive behavior

### Features

* always attempt image embed with '--add-mp3-metadata' ([644bcf7](https://github.com/lightpohl/podcast-dl/commit/644bcf78adc56c825cfa8ed793232ea723143f48))
* remove legacy archive behavior ([85d51d4](https://github.com/lightpohl/podcast-dl/commit/85d51d466cb324edaceb5c8b43c6febb3154a4d1))


### Bug Fixes

* do not embed image if '--add-mp3-metadata' is not provided ([644bcf7](https://github.com/lightpohl/podcast-dl/commit/644bcf78adc56c825cfa8ed793232ea723143f48))


### Miscellaneous Chores

* update to Node 22 LTS ([33fa2cf](https://github.com/lightpohl/podcast-dl/commit/33fa2cfb9593f39094cc4c11d3d7aa286d4a8573))

## [10.5.0](https://github.com/lightpohl/podcast-dl/compare/v10.4.1...v10.5.0) (2025-05-18)


### Features

* embed episode artwork if available when ffmpeg is run ([34eac22](https://github.com/lightpohl/podcast-dl/commit/34eac22ef0d9c804caca054469b77862e5cc16d6)), closes [#100](https://github.com/lightpohl/podcast-dl/issues/100)


### Bug Fixes

* use 'contentSnippet' for mp3 metadata comment ([fc92fed](https://github.com/lightpohl/podcast-dl/commit/fc92feda959262245d7f1198cd670b3bd087749b))

## [10.4.1](https://github.com/lightpohl/podcast-dl/compare/v10.4.0...v10.4.1) (2024-12-11)


### Bug Fixes

* properly escape params passed to exec ([2a65931](https://github.com/lightpohl/podcast-dl/commit/2a659310f0735b4c9bc7835ec6db8e2051d36292))
* properly escape params passed to ffmpeg ([88df918](https://github.com/lightpohl/podcast-dl/commit/88df918d73a1f53083562d48f3bf5560c2145714)), closes [#95](https://github.com/lightpohl/podcast-dl/issues/95)

## [10.4.0](https://github.com/lightpohl/podcast-dl/compare/v10.3.3...v10.4.0) (2024-12-05)


### Features

* add 'episode-regex-exclude' option ([553c799](https://github.com/lightpohl/podcast-dl/commit/553c799e2dbe528d082acda1c735a49aa67e0243)), closes [#91](https://github.com/lightpohl/podcast-dl/issues/91)

## [10.3.3](https://github.com/lightpohl/podcast-dl/compare/v10.3.2...v10.3.3) (2024-11-28)


### Bug Fixes

* ignore servers with incorrect 'Accept' handling ([52f2d69](https://github.com/lightpohl/podcast-dl/commit/52f2d693f9580b7f4cb87e7ff417baba0aa6998d))

## [10.3.2](https://github.com/lightpohl/podcast-dl/compare/v10.3.1...v10.3.2) (2024-11-07)


### Bug Fixes

* spoof user agent to avoid occasional blocks ([494c74b](https://github.com/lightpohl/podcast-dl/commit/494c74bb0f9de913efb666f2c339c0bc88ee3dc2)), closes [#89](https://github.com/lightpohl/podcast-dl/issues/89)

## [10.3.1](https://github.com/lightpohl/podcast-dl/compare/v10.3.0...v10.3.1) (2024-11-01)


### Bug Fixes

* handle file feeds with missing 'feedUrl' ([1e6b89a](https://github.com/lightpohl/podcast-dl/commit/1e6b89ae48f33a172705cbc357038e02f901b7ae)), closes [#87](https://github.com/lightpohl/podcast-dl/issues/87)

## [10.3.0](https://github.com/lightpohl/podcast-dl/compare/v10.2.0...v10.3.0) (2024-10-09)


### Features

* add 'url' template option to '--exec' ([6f305c1](https://github.com/lightpohl/podcast-dl/commit/6f305c149831b83491a940ba8b77d45cb0834adc))

## [10.2.0](https://github.com/lightpohl/podcast-dl/compare/v10.1.0...v10.2.0) (2024-08-29)


### Features

* add 'release_month' and 'release_day' template options ([27c2e8b](https://github.com/lightpohl/podcast-dl/commit/27c2e8b1229079018eb14404915bddcca2543fce))

## [10.1.0](https://github.com/lightpohl/podcast-dl/compare/v10.0.0...v10.1.0) (2024-08-25)


### Features

* add 'release_year' option for episode template ([223022e](https://github.com/lightpohl/podcast-dl/commit/223022e0b8c226ed7f0db4fc14d31316820c3675))

## [10.0.0](https://github.com/lightpohl/podcast-dl/compare/v9.5.0...v10.0.0) (2024-08-24)


### ⚠ BREAKING CHANGES

* add 'episode-custom-template-options' ([#79](https://github.com/lightpohl/podcast-dl/issues/79))

### Features

* add 'episode-custom-template-options' ([#79](https://github.com/lightpohl/podcast-dl/issues/79)) ([d280eea](https://github.com/lightpohl/podcast-dl/commit/d280eeadb172da87626ad7b4da91f597c0e6e46a))

## [9.5.0](https://github.com/lightpohl/podcast-dl/compare/v9.4.0...v9.5.0) (2024-05-29)


### Features

* support fetching available episode transcripts ([43e6c6c](https://github.com/lightpohl/podcast-dl/commit/43e6c6c82a1279757fa59a9cb4ac36a216d8c431))

## [9.4.0](https://github.com/lightpohl/podcast-dl/compare/v9.3.4...v9.4.0) (2024-05-26)


### Features

* add '--episode-num-offset' option ([7a742c5](https://github.com/lightpohl/podcast-dl/commit/7a742c5a11aadff0411359938ea0076a4b4d49a0))

## [9.3.4](https://github.com/lightpohl/podcast-dl/compare/v9.3.3...v9.3.4) (2024-04-30)


### Bug Fixes

* handle feeds that block 'HEAD' check ([23b6b5d](https://github.com/lightpohl/podcast-dl/commit/23b6b5d65b2b9cbad7e35808739cec4364b7318c))

## [9.3.3](https://github.com/lightpohl/podcast-dl/compare/v9.3.2...v9.3.3) (2024-04-13)


### Bug Fixes

* fallback to provided URL if 'feedUrl' cannot be parsed ([d944bdf](https://github.com/lightpohl/podcast-dl/commit/d944bdfbb1272c85a60a451ed286b5e0181d0fc8))

## [9.3.2](https://github.com/lightpohl/podcast-dl/compare/v9.3.1...v9.3.2) (2024-04-13)


### Bug Fixes

* add opus to audio types ([4973683](https://github.com/lightpohl/podcast-dl/commit/49736831a876da5278557d0ab7cf8e433b288b5a))

## [9.3.1](https://github.com/lightpohl/podcast-dl/compare/v9.3.0...v9.3.1) (2024-02-17)


### Bug Fixes

* remove leftover console.log ([3135661](https://github.com/lightpohl/podcast-dl/commit/3135661e21a5c32eca6a6f73f385bae8939a9f49))

## [9.3.0](https://github.com/lightpohl/podcast-dl/compare/v9.2.2...v9.3.0) (2024-02-17)


### Features

* add support for '--file' parsing ([70254f3](https://github.com/lightpohl/podcast-dl/commit/70254f3bd6ce5f8d1de7dd52342e3dfb9d913120)), closes [#64](https://github.com/lightpohl/podcast-dl/issues/64)

## [9.2.2](https://github.com/lightpohl/podcast-dl/compare/v9.2.1...v9.2.2) (2023-12-31)


### Bug Fixes

* avoid escaping complex args in Windows ([11b9f6a](https://github.com/lightpohl/podcast-dl/commit/11b9f6a9070a208f3e612ee94a5eaea5f5adecd3))

## [9.2.1](https://github.com/lightpohl/podcast-dl/compare/v9.2.0...v9.2.1) (2023-12-31)


### Bug Fixes

* add better escape logic for mp3 metadata with ffmpeg ([7a4289f](https://github.com/lightpohl/podcast-dl/commit/7a4289f00f92dbbc06e517a09df5251f932f8c70)), closes [#60](https://github.com/lightpohl/podcast-dl/issues/60)

## [9.2.0](https://github.com/lightpohl/podcast-dl/compare/v9.1.0...v9.2.0) (2023-12-05)

### Features

* support directory paths in '--episode-template' 

## [9.1.0](https://github.com/lightpohl/podcast-dl/compare/v9.0.3...v9.1.0) (2023-10-09)

### Features

* add flag to postprocess existing files

### Bug Fixes

* allow ffmpeg options to be run on all filetypes

### [9.0.3](https://github.com/lightpohl/podcast-dl/compare/v9.0.2...v9.0.3) (2023-10-07)

### Bug Fixes

* fix and enhance the --add-mp3-metadata flag

### Features

* add guid to episode template

### [9.0.2](https://github.com/lightpohl/podcast-dl/compare/v9.0.1...v9.0.2) (2023-09-10)

### Bug Fixes

* prevent all exts from causing file name limit issues

### Features

* allow override of `MAX_LENGTH_FILENAME` via env variable

### [9.0.1](https://github.com/lightpohl/podcast-dl/compare/v9.0.0...v9.0.1) (2023-09-09)

### Bug Fixes

* prevent ".tmp" files causing file name limit issues
* `--episode-source-order` using incorrect default value


## [9.0.0](https://github.com/lightpohl/podcast-dl/compare/v8.0.8...v9.0.0) (2023-09-08)

### ⚠ BREAKING CHANGES

* keys generated for the archive will use the full and unaltered titles
* pull from item enclosure first when looking for episode downloads

### Features

* add `--attempts` and support automatic retries
* add `--episode-source-order` for better support of problematic feeds


### [8.0.8](https://github.com/lightpohl/podcast-dl/compare/v8.0.7...v8.0.8) (2023-07-21)

### Bug Fixes

* handle invalid URLs when attempting to find audio file URL
* more gracefully handle initially empty archive files
* remove an inaccurate log message when download extra items for an episode

### [8.0.7](https://github.com/lightpohl/podcast-dl/compare/v8.0.6...v8.0.7) (2023-07-09)

### Bug Fixes

* meta and episode image filenames should respect --episode-digits

### [8.0.6](https://github.com/lightpohl/podcast-dl/compare/v8.0.5...v8.0.6) (2023-05-17)

### Bug Fixes

* handle feeds where audio files are missing exts

### [8.0.5](https://github.com/lightpohl/podcast-dl/compare/v8.0.4...v8.0.5) (2023-03-27)

### Features

* add `--episode-digits` to allow episode number to be padded with leading zeroes

### [8.0.4](https://github.com/lightpohl/podcast-dl/compare/v8.0.3...v8.0.4) (2023-02-27)

### Bug Fixes

* '--out-dir' and '--archive' incorrectly generating nested folders

### [8.0.3](https://github.com/lightpohl/podcast-dl/compare/v8.0.2...v8.0.3) (2023-02-11)

### Features

* add `--proxy` flag to enable proxy support via ENV variables

### [8.0.2](https://github.com/lightpohl/podcast-dl/compare/v8.0.1...v8.0.2) (2023-02-04)

### Features

* make 'episode_num' available for '--episode-template' templating

### Bug Fixes

* increase timeout check for slower servers

### [8.0.1](https://github.com/lightpohl/podcast-dl/compare/v8.0.0...v8.0.1) (2023-02-04)

### Bug Fixes

* feed meta should not include items meta

## [8.0.0](https://github.com/lightpohl/podcast-dl/compare/v7.3.2...v8.0.0) (2023-02-04)

### ⚠ BREAKING CHANGES

* remove '--filter-url-tracking' experimental flag
* include all properties in metadata from rss-parser
* make '--exec' templating options more consistent

### Features

* add '--parser-config' option ([e70eaac](https://github.com/lightpohl/podcast-dl/commit/e70eaac237af6cc569494bee0576dc04494cb632))


### Bug Fixes

* do not log feed info when using '--list' ([1bb340b](https://github.com/lightpohl/podcast-dl/commit/1bb340bd9337fcab1054dd2f4e556699b9c55e58))

### [7.3.2](https://github.com/lightpohl/podcast-dl/compare/v7.3.1...v7.3.2) (2022-04-13)


### Bug Fixes

* limit filtering should be applied last ([e2db23a](https://github.com/lightpohl/podcast-dl/commit/e2db23ae511d534ce5de16b9783da1e182959672))

### [7.3.1](https://github.com/lightpohl/podcast-dl/compare/v7.3.0...v7.3.1) (2022-04-11)


### Bug Fixes

* limit success message to > 0 episodes downloaded ([e7c189b](https://github.com/lightpohl/podcast-dl/commit/e7c189be3088111478d0ee131754635f4812aa4b))
* prevent podcast images from downloading if already archived ([c1a7440](https://github.com/lightpohl/podcast-dl/commit/c1a7440c28519ef3c5c85eaa7f696795b234b564)), closes [#39](https://github.com/lightpohl/podcast-dl/issues/39)

## [7.3.0](https://github.com/lightpohl/podcast-dl/compare/v7.2.0...v7.3.0) (2022-04-09)


### Features

* add success/failure message at end of downloads ([a785c73](https://github.com/lightpohl/podcast-dl/commit/a785c73f05f4d5e348bd54888b93500336662539))
* do not include null values in JSON output ([70f1dac](https://github.com/lightpohl/podcast-dl/commit/70f1dac10dd94fa57e49ee721766dfe463e93dd5))


### Bug Fixes

* remove unnecessary file size warning ([96a48b2](https://github.com/lightpohl/podcast-dl/commit/96a48b2c2490ad329ef8212ed17f11f2ff7c0780))

## [7.2.0](https://github.com/lightpohl/podcast-dl/compare/v7.1.0...v7.2.0) (2022-03-05)


### Features

* write to temp files while downloading ([dae7938](https://github.com/lightpohl/podcast-dl/commit/dae793863cebcdaae579fb6fbd553209e9a71861)), closes [#37](https://github.com/lightpohl/podcast-dl/issues/37)

## [7.1.0](https://github.com/lightpohl/podcast-dl/compare/v7.0.0...v7.1.0) (2021-11-17)


### Features

* add '--filter-url-tracking' option ([9e7365f](https://github.com/lightpohl/podcast-dl/commit/9e7365f0f5798b504854792d018980c8e4d280ef))

## [7.0.0](https://github.com/lightpohl/podcast-dl/compare/v6.1.0...v7.0.0) (2021-10-23)


### ⚠ BREAKING CHANGES

* support multiple downloads with '--threads' (#34)

* add '--include-episode-images', remove '--ignore-episode-images'

* check for ffmpeg during validation if option requires it

* specify Node 14 LTS

### Features

* support multiple downloads with '--threads' ([#34](https://github.com/lightpohl/podcast-dl/issues/34)) ([c4ee9c6](https://github.com/lightpohl/podcast-dl/commit/c4ee9c60d4014196ef3b45bca65bc697faab7c19))

* add '--include-episode-images'

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
