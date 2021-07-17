const axios = require("axios");
const settings = require("./api/settings");

module.exports = axios.create({
	baseURL: "https://api.ticketvm.com/api",
	headers: {
		Authorization: `Basic ${settings.apiKeyEncoded}`,
	},
});
