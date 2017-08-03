/* 
* created by XinyangLi 17/6/1
*/

'use strict';
var util = require('util');
var fs = require('fs');
var fileList = require('./lists.js');
var EventEmitter = require('events');
var DeviceClass = require('./device.js');
var zigbee = require('./zigbee_utils.js');
var decode = require('./interpreter.js');
var Device = DeviceClass.Device;
var _ = require('./underscore.js');
var RelationClass = require('./relation.js');
var Relation = RelationClass.Relation;

// ------------------------------------
var myDevice = {};
var newRelation = {};
var groupArray = [];
var onlineDev = {};

// ---------------- searching functions ------------------

// find device through short address from message
function findDeviceShort(msg, targetList) {
  var obj = _.find(targetList, function (dev) {
    return dev.shortAddress == msg.shortAddress;
  });
  return obj;
}
// find device through long address from message
function findDeviceLong(msg, targetList) {
  var obj = _.find(targetList, function (dev) {
    return dev.IEEEAddress == msg.IEEEAddress;
  });
  return obj;
}
// find device through device ID from devicelist
function findDeviceID(deviceID, targetList) {
  var obj = _.find(targetList, function (dev) {
    return dev.deviceID == deviceID;
  });
  return obj;
}
// find device through short address from deviceList
function findDeviceShortAddress(shortAddr, targetList) {
  var obj = _.find(targetList, function (dev) {
    return dev.shortAddress == shortAddr;
  });
  return obj;
}

function findDevice(msg, targetList, type) {
  if (type == 'ID') {
    return findDeviceID(msg, targetList);
  } else if (type == 'shortAddress') {
    return findDeviceShortAddress(msg, targetList);
  } else {
    if (msg.IEEEAddress !== undefined) {
      return findDeviceLong(msg, targetList);
    } else {
      return findDeviceShort(msg, targetList);
    }
  }
}
// ------------------------------------------------

// new device
function newDevice(msg) {
  console.log("--- IEEEADDR: " + msg.IEEEAddress);
  // create new device instance
  myDevice = new Device({
    shortAddress: msg.shortAddress,
    IEEEAddress: msg.IEEEAddress,
    type: DeviceClass.UNKNOWN,
    online: true
  });
  // push device into list
  if (myDevice.IEEEAddress !== '0x0000000000000000') {
    console.log('Push new device into the deviceList');
    fileList.pushDevice(myDevice, 'deviceList');
  } else {
    console.log('--- invalid IEEEaddress, can not be added');
    myDevice = {};
  }
}


// ---------------- usr interface functions ----------------

// set device name
function setName(deviceID, IEEEAddress) {
  var check = 0;
  for (var i in fileList.getList('deviceList')) {
    if (fileList.getListItem('deviceList', i).IEEEAddress == IEEEAddress) {
      fileList.getListItem('deviceList', i).deviceID = deviceID;
      check = 1;
    }
  }
  if (check === 0) {
    console.log('can not find device to be named');
    check = 0;
  } else {
    console.log('name set already');
  }
}
// create new relation
function setRelation(relationName, eShort, rShort, ebutton, rbutton) {

  if (ebutton == 'left') {
    ebutton = RelationClass.LEFT_EP_SWITCH;
  } else if (ebutton == 'right') {
    ebutton = RelationClass.RIGHT_EP_SWITCH;
  }

  if (rbutton == 'left') {
    rbutton = RelationClass.LEFT_EP_SOCKET;
  } else if (rbutton == 'right') {
    rbutton = RelationClass.RIGHT_EP_SOCKET;
  }

  var emitterObj = _.find(fileList.getList('deviceList'), function (dev) {
    return dev.shortAddress == eShort;
  });
  var receiverObj = _.find(fileList.getList('deviceList'), function (dev) {
    return dev.shortAddress == rShort;
  });

  if (emitterObj && receiverObj) {
    newRelation = new Relation({
      name: relationName,
      emitterShort: eShort,
      receiverShort: rShort,
      eEP: ebutton,
      rEP: rbutton
    });
    console.log('--- relation update: ' + util.inspect(newRelation, {
      depth: 12
    }));
    fileList.getList('relationList').push(newRelation);
  } else if (!emitterObj) {
    console.log('can not find emitter with short address: ' + eShort);
  } else if (!receiverObj) {
    console.log('can not find receiver with short address: ' + rShort);
  } else {
    console.log('error occurs in relation setting');
  }
}
// ----------------------------------------

