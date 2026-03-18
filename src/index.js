const { parse } = require("./parser");
const { generate } = require("./generator");
const { walk } = require("./walker");

module.exports = { parse, generate, walk };