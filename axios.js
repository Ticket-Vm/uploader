const axios = require("axios");
const settings = require("./Utils/Settings");

module.exports = axios.create({
	baseURL: "https://api.ticketvm.com/api",
	// baseURL: "http://localhost:3000/api",
	headers: {
		Authorization: `Basic ${settings.apiKeyEncoded}`,
	},
});
