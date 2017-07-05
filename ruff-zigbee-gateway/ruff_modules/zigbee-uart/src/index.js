'use strict';

var driver = require('ruff-driver');
var ReadStreaming = require('./read-streaming');

//var buffer = new Buffer(256);
var index = 0;
//var conbinedData = new Buffer(256);

var START_STATE = 111;
var FINDING_STATE = 222;
var EMIT_STATE = 333;
var FSM = START_STATE;

function logHex(buf) {
	return buf.toString("hex").match(/\w\w/g).join(" ");
}

module.exports = driver({

	attach: function (inputs, context) {
		// this._<interface> = inputs['<interface>'];
		console.log('uart0 attached');
		var that = this;

		this._uart = inputs['uart'];

		this.rBuffer = new Buffer(0);

		this._uart.on('data', function (data) {

			that.rBuffer = Buffer.concat([that.rBuffer, data]);

			// --------- to string and log -------------
			console.log('Uart0 RX raw data(length):' + data.length);
			//console.log('rBuffer: ' + logHex(that.rBuffer));

			var gap = ' ';
			var dataSegment = '0x ';
			var tempData;

			// for (var i = 0; i <= data.length * 2; i += 2) {
			// 	tempData = data.toString('hex').slice(i, i + 2)
			// 	dataSegment = dataSegment.concat(tempData, gap);
			// }

			//console.log('--- raw data: ', dataSegment);

			// --------- slice and push to buffer -------
			while (true) {

				var start = that.rBuffer.indexOf(0x01);
				var end = that.rBuffer.indexOf(0x03);
				//console.log('--- start: ' + start);
				//console.log('--- end: ' + end);

				//senario 1: whole pack
				if ((start !== -1 && end !== -1 && start < end) || (FSM === FINDING_STATE && end !== -1)) {
					FSM = EMIT_STATE;
					//console.log('--- senario 1 enter once');
					var tempBuffer = that.rBuffer.slice(start, end + 1);
					//console.log('--- tempBuffer: ' + logHex(tempBuffer));
					that.emit("data", tempBuffer);
					that.rBuffer = that.rBuffer.slice(end + 1);
					FSM = START_STATE;
					// senario 2: start exist, no end, wait for end
				} else if (start !== -1 && end == -1) {
					FSM = FINDING_STATE;
					//console.log('--- senario 2 enter once');
					that.rBuffer = that.rBuffer.slice(start);
					console.log('--- waiting for rest of the message ...');
					break;
				} else {
					FSM = START_STATE;
					//console.log('--- senario 3 enter once');
					break;
				}
			}
		});
	},

	exports: {
		write: function (data, callback) {
			// this._<interface>.<method>
			//console.log(typeof data);
			console.log("Uart0 TX RAW write:" + data.length);
			console.log('--- raw data write: ' + data.toString('hex'));
			this._uart.write(data, callback);
		}
	}

});
