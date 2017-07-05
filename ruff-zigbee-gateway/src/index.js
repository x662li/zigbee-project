'use strict';

var decode = require('./interpreter.js');
var manager = require('./device_manager.js');
var fileList = require('./lists.js');
var zigbee = require('./zigbee_utils.js');
var communication = require('./communication_utils.js');
var uart = $('#zuart');
var emitter = decode.getEmitter();
var server = require('./udpserver.js');


$.ready(function(error) {
  if (error) {
    console.log(error);
    return;
  }

  console.log('hello');

  fileList.checkFile(fileList.DEVICE_LIST, fileList.deviceList);
  fileList.checkFile(fileList.RELATION_LIST, fileList.relationList);

  var timer = new Date();
  var initTime = timer.getTime();
  var finalTime;

  uart.on('data', function(data) {

    var unpackedMessages = decode.unpack(data);

    console.log('<---------------------- unpackedMessage:');
    console.log(unpackedMessages);
    console.log('----------------------------------------');
    console.log(' ');
    //console.log(Object.prototype.toString.call(unpackedMessages));

    // output Mac capability
    //console.log("macCapability: " +  )
    try {
      if (typeof unpackedMessages !== 'object') {
        unpackedMessages = JSON.parse(unpackedMessages);
      }
    } catch (e) {
      console.log('unpackedMessage not an object');
      return;
    }

    unpackedMessages.forEach(function(m) {
      if (m) {
        if (m.msgType) {

          timer = new Date();
          finalTime = timer.getTime();
          // console.log('===== Final time: ' + finalTime);
          // console.log('===== Initl time: ' + initTime);
          // console.log('===== time: ' + (finalTime - initTime));
          if(m.msgType == 'Attribute Report' && (finalTime - initTime) < 500){
            timer = new Date();
            initTime = timer.getTime();
          } else {
            timer = new Date();
            initTime = timer.getTime();
            manager.readMessage(m);
          }
        }
      }
    });
  });


  // reboot the zigbee dongle
  //zigbee.setChannelMask();

zigbee.reset();

  // after 5 seconds, start the network
  setTimeout(function() {
    main();
  }, 5000);
});

function main() {
  console.log('--------Start----------');
  zigbee.startNetwork();
  server.start({
    id: 'gateway_01',
    port: 33333
  });
}

$.end(function() {

});
