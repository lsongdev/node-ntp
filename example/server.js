const ntp = require('..');

const server = ntp.createServer(function(message, response){
  console.log('server message:', message);
  message.transmitTimestamp = Date.now();
  response(message);
}).listen(4567, function(err){
  console.log('server is running at %s', server.address().port);
});