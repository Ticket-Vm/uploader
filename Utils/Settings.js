// USE GETTERS SO WE DO NOT NEED TO RESTART IF SETTINGS CHANGE

module.exports = {
	server: "https://api.ticketvm.com",
	get apiKey() {
		return require("../Settings.json").apiKey;
	},
	get apiKeyEncoded() {
		return Buffer.from(`${this.apiKey}:`).toString("base64");
	},
	get vmFolder() {
		return require("../Settings.json").vmFolder;
	},
	get NewVmFolder() {
		return require("../Settings.json").newVmFolder;
	},
	get deleteOnUpload() {
		return require("../Settings.json").deleteOnUpload;
	},
};
