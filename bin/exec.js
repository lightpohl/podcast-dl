import { exec } from "child_process";
import util from "util";
import { escapeArgForShell } from "./util.js";

export const execWithPromise = util.promisify(exec);

export const runExec = async ({
  exec,
  basePath,
  outputPodcastPath,
  episodeFilename,
  episodeAudioUrl,
}) => {
  const episodeFilenameBase = episodeFilename.substring(
    0,
    episodeFilename.lastIndexOf(".")
  );

  const execCmd = exec
    .replace(/{{episode_path}}/g, escapeArgForShell(outputPodcastPath))
    .replace(/{{episode_path_base}}/g, escapeArgForShell(basePath))
    .replace(/{{episode_filename}}/g, escapeArgForShell(episodeFilename))
    .replace(
      /{{episode_filename_base}}/g,
      escapeArgForShell(episodeFilenameBase)
    )
    .replace(/{{url}}/g, escapeArgForShell(episodeAudioUrl));

  await execWithPromise(execCmd, { stdio: "ignore" });
};