// ---------- functions for reading messages -----------

function leaveDevice(obj) {
  console.log('--- print leave obj');
  console.log(obj);

  if (obj !== undefined) {
    obj.online = false;
    fileList.removeDevice(obj.IEEEAddress);
  } else {
    console.log('leave obj does not exist in list');
  }
}

function announceDevice(obj, msg, myDevice) {
  if (obj !== undefined) {
    console.log('Found obj in deviceList');
    console.log(obj);
    obj.online = true;
  } else {
    console.log('Could not find obj in deviceList');
    // new device instance
    newDevice(msg);
  }
}

function attributeReportDevice(obj, msg, myDevice) {
  if (obj !== undefined) {
    console.log('===obj exists in list===');
  } else if (msg.clusterID !== '0x0006') {
    console.log('--- undefined cluster ID');
  } else {
    console.log('--- Could not find reported obj in deviceList');
  }
}

function attributeControl(msg) {

  var relationsToTrigger = [];
  var DELAY_TIME = 500;

  switch (msg.clusterID) {
    case '0x0006':
      for (var i in fileList.getList('relationList')) {

        var relation = fileList.getListItem('relationList', i);

        if (relation.emitterShort == msg.shortAddress && relation.eEP == msg.endPoint) {



          var obj = findDevice(relation.receiverShort, fileList.getList('deviceList'), 'shortAddress');
          var state = null;
          // determine state
          if (obj) {
            if (relation.rEP == RelationClass.LEFT_EP_SOCKET) {
              state = obj.leftState;
            } else if (relation.rEP == RelationClass.RIGHT_EP_SOCKET) {
              state = obj.rightState;
            } else {
              state = obj.state;
            }
          } else {
            console.log('can not find device, please make sure if it is still online')
          }

          relationsToTrigger.push({ relation: relation, state: state });

          // send command according to state (toggle when state is not available)

        }
      }
      break;
    default:
      break;
    // add more cases if available
  }// end of switch

  function controlLight(obj) {
    //var obj = devicesToTrigger.shift();
    if (obj) {
      if (obj.state == DeviceClass.OFF) {
        console.log('--- light on triggered');
        zigbee.custTurnLightOn(obj.relation.receiverShort, obj.relation.rEP);
      } else if (obj.state == DeviceClass.ON) {
        console.log('--- light off triggered');
        zigbee.custTurnLightOff(obj.relation.receiverShort, obj.relation.rEP);
      } else {
        console.log('error, turn to toggle');
        zigbee.custToggleLight(obj.relation.receiverShort, obj.relation.rEP);
        console.log('error when checking state');
      }
    }
  }
  function loopRelation() {
    var relationItem = relationsToTrigger.shift();
    controlLight(relationItem);

    if (relationsToTrigger.length > 0) {
      setTimeout(function () {
        loopRelation();
      }, DELAY_TIME);
    }
  }
  loopRelation();
}

// read messages
function readMessage(msg) {
  var obj = {};
  var myDevice = {};

  switch (msg.msgType) {
    case 'Leave Indication':
      obj = findDevice(msg, fileList.getList('deviceList'));
      leaveDevice(obj);
      break;

    case 'Device Announce':
      obj = findDevice(msg, fileList.getList('deviceList'));
      announceDevice(obj, msg, myDevice);
      console.log('please name your device below by typing \'name\': ');
      break;

    case 'Attribute Report':
      obj = findDevice(msg, fileList.getList('deviceList'));
      attributeReportDevice(obj, msg, myDevice);
      attributeControl(msg);
      break;
  }
}

module.exports = {
  readMessage: readMessage,
  setName: setName,
  setRelation: setRelation,
}
