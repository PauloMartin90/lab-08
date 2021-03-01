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
const MOVIE_API_KEY = process.env.MOVIE_API_KEY
const YELP_API_KEY = process.env.YELP_API_KEY


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
              const sqlArray = [city, location_info.body[0].display_name, location_info.body[0].lat, location_info.body[0].lon];

    client.query(sqlString, sqlArray).then(() => {
         response.redirect('/');
        });
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
  const parkCode = req.query.search_query.split(',')[0];

  const url =  `https://developer.nps.gov/api/v1/parks?q=${parkCode}&api_key=${PARKS_API_KEY}`

  superagent.get(url) 
  .then(parks_info => {
  const output = parks_info.body.data.map(result => new ParkKit(result))
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
  this.fee =  object.entranceFees[0].cost ? object.entranceFees[0].cost: 'No Cost';
  this.address = `${object.addresses[0].line1}, ${object.addresses[0].city}, ${object.addresses[0].stateCode}, ${object.addresses[0].postalCode}` ;
  this.description = object.description;
  this.url = object.url
}

/////////////////// MOVIES INFORMATION ///////////////////
app.get('/movies', handleGetMovies);
function handleGetMovies(req, res) {
  const movieRequest = req.query.search_query;
  const url =  `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${movieRequest}`;

  superagent.get(url) 
      .then(movie_info => {
      const output = movie_info.body.results.map(result => new MovieKit(result))
      // console.log(output)
  res.send(output);

})
.catch(errorThatComesBack => {
  console.log(errorThatComesBack);
  res.status(500).send('Sorry something went wrong');
}); 
}
function MovieKit (object){
    this.title = object.original_title;
    this.overview = object.overview;
    this.average_votes = object.vote_average;
    this.total_votes = object.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${object.poster_path}`; // How do I produce a null image
    this.popularity = object.popularity;
    this.released_on = object.release_date
}

/////////////////// YELP INFORMATION ///////////////////
app.get('/yelp', handleGetYelp);
function handleGetYelp(req, res) {
  const yelpOffset = (req.query.page - 1) * 5;
  const url = `https://api.yelp.com/v3/businesses/search?terms=restaurant&limit=5&latitude=${req.query.latitude}&longitude=${req.query.longitude}&offset=${yelpOffset}`;

  superagent.get(url)
      .set(`authorization`, `bearer ${YELP_API_KEY}`)
      .then(yelp_info => {
      const output = yelp_info.body.businesses.map(result => new YelpKit(result))
      // console.log(output)
  res.send(output);

})
.catch(errorThatComesBack => {
  console.log(errorThatComesBack);
  res.status(500).send('Sorry something went wrong');
}); 
}

function YelpKit (object) {
  this.name = object.name;
  this.image_url = object.image_url;
  this.price = object.price;
  this.rating = object.rating;
  this.url = object.url
}



// ============== Initialization ========================

// I can visit this server at http://localhost:3000
client.connect().then(() => {
  app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
});



