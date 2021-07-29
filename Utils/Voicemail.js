const ini = require("ini");
const fs = require("fs");
const path = require("path");
const Inboxes = require("./InboxFolders");
const Settings = require("./Settings");
const UploadAPI = require("../api/Upload");
const chalk = require("chalk");
const chokidar = require("chokidar");
let watchers = [];
let _verbose = false;
module.exports = {
	/**
	 * Formats the voicemail file id to not have a path
	 * @param {string} id Filename of the voicemail
	 */
	formatVoicemailID(id) {
		return id.replace(/.txt/g, "").replace(/.wav/g, "");
	},

	/**
	 * Get file text from a voicemail
	 * @param {string} extensionID - The extension ID (e.g. the folder)
	 * @param {string} voicemailID - The voicemail ID (e.g. the file id msg00001.txt)
	 * @returns {string} - The text of the voicemail
	 */
	getVoicemailText(extensionID, voicemailID) {
		voicemailID = this.formatVoicemailID(voicemailID);

		const pathToFolder = path.join(
			Settings.vmFolder,
			`${extensionID}`,
			Settings.NewVmFolder
		);

		const pathToFile = path.join(pathToFolder, `${voicemailID}.txt`);

		return fs.readFileSync(pathToFile, "utf-8");
	},

	/**
	 * Gets an object for the ini data for the voicemail
	 * @param {string} extensionID - The extension ID (e.g. the folder)
	 * @param {string} voicemailID - The voicemail ID (e.g. the file id msg00001.txt)
	 * @returns {Object} voicemail parameters of voicemail
	 */
	getIniConfig(extensionID, voicemailID) {
		return ini.parse(this.getVoicemailText(extensionID, voicemailID));
	},

	/**
	 * Flag the voicemail as being uploaded
	 * @param {String} extensionID - The extension ID (e.g. the folder)
	 * @param {String} voicemailID - The voicemail ID (e.g. the file id msg00001.txt)
	 */
	markVoicemailAsUploaded(extensionID, voicemailID) {
		voicemailID = this.formatVoicemailID(voicemailID);
		let config = this.getIniConfig(extensionID, voicemailID);
		config.ticketVm = { uploaded: true };
		const pathToFolder = path.join(
			Settings.vmFolder,
			`${extensionID}`,
			Settings.NewVmFolder
		);

		const pathToFile = path.join(pathToFolder, `${voicemailID}.txt`);
		fs.writeFileSync(pathToFile, ini.stringify(config));
	},

	/**
	 * Check for un-uploaded voicemails in particular extension
	 * @param {String} extensionID - The extension ID (e.g. the folder)
	 * @returns {Array} Array of voicemails that are not uploaded
	 */
	getUnUploadedVoicemailsForExtension(extensionID) {
		let voicemails = [];
		let pathToFolder = path.join(
			Settings.vmFolder,
			`${extensionID}`,
			Settings.NewVmFolder
		);
		if (fs.existsSync(pathToFolder)) {
			fs.readdirSync(pathToFolder).forEach((file) => {
				if (file.endsWith(".txt")) {
					const config = this.getIniConfig(extensionID, file);
					if (!config.ticketVm) {
						voicemails.push(file);
					} else if (!config.ticketVm.uploaded) {
						voicemails.push(file);
					}
				}
			});
		} else {
			console.log(chalk.red(`LOCAL EXTENSION ${extensionID} DOES NOT EXIST!`));
			return [];
		}

		return voicemails;
	},

	/**
	 * Get all un-uploaded voicemails for all extensions
	 * @returns {Array} Array of voicemails that are not uploaded
	 */
	async getUnUploadedVoicemails() {
		let voicemails = [];
		let extensions = await Inboxes.getUploadableMailboxes();
		extensions.forEach((extension) => {
			let unUploadedVoicemails = this.getUnUploadedVoicemailsForExtension(
				extension.extensionid
			);
			voicemails.push({
				extensionid: extension.extensionid,
				voicemails: unUploadedVoicemails,
			});
		});
		return voicemails;
	},

	/**
	 * Upload all un-uploaded voicemails for all extensions
	 * @param {Boolean} verbose - Prints the progress to the console
	 * @returns {Array} Array of voicemails that are not uploaded
	 */
	async uploadUnUploadedVoicemails(verbose) {
		_verbose = verbose;
		let voicemails = await this.getUnUploadedVoicemails();
		voicemails.forEach((voicemail) => {
			if (_verbose) {
				console.log(
					chalk.bgBlue.white(
						`Uploading voicemails from extension ${voicemail.extensionid}`
					)
				);
			}
			voicemail.voicemails.forEach((voicemailID) => {
				if (_verbose)
					console.log(chalk.white(`\tUploading - ${voicemailID}....`));

				this.uploadFile(voicemail.extensionid, voicemailID);
				if (_verbose) console.log(chalk.green(`\t\tDone!`));
			});
		});
	},

	/**
	 * Monitor mailboxes for new voicemails
	 */
	async monitorMailboxes(verbose) {
		_verbose = verbose;
		let extensions = await Inboxes.getUploadableMailboxes();
		extensions.forEach((extension) => {
			const pathToFolder = path.join(
				Settings.vmFolder,
				`${extension.extensionid}`,
				Settings.NewVmFolder
			);

			const pathToFile = path.join(pathToFolder, `*.txt`);
			if (_verbose)
				console.log(
					chalk.bgBlue.white(
						`Monitoring mailbox ${extension.extensionid} @ ${pathToFile}`
					)
				);
			watchers.push(
				chokidar
					.watch(pathToFile, {
						awaitWriteFinish: true,
						ignoreInitial: true,
					})
					.on("add", () => {
						if (_verbose)
							console.log(
								chalk.white(
									`Voicemail Detected Extension ${extension.extensionid}!`
								)
							);
						this.uploadUnUploadedVoicemails(_verbose);
					})
			);
		});
	},

	/**
	 * Close all watchers
	 */
	closeWatchers() {
		watchers.forEach((watcher) => {
			watcher.close();
		});
	},

	/**
	 * Upload a voicemail
	 * @param {String} extensionID - The extension ID (e.g. the folder)
	 * @param {String} voicemailID - The voicemail ID (e.g. the file id msg00001.txt)
	 * @returns {Boolean} True if the file was uploaded, false otherwise
	 */
	async uploadFile(extensionID, file) {
		const conf = this.getIniConfig(extensionID, file).message;
		console.log(conf);
		const pathToFolder = path.join(
			Settings.vmFolder,
			`${extensionID}`,
			Settings.NewVmFolder
		);
		const voicemailID = this.formatVoicemailID(file);
		const mbid = await Inboxes.getServerIdForExtension(extensionID);
		const pathToFile = path.join(pathToFolder, `${voicemailID}.wav`);

		const CallerName = conf.callerid
			.match(/(?:"[^"]*"|^[^"]*$)/)[0]
			.replace(/"/g, "");

		const CallerPhone = conf.callerid
			.match(/<(\w+)>/)[0]
			.replace(/</g, "")
			.replace(/>/g, "");

		try {
			let data = await UploadAPI.uploadVoicemail(
				mbid,
				conf.callerid,
				CallerName,
				CallerPhone,
				conf.origdate,
				conf.origtime,
				conf.msg_id,
				conf.duration,
				this.getVoicemailText(extensionID, file),
				conf.origmailbox,
				pathToFile
			);

			if (_verbose) {
				console.log(
					chalk.bgBlue.white(
						`\t\t Uploaded voicemail ${voicemailID} from extension ${extensionID}!`
					)
				);
			}

			this.markVoicemailAsUploaded(extensionID, voicemailID);

			if (Settings.deleteVoicemails) {
				await fs.unlink(pathToFile);
			}
		} catch (e) {
			console.log(chalk.red("FAILED TO UPLOAD VOICEMAIL!!!\n"));
			console.log(e);
			return false;
		}
	},
};
