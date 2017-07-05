/**
 * Created by SorosLiu on 16/11/29.
 */
'use strict';
var uart = {};
var decode = require('./interpreter.js');
var fileList = require('./lists.js');


function _writeCmd(cmdType, msg) {
    var cmd = decode.pack(cmdType, msg);
    if (uart) {
        console.log('--- uart: ' + JSON.stringify(uart));
        uart.write(Buffer.from(cmd));
    } else {
        console.log('zigbee_utils, empty uart object');
    }
}

function reset() {
    console.log('zigbee reset');
    var msg = new Buffer(0);
    _writeCmd(0x11, msg);
}

function getVersion() {
    console.log('request to get version');
    var msg = new Buffer(0);
    _writeCmd(0x10, msg);
}

function setExtendedPANID() {
    console.log('set extended PANID');
    var msg = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    _writeCmd(0x20, msg);
}

function setChannelMask() {
    console.log('set channel mask');
    // TODO channel mask
    var msg = new Buffer([0x00, 0x00, 0x00, 0x10]);
    _writeCmd(0x21, msg);
}

function setSecurityStateAndKey() {
    console.log('set security state and key');
    var msg = new Buffer([
        0x03,
        0x00, 0x01,
        0x5a, 0x69, 0x67, 0x42, 0x65, 0x65, 0x41, 0x6c,
        0x6c, 0x69, 0x61, 0x6e, 0x63, 0x65, 0x30, 0x39
    ]);
    _writeCmd(0x22, msg);
}

function setDeviceType() {
    console.log('set device type');
    var msg = new Buffer([0x00]);
    _writeCmd(0x23, msg);
}

function startNetwork() {
    console.log('start network');
    var msg = new Buffer(0);
    _writeCmd(0x24, msg);
}

function startNetworkScan() {
    console.log('start network scan');
    var msg = new Buffer(0);
    _writeCmd(0x25, msg);
}

function permitJoiningRequest() {
    console.log('permit joining request');
    //var msg = new Buffer([0x00, 0x00, 0xff, 0x00]);
    // Changed by Yang, 2017.6
    var msg = new Buffer([0xff, 0xfc, 0xfe, 0x00]);
    _writeCmd(0x49, msg);
}

function turnLightOn() {
    console.log('turn light on');
    // TODO short addressES
    var devices = fileList.getList(fileList.deviceList);
    var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x1]);
    if (devices.length !== 0) {
        msg.writeUInt16BE(devices[0].shortAddress, 1);
    }
    _writeCmd(0x92, msg);
}

function turnLightOff() {
    console.log('turn light off');
    // TODO short addressES
    var devices = ileList.getList(fileList.deviceList);
    var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x0]);
    if (devices.length !== 0) {
        msg.writeUInt16BE(devices[0].shortAddress, 1);
    }
    _writeCmd(0x92, msg);
}

function toggleLight() {
    console.log('toggle light');
    var devices = ileList.getList(fileList.deviceList);
    var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x2]);
    if (devices.length !== 0) {
        msg.writeUInt16BE(devices[0].shortAddress, 1);
    }
    _writeCmd(0x92, msg);
}

function listDevices() {

}

// added by XinyangLi
function custTurnLightOn(shortAddress) {
    console.log('turn light on');
    // TODO short addressES
    var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x1]);

    msg.writeUInt16BE(shortAddress, 1);

    _writeCmd(0x92, msg);
}

function custToggleLight(shortAddress) {
    console.log('toggle light');
    console.log('--- short address: ' + shortAddress);
    var msg = new Buffer([0x2, 0xff, 0xff, 0x1, 0x1, 0x2]);
    msg.writeUInt16BE(shortAddress, 1);
    _writeCmd(0x92, msg);
}

// added by Yang
function init(portObj) {
    console.log('into init zigbee_utils');
    uart = portObj;
    console.log('outof init');
}

module.exports = {
    uart: uart,
    init: init,
    turnLightOn: turnLightOn,
    turnLightOff: turnLightOff,
    toggleLight: toggleLight,
    getVersion: getVersion,
    reset: reset,
    setExtenedPANID: setExtendedPANID,
    setChannelMask: setChannelMask,
    setSecurityStateAndKey: setSecurityStateAndKey,
    setDeviceType: setDeviceType,
    startNetwork: startNetwork,
    startNetworkScan: startNetworkScan,
    permitJoiningRequest: permitJoiningRequest,
    custTurnLightOn: custTurnLightOn,
    custToggleLight: custToggleLight

}

// turnLightOn = turnLightOn;
// turnLightOff = turnLightOff;
// toggleLight = toggleLight;
// getVersion = getVersion;
// reset = reset;
// setExtenedPANID = setExtendedPANID;
// setChannelMask = setChannelMask;
// setSecurityStateAndKey = setSecurityStateAndKey;
// setDeviceType = setDeviceType;
// startNetwork = startNetwork;
// startNetworkScan = startNetworkScan;
// permitJoiningRequest = permitJoiningRequest;
// custTurnLightOn = custTurnLightOn;
// custToggleLight = custToggleLight;
