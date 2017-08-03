'use strict';

var OFF = 0;
var ON = 1;

var SINGLE_SWITCH = 0x10;
var DOUBLE_SWITCH = 0x11;
var SINGLE_SOCKET = 0x20;
var DOUBLE_SOCKET = 0x21;
var UNKNOWN = 0x12;

function Device(options) {

    this.shortAddress = options.shortAddress || '0x00';
    this.IEEEAddress = options.IEEEAddress || '0x0000000000000000';

    this.state = options.state || OFF;
    this.leftState = options.leftState || null;
    this.rightState = options.rightState || null;

    this.type = options.type || SINGLT_SWITCH;
    this.online = options.online || false;
    this.content = {};
    this.controlledBy = [];

    this.deviceID = options.devName || 'emptyName';
}

module.exports = {
    Device: Device,
    SINGLE_SWITCH: SINGLE_SWITCH,
    DOUBLE_SWITCH: DOUBLE_SWITCH,
    SINGLE_SOCKET: SINGLE_SOCKET,
    DOUBLE_SOCKET: DOUBLE_SOCKET,
    UNKNOWN: UNKNOWN,
    OFF: OFF,
    ON: ON
}


