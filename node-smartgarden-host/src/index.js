/**
 * @fileOverview
 * @name index.js<smartgarden-host>
 * @author Yang Jun <yangjun@nanchao.org>
 * @license MIT license
 */

'use strict';


var decode = require('./interpreter.js');
var manager = require('./device_manager.js');
var fileList = require('./lists.js');
var zigbee = require('./zigbee_utils.js');
var communication = require('./communication_utils.js');
var MTPort = require('./mt.js');
var emitter = decode.getEmitter();
var server = require('./udpserver.js');

var UART_PORT = '/dev/tty.usbserial-NX0MNE0B';
var UART_BAUDRATE = 1000000;

var DEBUG = true;
var log_print = console.log.bind(this);

var port = {};

/**********************************************************/



// Main entry func
function main() {

    log_print('\nApp Started');


    port = new MTPort(UART_PORT, UART_BAUDRATE);

    fileList.checkFile(fileList.DEVICE_LIST);
    fileList.checkFile(fileList.BIND_LISTA);
    fileList.checkFile(fileList.BIND_LISTA);



    // var port = new SerialPort(
    // 	UART_PORT,
    // 	{
    // 	    baudrate:UART_BAUDRATE,
    // 	    parser:  SerialPort.parsers.raw
    // 	}
    // );    

    port.on('open', function () {
        log_print('MT port opened');
        zigbee.init(port);
        zigbee.reset();

    });


    port.on('error', function (err) {
        log_print(err.message);
    });

    port.on('data', function (data) {

        //console.log('--- raw data: ' + data);
        var unpackedMessages = decode.unpack(data);

        console.log('<---------------------- unpackedMessage:');
        console.log(unpackedMessages);
        console.log('----------------------------------------');
        console.log('');

        console.log(Object.prototype.toString.call(unpackedMessages));

        // output Mac capability
        //console.log("macCapability: " +  )
        try {
            if (typeof unpackedMessages !== 'object') {
                unpackedMessages = JSON.parse(unpackedMessages);
            }
        }
        catch (e) {
            console.log('unpackedMessage not an object');
            return;
        }

        unpackedMessages.forEach(function (m) {
            if (m) {
                //console.log(m);
                //console.log(Object.prototype.toString.call(m));
                if (m.msgType) {
                    //console.log(m.msgType);
                    manager.readMessage(m);
                }

            }
        });
    });

    //zigbee.reset();

    setTimeout(function () {

        log_print('\nApp Started');

        console.log('--------Start----------');
        zigbee.startNetwork();

        server.start(
            {
                id: 'gateway_01',
                port: 33333
            }
        );

    }, 4000);



};

main();














