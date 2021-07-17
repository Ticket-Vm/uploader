const { program } = require("commander");
program.version("1.0.0");
program.option("-s, --setup", "re-run setup prompts");

program.parse(process.argv);
const options = program.opts();

const fs = require("fs");
const axios = require("axios");
const args = process.argv.slice(2);

if (fs.existsSync("./Settings.json") || options.setup) {
	require("./setup")(); //Rerun the setup
	process.exit(0);
}
