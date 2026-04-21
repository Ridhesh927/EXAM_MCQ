const fs = require('fs');

const logger = (action, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${action}] ${message}`;

    console.log(logMessage);
    let str = logMessage + '\n';
    if (Object.keys(data).length > 0) {
        console.log(JSON.stringify(data, null, 2));
        str += JSON.stringify(data, null, 2) + '\n';
    }
    console.log('-'.repeat(50)); // Separator
    str += '-'.repeat(50) + '\n';

    fs.appendFileSync('debug.log', str);
};

module.exports = logger;
