/**
 * Created by SorosLiu on 16/12/1.
 */
'use strict';
function sendIntervalCmd(cmdArray, interval) {
    if (cmdArray.length !== 0) {
        setTimeout(function () {
            var cmd = cmdArray.shift();
            cmd();
            sendIntervalCmd(cmdArray, interval);
        }, interval);
    }
}

module.exports.sendIntervalCmd = sendIntervalCmd;