const { program } = require("commander");
program.version("1.0.0");
program.option("-s, --setup", "re-run setup prompts");
program.option("-c, --check-mailboxes", "force check for new mailboxes");

program.parse(process.argv);
const options = program.opts();

const fs = require("fs");

console.log(options);

const waitFor = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

/**
 * Initializes App
 */
async function init() {
	console.clear();

	//If config is being re-ran
	if (!fs.existsSync("./Settings.json") || options.setup) {
		await require("./setup")();
		await waitFor(5000);
		console.clear();
	}

	//Check for new mailboxes
	if (options.checkMailboxes) {
		await require("./Utils/InboxFolders").createNewVoicemailBoxes(true);
	}

	console.log("Initalizing...");

	const cron_CheckForBoxes = require("./CheckForNewVoicemailBoxes"); //Start cronjob checking for new boxes
}

init();
