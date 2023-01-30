const path = require("path");

module.exports = {
  mode: "production",
  target: "node",
  entry: {
    main: path.resolve(__dirname, "./bin/bin.js"),
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "podcast-dl.js",
  },
};
