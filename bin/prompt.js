let path = require("path");
let inquirer = require("inquirer");

let {
  download,
  getEpisodeAudioUrl,
  getEpisodeFilename,
  getFeed,
  getUrlExt,
  logItemInfo,
} = require("./util");
let { logError, logErrorAndExit } = require("./validate");

let setupQuestions = [
  {
    type: "input",
    name: "url",
    message: "URL:",
  },
  {
    type: "input",
    name: "outDir",
    message: "Output Directory:",
    default: "./",
  },
];

let promptMain = async () => {
  let { url, outDir } = await inquirer.prompt(setupQuestions);
  let feed = await getFeed(url);
  let basePath = path.resolve(process.cwd(), outDir);

  if (!feed.items || feed.items.length === 0) {
    logErrorAndExit("No episodes found to download");
  }

  let { selectedEpisodes } = await inquirer.prompt([
    {
      type: "checkbox",
      message: "Select epssodes",
      name: "selectedEpisodes",
      choices: getEpisodeOptions(feed.items),
    },
  ]);

  if (!selectedEpisodes.length) {
    logErrorAndExit("No episodes selected");
  }

  let episodeText = selectedEpisodes.length === 1 ? "episode" : "episodes";
  console.log(
    `\nStarting download of ${selectedEpisodes.length} ${episodeText}\n`
  );

  let counter = 1;
  for (let episodeOption of selectedEpisodes) {
    let item = feed.items.find(
      (item, idx) => getEpisodeOptionName(item, idx) === episodeOption
    );

    if (!item) {
      logErrorAndExit("Unable to find selected episode");
    }

    let episodeAudioUrl = getEpisodeAudioUrl(item);

    if (!episodeAudioUrl) {
      logError("Unable to find episode download URL. Skipping");
      continue;
    }

    console.log(`${counter} of ${selectedEpisodes.length}`);
    logItemInfo(item);

    let baseSafeFilename = getEpisodeFilename(item);
    let audioFileExt = getUrlExt(episodeAudioUrl);
    let outputPodcastPath = path.resolve(
      basePath,
      `${baseSafeFilename}${audioFileExt}`
    );

    try {
      await download({
        outputPath: outputPodcastPath,
        url: episodeAudioUrl,
      });
    } catch (error) {
      logError("Unable to download episode", error);
    }

    counter += 1;
    console.log("");
  }
};

let getEpisodeOptionName = (item, idx) => {
  return `${idx} | ${item.title}`;
};

let getEpisodeOptions = (items) => {
  return items.map((item, idx) => {
    return {
      idx,
      name: getEpisodeOptionName(item, idx),
    };
  });
};

let startPrompt = async () => {
  console.log("running prompt");
  await promptMain();
};

module.exports = {
  startPrompt,
};
