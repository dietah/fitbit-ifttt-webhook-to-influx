const envalid = require('envalid'); // eslint-disable-line object-curly-newline

/* eslint-disable key-spacing */

module.exports = envalid.cleanEnv(process.env, {
	LOG_LEVEL: 		envalid.str({ choices: ['OFF', 'FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'], default: 'DEBUG', devDefault: 'DEBUG' }),

	SERVER_PORT: 	envalid.port({ default: 3005, desc: 'The port on which to expose the HTTP server' }),
	SERVER_TIMEOUT: envalid.num({ default: 2 * 60 * 1000, desc: 'Global response timeout for incoming HTTP calls' }),

	DB_HOST:		envalid.host({ desc: 'The Influx DB host address' }),
	DB_PORT:		envalid.port({ default: 8086, desc: 'The Influx DB port' }),
	DB_NAME:		envalid.str({ default:'fitbit', desc: 'The Influx DB bucket name' }),

	MQTT_HOST:		envalid.host({ desc: 'The MQTT broker host address' }),
	MQTT_PORT:		envalid.port({ default: 1883, desc: 'The MQTT broker port' }),
	MQTT_TOPIC:		envalid.str({ default:'fitbit/aria', desc: 'The Influx DB bucket name' }),
}, {
	strict: true
});
