const cron = require('node-cron');
const {runAlertChecks} = require('../services/alertService');
//run every 10 minutes
cron.schedule('*/10 * * * *',()=>{
    runAlertChecks();
});