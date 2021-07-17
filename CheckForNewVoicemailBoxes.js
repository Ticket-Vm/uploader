var CronJob = require("cron").CronJob;
const LocateInboxFolders = require("./Utils/InboxFolders");
var job = new CronJob(
	"*/15 * * * *",
	LocateInboxFolders.createNewVoicemailBoxes,
	null,
	true,
	"America/Denver"
);
job.start();
5;
