const assert = require('assert');
const Packet = require('../packet');

const request = new Packet();

request.leapIndicator = 1;
request.mode = Packet.MODES.SERVER;

const message = request.toBuffer();
assert.equal(message[0] & 0x7, request.mode);
assert.equal(message[0] >> 6, request.leapIndicator);
assert.equal(((message[0] & 0x38) >> 3), request.version);
