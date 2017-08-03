'use strict';

var driver = require('ruff-driver');
var ReadStreaming = require('./read-streaming');

var index = 0;

var START_STATE = 111;
var FINDING_STATE = 222;
var EMIT_STATE = 333;
var FSM = START_STATE;

function logHex(buf) {
	return buf.toString("hex").match(/\w\w/g).join(" ");
}

module.exports = driver({

	attach: function (inputs, context) {
		console.log('uart0 attached');
		var that = this;
		this._uart = inputs['uart'];
		this.rBuffer = new Buffer(0);
		this._uart.on('data', function (data) {
			console.log('--- raw data: ' + data.toString('hex'));
			that.rBuffer = Buffer.concat([that.rBuffer, data]);

			// --------- slice and push to buffer -------
			while (true) {
				var start = that.rBuffer.indexOf(0x01);
				var end = that.rBuffer.indexOf(0x03);

				//senario 1: whole pack
				if ((start !== -1 && end !== -1 && start < end) || (FSM === FINDING_STATE && end !== -1)) {
					FSM = EMIT_STATE;
					var tempBuffer = that.rBuffer.slice(start, end + 1);
					that.emit("data", tempBuffer);
					that.rBuffer = that.rBuffer.slice(end + 1);
					FSM = START_STATE;

					// senario 2: start exist, no end, wait for end
				} else if (start !== -1 && end == -1) {
					FSM = FINDING_STATE;
					that.rBuffer = that.rBuffer.slice(start);
					console.log('--- waiting for rest of the message ...');
					break;
				} else {
					FSM = START_STATE;
					break;
				}
			}
		});
	},

	exports: {
		write: function (data, callback) {
			console.log("Uart0 TX RAW write:" + data.length);
			console.log('--- raw data write: ' + data.toString('hex'));
			this._uart.write(data, callback);
		}
	}

});
