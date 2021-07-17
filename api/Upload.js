var fs = require("fs");
const axios = require("../axios.js");

async function uploadVoicemail(
	extensionID,
	callerid,
	callername,
	phone,
	origdate,
	origtime,
	msg_id,
	duration,
	fulllog,
	origmailbox,
	file
) {
	var bodyFormData = new FormData();
	bodyFormData.append("callerid", callerid);
	bodyFormData.append("callername", callername);
	bodyFormData.append("phone", phone);
	bodyFormData.append("origdate", origdate);
	bodyFormData.append("origtime", origtime);
	bodyFormData.append("msg_id", msg_id);
	bodyFormData.append("duration", duration);
	bodyFormData.append("fulllog", fulllog);
	bodyFormData.append("origmailbox", origmailbox);
	bodyFormData.append("voicemail-file", fs.readFileSync(file, "binary"));

	try {
		const { data } = await axios.post(
			`/mailbox/${extensionID}/voicemail`,
			bodyFormData
		);
		return data;
	} catch (error) {
		if (!error.response) {
			console.error("CONNECTION ERROR!");
			return undefined;
		}
		if (error.response.status == 400) {
			console.error("INVALID REQUEST!");
			return undefined;
		} else if (error.response.status === 401) {
			console.error("UNAUTHORIZED!");
			return undefined;
		} else if (error.response.status === 403) {
			console.error("APIKEY IS INCORRECT!");
			return undefined;
		}
	}
}

module.exports = {
	uploadVoicemail,
};

//Run if called directly
if (require.main === module) getMailboxes();
