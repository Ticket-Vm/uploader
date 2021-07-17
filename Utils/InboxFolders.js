const mailboxes = require("../api/Mailboxes");
const { readdirSync } = require("fs");
const settings = require("./Settings");
module.exports = {
	/**
	 * Gets all folders configured to receive voicemails
	 * @returns {Array} Array of folders that are configured to receive voicemail
	 */
	locateInboxFolders() {
		const source = settings.vmFolder;
		return readdirSync(source, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);
	},

	/**
	 * Gets all folders that are currently not configured to receive voicemails
	 * @returns {Array} Array of folders that are not configured to receive voicemail
	 */
	async getUnconfiguredInboxes() {
		//Get all the local mailboxes
		let localInboxes = this.locateInboxFolders();

		//Get the extensions from the server that are configured to receive voicemails, and format them as a string
		let extensionsConfigured = (await mailboxes.getMailboxes()).map(
			(mailbox) => `${mailbox.extensionid}`
		);

		//Get unique items between localInboxes and extensionsConfigured
		return localInboxes.filter(
			(inbox) => extensionsConfigured.indexOf(inbox) === -1
		);
	},

	/**
	 * Get all mailboxes that are configured to upload
	 * @returns {Array} Array of mailboxes that are configured to upload
	 */
	async getUploadableMailboxes() {
		const mailboxes = await mailboxes.getMailboxes();
		return mailboxes.filter((mailbox) => mailbox.upload);
	},

	/**
	 * Alert server that a new mailbox has been detected
	 */
	async createNewVoicemailBoxes(verbose = false) {
		const chalk = require("chalk");
		let newBoxes = await this.getUnconfiguredInboxes();

		//If there are no mailboxes exit
		if (newBoxes.length === 0) {
			if (verbose)
				console.log(
					"",
					chalk.green("No new mailboxes.\n"),
					chalk.bold("Note:"),
					"With asterisk a voicemail must be left for the directory to be created"
				);
			return;
		}

		if (verbose)
			console.log(chalk.bgBlue.white.bold(`New mailboxes have been found`));

		//Create the new mailboxes
		for (let i = 0; i < newBoxes.length; i++) {
			if (verbose)
				console.log(chalk.blue.bold(`Creating new mailbox: ${newBoxes[i]}`));

			let data = await mailboxes.addMailbox(newBoxes[i]);

			//Output creation status
			if (verbose) {
				if (!data)
					console.log(chalk.red.bold(`\tThere was an error creating mailbox`));
				else
					console.log(
						chalk.green.bold(
							`\tMailbox has been created and assigned the ID ${data.mailboxid}`
						)
					);
				console.log("\n\n");
			}
		}
	},
};

//Run if called directly
if (require.main === module)
	module.exports.getUnconfiguredInboxes().then(console.log);
