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

//var server = require('./udpserver.js');

// ------------------------------------

var myDevice = {};
var newRelation = {};
var groupArray = [];
var onlineDevices = [];
var onlineDev = {};
// ----- device management -------------------------------
function getType(macCapability) {

  if (macCapability == '10000000' || macCapability == '10000011') {
    return DeviceClass.SWITCH;
  } else if (macCapability == '10001110' || macCapability == '10000100' || macCapability == '00010010') {
    return DeviceClass.SOCKET;
  }
  // add more
  else {
    console.log('unidentified device type');
    return DeviceClass.UNKNOWN;
  }
}
// ---------------- find device ------------------
function findDeviceShort(msg, targetList) {


  var obj = _.find(targetList, function(dev) {
    //console.log('--- dev Short: ' + dev.shortAddress);
    return dev.shortAddress == msg.shortAddress;
  });
  return obj;
}

function findDeviceLong(msg, targetList) {

  var obj = _.find(targetList, function(dev) {
    return dev.IEEEAddress == msg.IEEEAddress;
  });
  return obj;
}

function findDeviceID(deviceID, targetList) {
  var obj = _.find(targetList, function(dev) {
    return dev.deviceID == deviceID;
  });
  return obj;
}

function findDeviceShortAddress(shortAddr, targetList) {
  var obj = _.find(targetList, function(dev) {
    return dev.shortAddress = shortAddr;
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
function newDevice(msg) {

  console.log("--- IEEEADDR: " + msg.IEEEAddress);

  myDevice = new Device({
    shortAddress: msg.shortAddress,
    IEEEAddress: msg.IEEEAddress,
    type: getType(msg.macCapability),
    online: true
  });
  // push device into list
  console.log('Push new device into the deviceList');

  if (myDevice.IEEEAddress !== '0x0000000000000000') {
    console.log('Push new device into the deviceList');
    fileList.pushDevice(myDevice, fileList.deviceList);
    console.log('--- device list after push: ' + fileList.deviceList);

  } else {
    console.log('--- invalid IEEEaddress, can not be added');
    myDevice = {};
  }
}

// ====== interfaces for client control =================

function setName(deviceID, IEEEAddress) {

  var check = 0;
  for (var i in fileList.deviceList) {
    if (fileList.deviceList[i].IEEEAddress == IEEEAddress) {
      fileList.deviceList[i].deviceID = deviceID;
      check = 1;
    }
  }

  if (check === 0) {
    console.log('can not find device to be named');
    check = 0;
  } else {
    fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);
    console.log('name has been set');
  }
}

// function setGroup(groupName){
//   for(var i in groupArray){
//     groupArray[i].groupName.push(groupName);
//     if(i !== 0){
//       setRelation('groupName' + i, groupArray[0].shortAddress, groupArray[i].shortAddress);
//     }
//   }
//   console.log('group: ' + groupName + ' been set');
// }
//
// // 注：数组的第一个（0)是emitter，其他都是receiver
// function pushGroupArray(shortAddress){
//   groupArray.push(groupArray);
// }

// ---------- show online devices --------

function getOnlineDevices(){
  console.log('--- get online device list: ' + onlineDevices);
  return onlineDevices;
}

function setOnlineDevices() {

  console.log('--- setOnlineDevices: ' + fileList.deviceList);

  for (var i in fileList.deviceList) {
    onlineDev = new Device({
      deviceID: fileList.deviceList[i].deviceID,
      shortAddress: fileList.deviceList[i].shortAddress,
      state: fileList.deviceList[i].state
    });

    console.log('--- set online device obj: ' + onlineDev);
    onlineDevices.push(onlineDev);
  }
}

function removeOnlineDevices() {
  onlineDevices = [];
}

// ------ create new relation --------
function setRelation(relationName, eShort, rShort) {

  var emitterObj = _.find(fileList.deviceList, function(dev) {
    return dev.shortAddress == eShort;
  });

  var receiverObj = _.find(fileList.deviceList, function(dev) {
    return dev.shortAddress == rShort;
  });

  if (emitterObj && receiverObj) {

    newRelation = new Relation({
      name: relationName,
      emitterShort: eShort,
      receiverShort: rShort
    });

    console.log('--- relation update: ' + util.inspect(newRelation, {
      depth: 12
    }));

    fileList.relationList.push(newRelation);
    fileList.writeList(fileList.RELATION_LIST, fileList.relationList);
  } else if (!emitterObj) {
    console.log('can not find emitter with short address: ' + eShort);
  } else if (!receiverObj) {
    console.log('can not find receiver with short address: ' + rShort);
  } else {
    console.log('error occurs in relation setting');
  }
}
// ----------------------------------------

// =======================================================

function leaveDevice(obj) {
  console.log('--- print leave obj');
  console.log(obj);

  if (obj !== undefined) {
    obj.online = false;
    fileList.removeDevice(fileList.deviceList, obj.IEEEAddress);
    fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);


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
    fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);
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
  switch (msg.clusterID) {

    case '0x0006':
      console.log('--- cluster ID 0x0006 identified');

      for (var i in fileList.relationList) {
        if (fileList.relationList[i].emitterShort == msg.shortAddress) {
          console.log('enter attribute trigger');

          var obj = findDevice(fileList.relationList[i].receiverShort, fileList.deviceList, 'shortAddress');

          console.log('=== receiver short: ' + fileList.relationList[i].receiverShort);

          if (obj && obj.state == DeviceClass.OFF) {
            console.log('--- light on triggered');
            zigbee.custTurnLightOn(fileList.relationList[i].receiverShort);
            obj.state = DeviceClass.ON;
          } else if (obj && obj.state == DeviceClass.ON) {
            console.log('--- light off triggered');
            zigbee.custTurnLightOff(fileList.relationList[i].receiverShort);
            obj.state = DeviceClass.OFF;
          } else {
            console.log('error, turn to toggle');
            console.log('--- state: ' + obj.state);
            zigbee.custToggleLight(fileList.relationList[i].receiverShort);
          }


          fileList.writeList(fileList.DEVICE_LIST, fileList.deviceList);
          console.log('--- relation triggered: ' + fileList.relationList[i].name);
        }
      }
  }
}

//=======================
function readMessage(msg) {
  var obj = {};
  var myDevice = {};

  switch (msg.msgType) {
    case 'Leave Indication':
      obj = findDevice(msg, fileList.deviceList);
      leaveDevice(obj);
      break;

    case 'Device Announce':
      obj = findDevice(msg, fileList.deviceList);
      announceDevice(obj, msg, myDevice);
      console.log('please name your device below by typing \'name\': ');
      break;

    case 'Attribute Report':
      obj = findDevice(msg, fileList.deviceList);
      attributeReportDevice(obj, msg, myDevice);
      attributeControl(msg);
      break;
  }
}

module.exports = {
  readMessage: readMessage,
  getOnlineDevices: getOnlineDevices,
  setName: setName,
  setRelation: setRelation,
  setOnlineDevices: setOnlineDevices,
  removeOnlineDevices: removeOnlineDevices
}
