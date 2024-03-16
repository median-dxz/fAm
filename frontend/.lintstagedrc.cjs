const path = require("path");

const eslint = (filenames) =>
  `next lint --fix --file ${filenames.map((f) => path.relative(process.cwd(), f)).join(" --file ")}`;

const prettier = `prettier --write --ignore-unknown`;

module.exports = {
  "*.{js,jsx,ts,tsx}": [eslint, prettier],
  "*.{json,css,html}": [prettier],
};
