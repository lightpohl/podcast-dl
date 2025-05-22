const path = require("path");
const { exec } = require("@yao-pkg/pkg");
const webpack = require("webpack");

const { version } = require("./package.json");

const targetMap = [
  {
    target: "node22-linux-x64",
    output: `./binaries/podcast-dl-${version}-linux-x64`,
  },
  {
    target: "node22-macos-x64",
    output: `./binaries/podcast-dl-${version}-macos-x64`,
  },
  {
    target: "node22-win-x64",
    output: `./binaries/podcast-dl-${version}-win-x64`,
  },
];

const buildBinaries = async () => {
  for (const targetMapping of targetMap) {
    await exec([
      `./dist/podcast-dl-${version}.js`,
      "--target",
      targetMapping.target,
      "--output",
      targetMapping.output,
    ]);
  }
};

const main = async () => {
  webpack(
    {
      mode: "production",
      target: "node",
      entry: {
        main: path.resolve(__dirname, "./bin/bin.js"),
      },
      output: {
        path: path.resolve(__dirname, "./dist"),
        filename: `podcast-dl-${version}.js`,
      },
    },
    async (error, stats) => {
      if (error) {
        console.error("Fatal Webpack error:", error);
        process.exit(1);
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        console.error("Build errors:", info.errors);
        process.exit(1);
      }

      await buildBinaries();
    }
  );
};

main();
