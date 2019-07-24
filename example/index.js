const ntp = require('..');

ntp({ 
 server: 'localhost', port: 4567 
}, function(err, response){
  if(err) return console.error(err);
  console.log('The network time is :', response.time);
});
