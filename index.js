const restify = require('restify');
// const moment = require('moment');
const request = require('request-promise-native');
const logger = require('./logger');
// const { time } = require('./helpers');
const config = require('./env');

const consoleConfig = { ...config };
logger.info('environment variables:\n', consoleConfig);

// api settings
const server = restify.createServer();
server.server.setTimeout(config.SERVER_TIMEOUT);
server
	.use(restify.plugins.queryParser({ mapParams: false }))
	.use(restify.plugins.bodyParser({ mapParams: false }));

// some handling
server.on('error', (err) => {
	logger.error('server encountered an error', err);
	process.exit(1); // if in docker it should be restarted automatically
});

// router
server.post('/data', async (req, res) => {
	logger.logRequest('fitbit-ifttt-webhook-to-influx.data.post');

	try {
		logger.debug(req.body);
		const data = `fitbit,device=aria bmi=${req.body.bmi},weight=${req.body.weight}`;
		postValuesToInflux(data);
		res.send(201);
	} catch (err) {
		logger.error(err);
		res.send(500, { code: 500, message: `an internal error occurred ${err}` });
	}
});

server.listen(config.SERVER_PORT, () => {
	logger.info(`fitbit-ifttt-webhook-to-influx listening on port ${config.SERVER_PORT}`);
});

function postValuesToInflux(data) {
	return request({
		url: `http://${config.DB_HOST}:${config.DB_PORT}/api/v2/write?bucket=${config.DB_NAME}`,
		method: 'POST',
		body: data
	})
	.catch((err) => {
		logger.error('could not post fitbit data to influx', err);
		throw new Error('could not post fitbit data to influx');
	});
}
