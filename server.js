const express = require('express');
const request = require('request');
const redis = require('redis');


const app = express();
let index = 0;

const port_redis = process.env.PORT || 6379;

//configuring the redis client on port 6379
const redis_client = redis.createClient({
  port: port_redis,
  host: "localhost",
});

redis_client.on("connect", () => {
  console.log("Successfully connected to redis");
});


app.use(express.json());

function getClient (key){
  return new Promise((resolve, reject) => {

    redis_client.get(key, (err, val) => {
     if (err) {
      reject(err)
      return
     }
     if (val == null) {
      resolve(null)
      return
     }
  
     try {
      resolve(
       JSON.parse(val)
      )
     } catch (ex) {
      resolve(val)
     }
    })
   })
}

function getPrice (){
    request({
        url: 'https://api.coindesk.com/v1/bpi/currentprice.json',
        json: true
      }, async function (error, response, body) {
          if (!error && response.statusCode === 200) {
            console.log('check #', index);
            console.log(body.bpi.USD.rate); // Print the json response
            if(index == 0)
              redis_client.setex('bitcoinPriceUSD', 11000, body.bpi.USD.rate);
            else {
              var prev_val = await getClient('bitcoinPriceUSD');

              console.log('prev', prev_val);
              console.log('now', body.bpi.USD.rate);

              if(body.bpi.USD.rate > prev_val)
                console.log('price Up');
              else if(body.bpi.USD.rate < prev_val)
                console.log('price down');
              else
                console.log('price same');
              redis_client.setex('bitcoinPriceUSD', 11000, body.bpi.USD.rate);
            }
            index++;
        }
      })
}

setInterval(async() => {
    getPrice();

;}, 10000);

app.listen(8080, () => console.log('listening on port 8080'))
