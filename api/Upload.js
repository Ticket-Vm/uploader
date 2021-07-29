var fs = require("fs");
var FormData = require("form-data");
const axios = require("../axios.js");
const concat = require("concat-stream");
const path = require("path");

/**
 * Uploads voicemail files
 * @param {String} extensionID The extension ID from the server
 * @param {String} callerid The caller ID
 * @param {String} callername The caller name
 * @param {String} phone The phone number
 * @param {String} origdate The date of the call
 * @param {String} origtime The unix timestamp of the call
 * @param {String} msg_id The unique ID of the voicemail
 * @param {String} duration The duration of the call in seconds
 * @param {String} fulllog The full log of the call
 * @param {String} origmailbox The mailbox of the person who originally recorded the message
 * @param {String} file The path to the file to upload
 */
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
	bodyFormData.append(
		"voicemail-file",
		fs.readFileSync(file),
		path.basename(file) + path.extname(file)
	);

	try {
		let d1 = {};
		await new Promise(function (resolve, reject) {
			bodyFormData.pipe(
				concat({ encoding: "buffer" }, (bdy) => {
					d1 = axios
						.post(`/mailbox/${extensionID}/voicemail`, bdy, {
							headers: {
								...bodyFormData.getHeaders(),
							},
						})
						.then(resolve)
						.catch(reject);
				})
			);
		});
		return d1;
	} catch (error) {
		if (!error.response) {
			console.error("CONNECTION ERROR!");
			throw error;
		}
		if (error.response.status == 400) {
			console.error("INVALID REQUEST!");
			throw error;
		} else if (error.response.status === 401) {
			console.error("UNAUTHORIZED!");
			throw error;
		} else if (error.response.status === 403) {
			console.error("APIKEY IS INCORRECT!");
			throw error;
		} else {
			console.log(
				"General failure, most likely server side. Please report this to support@ticketvm.com or open an issue on github\n",
				error.response.status,
				"-",
				error.response.data
			);
		}
		throw error;
	}
}

module.exports = {
	uploadVoicemail,
};

//Run if called directly
if (require.main === module) getMailboxes();
