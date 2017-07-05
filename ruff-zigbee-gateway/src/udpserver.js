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

  if (msg.cmd == 'ping') {
    return parse_cmd_ping(msg);
  } else if (msg.cmd == 'startnetwork') {
    zigbee.startNetwork();
    return {
      cmd: 'startnetwork_rsp'
    };
  } else if (msg.cmd == 'clean') {
    fileList.resetList(fileList.getList(fileList.deviceList));
    fileList.writeList(fileList.DEVICE_LIST, fileList.getList(fileList.deviceList));
    return {
      cmd: 'clean_rsp'
    };
  } else if (msg.cmd == 'permitjoining') {
    // 允许设备加入
    zigbee.permitJoiningRequest();

    return {
      cmd: 'permitjoining_rsp'
    };
  } else if (msg.cmd == 'list') {

    console.log('--- pre view list: '+ fileList.getList(fileList.deviceList));

    return {
      cmd: 'list_rsp',
      content: JSON.stringify(fileList.getList(fileList.deviceList))
    };
  }

  // additional commands
  else if (msg.cmd == 'onlinedevice') {

    manager.removeOnlineDevices();

    manager.setOnlineDevices();

    console.log('--- onlineDevices: ' + manager.getOnlineDevices());
    return {
      cmd: 'online_device_rsp',
      content: JSON.stringify(manager.getOnlineDevices())
    };
  }
  // naming ------------------------------
  else if(msg.cmd == 'name'){
    console.log('===IEEEaddr: ' + msg.IEEEAddress );
    console.log('===name: ' + msg.name);

    manager.setName(msg.name, msg.IEEEAddress);

    return{
      cmd: 'name_rsp'
    };
  }

  else if(msg.cmd == 'relation'){
    console.log('===relation name: ' + msg.relationName);
    console.log('===emitter short address: ' + msg.emitterShort);
    console.log('===receiver short address: ' + msg.receiverShort);

    manager.setRelation(msg.relationName, msg.emitterShort, msg.receiverShort);

    return{
      cmd: 'relation_rsp'
    };

  }
  // ------------------------------------
  else { // unknown command
    return {
      cmd: 'unknown_cmd'
    };
  }

}

function parse_cmd_ping(msg) {
  var feedback = {};
  feedback.cmd = 'ping_rsp';
  feedback.id = GATEWAY_ID;
  return feedback;
}


server.on("error", function(err) {
  console.log("server error:\n" + err.stack);
  server.close();
});

server.on("message", function(msg, rinfo) {
  console.log("server got: " + msg + " from " +
    rinfo.address + ":" + rinfo.port);
  var msgObj;

  try {
    msgObj = JSON.parse(msg);

  } catch (e) {
    console.log("wrong JSON msg");
    console.log(e);
    return;
  }

  console.log(msgObj.cmd);

  var feedback = parse(msgObj);

  var msg2 = JSON.stringify(feedback);

  server.send(msg2,
    0,
    msg2.length,
    rinfo.port,
    rinfo.address,
    function(err, bytes) {
      if (err)
        throw err;
    }
  );

});

server.on("listening", function() {
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
