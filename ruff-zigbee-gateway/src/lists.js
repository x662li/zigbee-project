'use strict';
var fs = require('fs');
var _ = require('./underscore.js');

var fileChecked = 0;

var deviceList = [];
var relationList = [];

var listArray = [];

var DEVICE_LIST = '/home/root/devices.json';
var RELATION_LIST = '/home/root/relations.json';

listArray.push(deviceList);
listArray.push(relationList);

// ========== repetitive format ====
// if(listName == 'deviceList') {
//
// } else if (listName == 'relationList') {
//
// } else {
//   console.log('wrong list name');
// }
// ==================================

// ---------- getters and setters -----
function getListCopy(listName) {
  if (listName == 'deviceList') {
    var strList = JSON.stringify((deviceList));
    return JSON.parse(strList);
  } else if (listName == 'relationList') {
    var strList = JSON.stringify((relationList));
    return JSON.parse(strList);
  } else {
    console.log('wrong list name')
  }
}

function getList(listName) {
  if (listName == 'deviceList') {
    console.log('--- get device list: ' + deviceList);
    return deviceList;
  } else if (listName == 'relationList') {
    console.log('--- get relation list: ' + relationList);
    return relationList;
  } else {
    console.log('wrong list name');
  }
}

function getListItem(listName, index) {
  if (listName == 'deviceList') {
    return deviceList[index];
  } else if (listName == 'relationList') {
    return relationList[index];
  } else {
    console.log('wrong list name')
  }
}

function pushDevice(device, listName) {
  if (listName == 'deviceList') {
    deviceList.push(device);
  } else if (listName == 'relationList') {
    relationList.push(relationList);
  } else {
    console.log('wrong list name');
  }
}

// ---------- file managment --------------

function checkFile(FILE_NAME, listName) {

  fs.exists(FILE_NAME, function (exists) {
    console.log('--- file exists: ', exists);
    //console.log(require('/etc/devices'));
    if (exists) {

      fs.readFile(FILE_NAME, function (err, data) {
        if (err) throw err;
        // device list
        console.log('--- check file data: ' + data);
        if (listName == 'deviceList') {
          try {
            var devices = JSON.parse(data).deviceList;
          } catch (e) {
            console.log(e);
            return;
          }
          console.log('--- check file parse data: ' + devices);
          if (devices) {
            console.log('--- file exists: ' + FILE_NAME);
            // copy array
            for (var i in devices) {
              deviceList.push(devices[i]);
            }
            fileChecked++;
          } else {
            listName = [];
          }

          // ---------------

          // relation list
        } else if (listName == 'relationList') {
          try {
            var devices = JSON.parse(data).relationList;

          } catch (e) {
            console.log(e);
            return;
          }
          if (devices) {
            console.log('--- file exists: ' + FILE_NAME);
            // copy array
            for (var i in devices) {
              relationList.push(devices[i]);
            }
            fileChecked++;
          } else {
            listName = [];
          }
          // wrong list
        } else {
          console.log('wrong list name');
        }

      });
    } else {
      console.log('--- file does not exist');


    }
  });
}

function writeList(FILE_NAME, listName) {

  //console.log('===== write file triggered');
  var toSaveObj;

  if (listName == 'deviceList') {
    toSaveObj = {
      deviceList: deviceList
    }
  } else if (listName == 'relationList') {
    toSaveObj = {
      relationList: relationList
    }
  } else {
    console.log('wrong list name');
  }

  fs.writeFile(FILE_NAME, JSON.stringify(toSaveObj), function (err) {
    if (err) throw err;

    console.log('--- Device List saved!');
  });
}

// ------------- list managment ------------
function removeDevice(deviceExtendedAddress) {
  for (var i in deviceList) {
    console.log('--- remove device, IEEE: ' + deviceList[i].IEEEAddress);
    if (deviceList[i].IEEEAddress == deviceExtendedAddress) {
      console.log('--- find IEEE address to be removed');
      // cut relavent relation in relationList
      for (var j in relationList) {
        if (deviceList[i].shortAddress == relationList[j].emitterShort || deviceList[i].shortAddress == relationList[j].receiverShort) {
          console.log('--- find relevant relation to be removed')

          relationList.splice(j, 1);
        }
        else {
          console.log('--- no relevant relation find');
        }
      }
      // cut device from list
      deviceList.splice(i, 1);
    }
  }
}

function resetList(listName) {
  //console.log
  if (listName == 'deviceList') {
    deviceList = [];
  } else if (listName == 'relationList') {
    relationList = [];
  } else {
    console.log('wrong list name');
  }
}

// traverse device list and identify
function isDeviceJoined(listName, deviceParameter) {

  if (listName == 'deviceList') {
    for (var i = 0; i < deviceList.length; i++) {
      // TODO should be device unique identifier
      if (deviceList[i].IEEEaddress === deviceParameter) {
        return true;
      }
    }
  } else if (listName == 'relationList') {
    for (var j = 0; j < relationList.length; j++) {
      // TODO should be device unique identifier
      if (relationList[j].IEEEaddress === deviceParameter) {
        return true;
      }
    }
  } else {
    console.log('wrong list name');
  }

  return false;
}

module.exports = {
  checkFile: checkFile,
  writeList: writeList,
  isDeviceJoined: isDeviceJoined,
  resetList: resetList,
  getList: getList,
  getListCopy: getListCopy,
  getListItem: getListItem,
  pushDevice: pushDevice,
  removeDevice: removeDevice,
  //deviceList: deviceList,
  //relationList: relationList,
  DEVICE_LIST: DEVICE_LIST,
  RELATION_LIST: RELATION_LIST,
  //listArray: listArray
  fileChecked: fileChecked
}
