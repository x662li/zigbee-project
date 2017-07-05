'use strict';

var OFF = 0;
var ON = 1;//灯亮

var SWITCH = 0x10;
var SOCKET = 0x11;
var UNKNOWN = 0x12;

function Device(options) {
    //this.id = 0x00;
    this.shortAddress = options.shortAddress || '0x00';
    this.IEEEAddress = options.IEEEAddress || '0x0000000000000000';

    this.state = options.state || OFF;
    this.type = options.type || SWITCH;
    this.online = options.online || false;
    this.content = {};
    this.controlledBy = [];

    this.deviceID = options.devName || 'emptyName';
    //this.groupName = [];
}

module.exports = {
    Device: Device,
    SWITCH: SWITCH,
    SOCKET: SOCKET,
    UNKNOWN: UNKNOWN,
    OFF: OFF,
    ON: ON
}

// module.exports.Device = Device;
// module.exports.SWITCH = SWITCH;
// module.exports.SOCKET = SOCKET;
// module.exports.UNKNOWN = UNKNOWN;
