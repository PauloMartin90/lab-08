/*
PORT=3000
GEOCODE_API_KEY=pk.d237f2a8cd6e5ca3c0d7f574446126a9	
PARKS_API_KEY=u0hZ0TLxXnJ1WnBIXc4pBZrrrZ5tAAbtfaZMJn8m
WEATHER_API_KEY=b32e3a84655e4803a541ef750d4ff318
DATABASE_URL=post

*/




// ============== Packages ==============================

const express = require('express');
const cors = require('cors'); // just kinda works and we need it
// If this line of code comes, delete it const { response } = require('express');
const superagent = require('superagent');
require('dotenv').config(); // read the `.env` file's saved env variables AFTER reading the terminal's real env's variables


// ============== App ===================================

const app = express(); // express() will return a fully ready to run server object
app.use(cors()); // enables local processes to talk to the server // Cross Origin Resource Sharing

const PORT = process.env.PORT || 3000; // process.env is boilerplace the variable name is potato
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY
const WEATHER_API_KEY= process.env.WEATHER_API_KEY
const PARKS_API_KEY = process.env.PARKS_API_KEY




// ============== Routes ================================

/////////////////// LOCATION INFORMATION ///////////////////
app.get('/location', handleGetLocation);
function handleGetLocation(req, res){
  const city = req.query.city
  const url = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json`; // Change token Key

  superagent.get(url) 
    .then(loaction_api_information => {
    const output = new LocationKit(loaction_api_information.body, city)
    // console.log(output)
    res.send(output);  
    
})
.catch(errorThatComesBack => {
  console.log(errorThatComesBack);
  res.status(500).send('Sorry something went wrong');
}); 
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
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${weather}&key=${WEATHER_API_KEY}`; // Change token Key

  superagent.get(url) 
  .then(weather_api_information => {
  const output = weather_api_information.body.data.map(weather_info => new WeatherKit(weather_info))
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
  const parkCode = req.query.formatted_query;
  const url = `https://developer.nps.gov/api/v1/parks?q=${parkCode}&api_key=${PARKS_API_KEY}`; // Change token Key

  superagent.get(url) 
  .then(result => {
  const output = result.body.data.map(parkInfo =>  new ParkKit(parkInfo))
  // console.log(output)
  res.send(output);

})
.catch(errorThatComesBack => {
  console.log(errorThatComesBack);
  res.status(500).send('Sorry something went wrong');
}); 
}
function ParkKit (object){
  this.name = object.fullName;
  this.address = `${object.addresses[0].line1}, ${object.addresses[0].city}, ${object.addresses[0].stateCode}, ${object.addresses[0].postalCode}`;
  this.fee = object.entranceFees[0].cost;
  this.description = object.description;
  this.url = object.url;
}



// ============== Initialization ========================

// I can visit this server at http://localhost:3009
app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`)); // this is what starts the server


