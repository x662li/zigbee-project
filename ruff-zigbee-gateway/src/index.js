'use strict';

var decode = require('./interpreter.js');
var manager = require('./device_manager.js');
var fileList = require('./lists.js');
var zigbee = require('./zigbee_utils.js');
var communication = require('./communication_utils.js');
var uart = $('#zuart');
var emitter = decode.getEmitter();
var server = require('./udpserver.js');
var _ = require('./underscore.js');
var DeviceClass = require('./device.js');

$.ready(function (error) {
  if (error) {
    console.log(error);
    return;
  } else {
    console.log('no error when start');
  }

  console.log('hello');

  // check file after started
  fileList.checkFile(fileList.DEVICE_LIST, 'deviceList');
  fileList.checkFile(fileList.RELATION_LIST, 'relationList');

  var timer = new Date();
  var initTime = timer.getTime();
  var finalTime;

  uart.on('data', function (data) {

    console.log('--- data to be unpacked: ' + data.toString('hex'));

    // unpack message
    var unpackedMessages = decode.unpack(data);

    // output message unpacked
    console.log('<---------------------- unpackedMessage:');
    console.log(unpackedMessages);
    console.log('----------------------------------------');
    console.log(' ');

    try {
      if (typeof unpackedMessages !== 'object') {
        unpackedMessages = JSON.parse(unpackedMessages);
      }
    } catch (e) {
      console.log('unpackedMessage not an object');
      return;
    }

    /* parse incomming message
    set type for announced device
    change device status
    read just one message within 0.5s 
    */
    unpackedMessages.forEach(function (m) {

      if (m) {
        // determine state and type
        if (m.msgType) {

          timer = new Date();
          finalTime = timer.getTime();

          if (m.msgType == 'Attribute Report' && m.attributeID == '0x0005') {
            console.log('--- type define triggered')
            var type = DeviceClass.UNKNOWN;
            var buf = m.attributeData.slice(m.attributeData.length - 4, m.attributeData.length);
            if (buf == '7731') {
              type = DeviceClass.SINGLE_SWITCH;
            } else if (buf == '7732') {
              type = DeviceClass.DOUBLE_SWITCH;
            }
            else if (buf == '6c31') {
              type = DeviceClass.SINGLE_SOCKET;
            } else if (buf == '6c32') {
              type = DeviceClass.DOUBLE_SOCKET;
            }
            var obj = _.find(fileList.getList('deviceList'), function (dev) {
              return dev.shortAddress.toString('hex') == m.shortAddress;
            });
            if (obj) {
              obj.type = type;
              if (type == DeviceClass.DOUBLE_SOCKET || type == DeviceClass.DOUBLE_SWITCH) {
                obj.state = null; // for double switchs, there's no state
              }
            }
          }


          if ((m.msgType == 'Attribute Report' || m.msgType == 'Read Attribute Report') && m.clusterID == '0x0006' && m.attributeID == '0x0000') {
            if (m.endPoint == '0x02') {
              var obj = _.find(fileList.getList('deviceList'), function (dev) {
                return dev.shortAddress.toString('hex') == m.shortAddress;
              });
              if (obj) {
                if (m.status == '0x01') {
                  if (obj.type == 0x20) {
                    console.log('single socket on');
                    obj.state = 1;
                  } else if (obj.type == 0x21) {
                    console.log('left socket state on');
                    obj.leftState = 1;
                  }
                } else if (m.status == '0x00') {
                  if (obj.type == 0x20) {
                    console.log('single socket state off');
                    obj.state = 0;
                  } else if (obj.type == 0x21) {
                    console.log('left socket state off');
                    obj.leftState = 0;
                  }
                }
              }
            } else if (m.endPoint == '0x03') {
              var objDouble = _.find(fileList.getList('deviceList'), function (dev) {
                return dev.shortAddress.toString('hex') == m.shortAddress;
              });
              if (objDouble) {
                if (m.status == '0x01' && objDouble.type == 0x21) {
                  console.log('right socket on');
                  objDouble.rightState = 1;
                } else if (m.status == '0x00' && objDouble.type == 0x21) {
                  console.log('right socket state off');
                  objDouble.rightState = 0;
                }
              }
            }
          }
          // timing, read just one meg within 0.5s
          if (m.msgType == 'Attribute Report' && (finalTime - initTime) < 500) {
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

  /* 
  reset when started
  */
  zigbee.reset();

  /* 
  start the net 5s after initialization
  */
  setTimeout(function () {
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

$.end(function () {

});
