const axios = require("../axios.js");

async function getMailboxes() {
	try {
		const { data } = await axios.get("/mailbox");
		return data;
	} catch (error) {
		if (!error.response) {
			console.error("CONNECTION ERROR!");
			return undefined;
		}

		if (error.response.status === 401) {
			console.error("UNAUTHORIZED!");
			throw error;
		} else if (error.response.status === 403) {
			console.error("APIKEY IS INCORRECT!");
			throw error;
		}
	}
}

async function addMailbox(extension) {
	try {
		const { data } = await axios.post(`/mailbox/${extension}`);
		return data;
	} catch (error) {
		if (!error.response) {
			console.error("CONNECTION ERROR!");
			return undefined;
		}

		if (error.response.status === 401) {
			console.error("UNAUTHORIZED!");
			throw error;
		} else if (error.response.status === 403) {
			console.error("APIKEY IS INCORRECT!");
			throw error;
		}
	}
}

module.exports = {
	getMailboxes,
	addMailbox,
};

//Run if called directly
if (require.main === module) getMailboxes();
