/* eslint no-restricted-syntax: 0 */
/* eslint no-await-in-loop: 0 */

// Get external dependencies
const moment = require('moment');
const path = require('path');
const fsp = require('fs').promises;
const request = require('request-promise-native');

// Get internal dependencies
const helpers = require('./helpers');
const logger = require('./logger');

// settings
const FOLDER = './fitbit';
const INFLUX_HOST = '';
const INFLUX_PORT = '8086';
const INFLUX_BUCKET = 'fitbit';

(async () => {
	try {
		const startDateTime = moment();
		logger.info('Starting fibit data import');

		let files = await fsp.readdir(FOLDER, { withFileTypes: true });
		logger.info(`Detected ${files.length} files`);

		for (const f of files) {
			let fullPath = path.join(FOLDER, f);
			logger.debug(`Started reading ${fullPath}`);

			const file = await fsp.readFile(fullPath, 'utf-8');
			const logs = JSON.parse(file);

			for (const log of logs) {
				log.epoch = moment(`${log.date} ${log.time}`, 'MM/DD/YY HH:mm:ss').valueOf();
				log.weight = Math.round(log.weight / 2.205 * 10) / 10;
				await postValuesToInflux(log);
			}
		}

		const endDateTime = moment();
		logger.info(`Importing fitbit data took ${helpers.time(startDateTime, endDateTime)}`);
	} catch (error) {
		logger.error('Failed to import fitbit data', error);
	}
})();

function postValuesToInflux(data) {
	let body = `fitbit,device=aria bmi=${data.bmi},weight=${data.weight} ${data.epoch}`;

	if (data.fat) {
		body = `fitbit,device=aria bmi=${data.bmi},weight=${data.weight},fat=${data.fat} ${data.epoch}`;
	}

	return request({
		url: `http://${INFLUX_HOST}:${INFLUX_PORT}/api/v2/write?bucket=${INFLUX_BUCKET}&precision=ms`,
		method: 'POST',
		body
	})
	.catch((err) => {
		logger.error('could not post fitbit data to influx', err);
		throw new Error('could not post fitbit data to influx');
	});
}
