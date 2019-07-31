const ntp = require('..');

ntp(function(err, response){
  if(err) return console.error(err);
  console.log('The network time is :', response.time);
});
