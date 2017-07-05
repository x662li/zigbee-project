'use strict'

var log_print = console.log.bind(this);
//var log_print = functiong(){};

var EventEmitter = require('events');
var util = require('util');
var SerialPort = require('serialport');
//var Protocol = require('./protocol.js');


var rcvBuf = new Buffer(255);




function MTPort(portPath, baudRate) {
	EventEmitter.call(this);
	var that = this;

	this._port = new SerialPort(
		portPath,
		{
			baudrate: baudRate,
			parser: SerialPort.parsers.raw
		}
	);


	this._port.on('open', function () {
		//log_print( ' opened');
		that.emit('open');
	});

	this._port.on('error', function (err) {
		//log_print('Error: ', err.message);
		that.emit('error', err);
	});

	this._port.on('close', function () {
		//log_print(' closed');
		that.emit('close');
	});

	this._port.on('data', function (data) {
		that.emit('data', data);
		log_print(data);

		//AnalyzeFrame(data, that);
	});


}

util.inherits(MTPort, EventEmitter);


MTPort.prototype.write = function (data) {
	this._port.write(data);
};



module.exports = MTPort;

