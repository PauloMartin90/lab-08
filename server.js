// ============== Packages ==============================

const express = require('express');
const cors = require('cors'); 
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();


// ============== App ===================================

const app = express();
app.use(cors()); 
const DATABASE_URL = process.env.DATABASE_URL;
const client = new pg.Client(DATABASE_URL);

const PORT = process.env.PORT || 3000;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY
const WEATHER_API_KEY= process.env.WEATHER_API_KEY
const PARKS_API_KEY = process.env.PARKS_API_KEY

client.on('error', error => console.log(error));


// ============== Routes ================================

/////////////////// LOCATION INFORMATION ///////////////////
app.get('/location', handleGetLocation);
function handleGetLocation(req, res){
 
  const sqlCheckingString = 'SELECT * FROM fancykat WHERE search_query=$1';
  const sqlCheckingArray = [req.query.city];
  
  client.query(sqlCheckingString, sqlCheckingArray)
      .then(result => {
        // CHhecking row length
          if (result.rows.length > 0){
            // console.log(result);
            res.send(result.rows[0]);
          } else{
            const city = req.query.city
            const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`;
    
            superagent.get(url) 
              .then(location_info => {
              const output = new LocationKit(location_info.body, city)
              res.send(output);
              const sqlString = 'INSERT INTO fancykat (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)';
              const sqlArray = [city, location_info.body[0].location_info, location_info.body[0].lat, location_info.body[0].lon];

    client.query(sqlString, sqlArray);
})
.catch(errorThatComesBack => {
  console.log(errorThatComesBack);
  res.status(500).send('Sorry something went wrong');
})
}
})
}

    
function LocationKit(dataFromTheFile, cityName){
  this.search_query = cityName;
  this.formatted_query = dataFromTheFile[0].display_name;
  this.latitude = dataFromTheFile[0].lat;
  this.longitude = dataFromTheFile[0].lon;
}

/////////////////// WEATHER INFORMATION ///////////////////
app.get('/weather', handleGetWeather);
function handleGetWeather(req, res) {
  const weather = req.query.search_query
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${weather}&key=${WEATHER_API_KEY}`; 

  superagent.get(url).then(weather_info => {
  const output = weather_info.body.data.map(result => new WeatherKit(result))
  // console.log(output)
  res.send(output);
})
.catch(errorThatComesBack => {
  console.log(errorThatComesBack);
  res.status(500).send('Sorry something went wrong');
}); 
}


function WeatherKit(object) {
  this.forecast =  object.weather.description;
  this.time = object.valid_date;
}


/////////////////// PARKS INFORMATION ///////////////////
app.get('/parks', handleGetParks);
function handleGetParks(req, res) {
  const parkCode = req.query.search_query;
  console.log("🚀 ~ file: server.js ~ line 97 ~ handleGetParks ~ req.query", req.query)
  
  // const url =  `https://developer.nps.gov/api/v1/parks?limit=3&start=0&q=${parkCode}&sort=&api_key=${PARKS_API_KEY}`; // Change token Key
  const url =  `https://developer.nps.gov/api/v1/parks?q=${parkCode}&api_key=${PARKS_API_KEY}`

  superagent.get(url) 
  .then(parks_info => {
  const output = parks_info.body.data.map(result => new ParkKit(result))
  console.log(output)
  res.send(output);

})
.catch(errorThatComesBack => {
  console.log(errorThatComesBack);
  res.status(500).send('Sorry something went wrong');
}); 
}
function ParkKit (object){
  this.name = object.fullName;
  this.fee =  object.entranceFees[0].cost ? object.entranceFees[0].cost: 'No Cost';
  this.address = `${object.addresses[0].line1}, ${object.addresses[0].city}, ${object.addresses[0].stateCode}, ${object.addresses[0].postalCode}` ;
  this.description = object.description;
  this.url = object.url
}

// function ParkKit (object){
//   this.name = 'asdf;
//   this.fee =  asdf;
//   this.address = asdf;
//   this.description = asdf;
//   this.url = asdf
// }


// ============== Initialization ========================

// I can visit this server at http://localhost:3000
client.connect().then(() => {
  app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
});



