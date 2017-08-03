'use strict';

var dgram = require("dgram");
var server = dgram.createSocket('udp4');
var manager = require('./device_manager.js');
var zigbee = require('./zigbee_utils.js');
var fileList = require('./lists.js');
var PORT = 0;
var GATEWAY_ID = 0;
var naming = false
var count = 0;

function parse(msg) {
  var deviceID;
  var IEEEAddress;

  // ----------- parse messages -------------
  if (msg.cmd == 'ping') {
    return parse_cmd_ping(msg);
  } else if (msg.cmd == 'startnetwork') {
    zigbee.startNetwork();
    return {
      cmd: 'startnetwork_rsp'
    };
  } else if (msg.cmd == 'cleandevicelist') {
    fileList.resetList('deviceList');
    return {
      cmd: 'clean_rsp'
    };
  } else if (msg.cmd == 'cleanrelationlist') {
    fileList.resetList('relationList');
    return {
      cmd: 'clean_rsp'
    };
  } else if (msg.cmd == 'permitjoining') {
    zigbee.permitJoiningRequest();
    return {
      cmd: 'permitjoining_rsp'
    };
  } else if (msg.cmd == 'listdevices') {
    return {
      cmd: 'listdevices_rsp',
      content: JSON.stringify(fileList.getList('deviceList'))
    };
  } else if (msg.cmd == 'listrelations') {
    return {
      cmd: 'listrelations_rsp',
      content: JSON.stringify(fileList.getList('relationList'))
    };
  } else if (msg.cmd == 'savedevicelist') {
    fileList.writeList(fileList.DEVICE_LIST, 'deviceList');
    return {
      cmd: 'savedevicelist_rsp'
    }
  } else if (msg.cmd == 'saverelationlist') {
    fileList.writeList(fileList.RELATION_LIST, 'relationList');
    return {
      cmd: 'saverelationlist_rsp'
    }
  } else if (msg.cmd == 'onlinedevice') {
    return {
      cmd: 'online_device_rsp',
      content: JSON.stringify(fileList.getListCopy('deviceList'))
    };
  } else if (msg.cmd == 'name') {
    console.log('===IEEEaddr: ' + msg.IEEEAddress);
    console.log('===name: ' + msg.name);
    manager.setName(msg.name, msg.IEEEAddress);
    return {
      cmd: 'name_rsp'
    };
  } else if (msg.cmd == 'relation') {
    console.log('===relation name: ' + msg.relationName);
    console.log('===emitter short address: ' + msg.emitterShort);
    console.log('===receiver short address: ' + msg.receiverShort);

    var eButton = null;
    var rButton = null;
    if (msg.emitterButton) {
      console.log('===emitter button: ' + msg.emitterButton);
      if (msg.emitterButton == 'left' || msg.emitterButton == 'single') {
        eButton = 'left';
      } else if (msg.emitterButton == 'right') {
        eButton = 'right';
      }
    }
    if (msg.receiverButton) {
      console.log('===receiver button: ' + msg.receiverButton);
      if (msg.receiverButton == 'left' || msg.receiverButton == 'single') {
        rButton = 'left';
      } else if (msg.receiverButton == 'right') {
        rButton = 'right';
      }
    }
    manager.setRelation(msg.relationName, msg.emitterShort, msg.receiverShort, eButton, rButton);
    return {
      cmd: 'relation_rsp'
    };
  } else if (msg.cmd == 'removedevice') {
    console.log('--- remove device IEEE: ' + msg.IEEEAddress);
    fileList.removeDevice(msg.IEEEAddress);
    return {
      cmd: 'remove_rsp'
    };
  } else if (msg.cmd == 'removerelation') {
    console.log('--- remove relation name: ' + msg.name);
    for (var i in fileList.getList('relationList')) {
      if (fileList.getListItem('relationList', i).name == msg.name) {
        fileList.getList('relationList').splice(i, i + 1);
      }
    }
    return {
      cmd: 'remove_rsp'
    };
  } else if (msg.cmd == 'checkstatus') {
    console.log('check device with short address: ' + msg.shortAddress);
    var endPoint = 0x2;
    if (msg.button == 'left') {
      endPoint = 0x2;
    } else if (msg.button == 'right') {
      endPoint = 0x3;
    }
    zigbee.checkLightStatus(msg.shortAddress, endPoint);
    return {
      cmd: 'checkstatus_rsp'
    };
  } else if (msg.cmd == 'control') {
    console.log('---- control device: ' + msg.receiverShort + '  ' + msg.receiverButton + '  state: ' + msg.command);
    var endPoint = 0x2;
    if (msg.receiverButton == 'left') {
      endPoint = 0x2;
    } else if (msg.receiverButton == 'right') {
      endPoint = 0x3;
    }
    if (msg.command == 'on') {
      zigbee.custTurnLightOn(msg.receiverShort, endPoint);
    } else if (msg.command == 'off') {
      zigbee.custTurnLightOff(msg.receiverShort, endPoint);
    }
    return {
      cmd: 'control_rsp'
    };

    /*

    add more command if available 

    */

  } else { // unknown command
    return {
      cmd: 'unknown_cmd'
    };
  }
}
// --------------------------------------

function parse_cmd_ping(msg) {
  var feedback = {};
  feedback.cmd = 'ping_rsp';
  feedback.id = GATEWAY_ID;
  return feedback;
}

server.on("error", function (err) {
  console.log("server error:\n" + err.stack);
  server.close();
});

server.on("message", function (msg, rinfo) {
  console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
  var msgObj;

  try {
    msgObj = JSON.parse(msg);

  } catch (e) {
    console.log("wrong JSON msg");
    console.log(e);
    return;
  }
  var feedback = parse(msgObj);
  var msg2 = JSON.stringify(feedback);
  server.send(msg2,
    0,
    msg2.length,
    rinfo.port,
    rinfo.address,
    function (err, bytes) {
      if (err)
        throw err;
    }
  );
});

server.on("listening", function () {
  var address = server.address();
  console.log("server listening " +
    address.address + ":" + address.port);
});

function start(options) {
  PORT = options.port || 33333;
  GATEWAY_ID = options.id || 'gateway_01';
  server.bind(PORT);
}



module.exports.start = start;
