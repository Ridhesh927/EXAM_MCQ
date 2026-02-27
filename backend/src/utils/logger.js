const logger = (action, message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${action}] ${message}`;

    console.log(logMessage);
    if (Object.keys(data).length > 0) {
        console.log(JSON.stringify(data, null, 2));
    }
    console.log('-'.repeat(50)); // Separator
};

module.exports = logger;
