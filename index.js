const restify = require('restify');
const request = require('request-promise-native');
const logger = require('./logger');
const moment = require('moment');
// const { time } = require('./helpers');
const config = require('./env');
const mqtt = require('mqtt');

const consoleConfig = { ...config };
logger.info('environment variables:\n', consoleConfig);

// api settings
const server = restify.createServer();
server.server.setTimeout(config.SERVER_TIMEOUT);
server
	.use(restify.plugins.queryParser({ mapParams: false }))
	.use(restify.plugins.bodyParser({ mapParams: false }));

// mqtt settings
const client = mqtt.connect({ port: config.MQTT_PORT, host: config.MQTT_HOST });

// some handling
server.on('error', (err) => {
	logger.error('server encountered an error', err);
	process.exit(1); // if in docker it should be restarted automatically
});

// router
server.post('/data', async (req, res) => {
	logger.logRequest('fitbit-ifttt-webhook-to-influx.data.post');

	try {
		const data = req.body;
		data.epoch = moment(data.date, "MMMM D, YYYY at hh:mmA").valueOf();
		logger.debug(data);

		postValuesToInflux(data);
		postValuesToMQTT(data);

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
	const body = `fitbit,device=aria bmi=${data.bmi},weight=${data.weight} ${data.epoch}`;

	return request({
		url: `http://${config.DB_HOST}:${config.DB_PORT}/api/v2/write?bucket=${config.DB_NAME}&precision=ms`,
		method: 'POST',
		body
	})
	.catch((err) => {
		logger.error('could not post fitbit data to influx', err);
		throw new Error('could not post fitbit data to influx');
	});
}

function postValuesToMQTT(data) {
	client.publish(`${config.MQTT_TOPIC}/weight`, `${data.weight}`);
	client.publish(`${config.MQTT_TOPIC}/bmi`, `${data.bmi}`);
	client.publish(`${config.MQTT_TOPIC}/date`, `${data.epoch}`);
}
