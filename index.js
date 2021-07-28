const { program } = require("commander");
program.version(require("./package.json").version);
program.option("-s, --setup", "re-run setup prompts");
program.option("-c, --check-mailboxes", "force check for new mailboxes");
program.option(
	"-u, --upload-voicemails",
	"force upload all un-uploaded voicemails"
);

program.parse(process.argv);
const options = program.opts();

const fs = require("fs");
const voicemail = require("./Utils/Voicemail");

console.log(options);

/**
 * Wait for a certain duration before continuing
 * @param {Integer} delay Delay in MS before continuing
 */
const waitFor = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

/**
 * Initializes App
 */
async function init() {
	if (options.version) {
		console.log("Version: " + require("./package.json").version);
		return;
	}

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

	if (options.uploadVoicemails) {
		console.log(`Uploading voicemails...`);
		await require("./Utils/Voicemail").uploadUnUploadedVoicemails(true);
	}

	console.log("Initalizing...");

	//Start cronjob checking for new boxes
	const cron_CheckForBoxes = require("./CheckForNewVoicemailBoxes");
	voicemail.uploadFile("112", "msg0000.wav");
}

init();
