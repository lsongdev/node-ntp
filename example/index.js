const ntp = require('..');

// ntp(function(err, response){
//   if(err) return console.error(err);
//   console.log('The network time is :', new Date(response.toMsecs(response.transmitTimestamp)));
// });


(async () => {
  const n = ntp();
  const message = await n.time();
  console.log(new Date(message.toMsecs(message.transmitTimestamp)));
})();