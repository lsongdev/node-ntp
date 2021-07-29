const ntp = require('..');

const server = ntp.createServer(function(message, response){
  console.log('server message:', message);
  // By default the current time will be send. Uncomment for custom time
  // message.writeMsecs(message.transmitTimestamp, (new Date('December 17, 1995 03:24:00')).getTime());
  response(message);
}).listen(4567, function(err){
  console.log('server is running at %s', server.address().port);
});