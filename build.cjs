const fs = require("fs");
const path = require("path");
const { exec } = require("@yao-pkg/pkg");

const { version } = require("./package.json");

const allTargets = {
  "linux-x64": {
    target: "node18-linux-x64",
    output: `./binaries/podcast-dl-${version}-linux-x64`,
  },
  "macos-x64": {
    target: "node18-macos-x64",
    output: `./binaries/podcast-dl-${version}-macos-x64`,
  },
  "macos-arm64": {
    target: "node18-macos-arm64",
    output: `./binaries/podcast-dl-${version}-macos-arm64`,
  },
  "win-x64": {
    target: "node18-win-x64",
    output: `./binaries/podcast-dl-${version}-win-x64`,
  },
};

const parseTargets = () => {
  const args = process.argv.slice(2);
  if (!args.length) {
    return Object.values(allTargets);
  }
  return args.map((t) => allTargets[t]).filter(Boolean);
};

const buildBinaries = async () => {
  const targets = parseTargets();
  for (const targetMapping of targets) {
    await exec([
      `./dist/podcast-dl-${version}.cjs`,
      "--target",
      targetMapping.target,
      "--output",
      targetMapping.output,
    ]);
  }
};

const main = async () => {
  const { build } = await import("rolldown");
  const outFile = path.resolve(__dirname, "dist", `podcast-dl-${version}.cjs`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  try {
    await build({
      input: path.resolve(__dirname, "./bin/bin.js"),
      platform: "node",
      output: {
        file: outFile,
        format: "cjs",
      },
    });
  } catch (error) {
    console.error("Rolldown build error:", error);
    process.exit(1);
  }

  await buildBinaries();
};

main();
