const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");

function required(input) {
	return !!input;
}

const askQuestions = () => {
	const questions = [
		{
			type: "input",
			name: "APIKEY",
			message: "What is your API Key?",
			validate: required,
		},
		{
			type: "input",
			name: "VMFOLDER",
			default: "/var/spool/asterisk/voicemail/default/",
			message: "Where is your voicemail folder?",
			validate: required,
		},
		{
			type: "input",
			name: "NEWVMFOLDER",
			default: "INBOX",
			message: "What folder are new messages inserted?",
			validate: required,
		},
		{
			type: "list",
			name: "DELETEONUPLOAD",
			message: "Delete local files after upload?",
			choices: ["yes", "no"],
		},
	];
	if (fs.existsSync("./Settings.json")) {
		let settings = fs.readFileSync("./Settings.json");
		settings = JSON.parse(settings);
		questions[0].default = settings.apiKey;
		questions[1].default = settings.vmFolder;
	}
	return inquirer.prompt(questions);
};

// ...

const run = async () => {
	// ask questions
	const answers = await askQuestions();
	const { APIKEY, VMFOLDER, DELETEONUPLOAD, NEWVMFOLDER } = answers;

	let obj = {
		apiKey: APIKEY,
		vmFolder: VMFOLDER,
		newVmFolder: NEWVMFOLDER,
		deleteOnUpload: DELETEONUPLOAD == "yes",
	};
	fs.writeFileSync("./Settings.json", JSON.stringify(obj));
	let examplePath = path.join(VMFOLDER, "<EXTENSION>", NEWVMFOLDER);
	console.clear();
	console.log(
		"",
		chalk.black.bgYellow(`=={Will monitor ${examplePath} for new messages!}==`),
		"\n",
		obj.deleteOnUpload
			? chalk.bgRed.bold("=={VOICEMAILS WILL BE DELETED ON UPLOAD}==")
			: chalk.bgGreen.black("=={VOICEMAILS WILL BE SAVED}=="),
		"\n\n\n\n",
		chalk.green.bold("\tConfiguration complete!")
	);
};

//Run if called directly
if (require.main === module) run();

module.exports = run;
