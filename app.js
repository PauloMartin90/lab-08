//================ Routes =======================

app.get('/location', handleGetLocation);
app.get('/weather', handleGetWeather);
app.get('/parks', handleGetParks);

function handleGetLocation(req, res){
  const sqlCheckingString = 'SELECT * FROM cities WHERE search_query=$1';
  const sqlCheckingArray = [req.query.city];
  client.query(sqlCheckingString, sqlCheckingArray)
    .then(result => {
      if (result.rows.length > 0){
        console.log(result);
        res.send(result.rows[0]);
      }else {
        const city = req.query.city;
        const url = `https://us1.locationiq.com/v1/search.php?key=${LOCATION_API_KEY}&q=${city}&format=json`;

        superagent.get(url).then(stuffThatComesBack => {
          const output = new Location(stuffThatComesBack.body, city);
          res.send(output);
          const sqlString = 'INSERT INTO cities (search_query, formatted_query, latitude, longitude) VALUES($1, $2, $3, $4)';


          const sqlArray = [city, stuffThatComesBack.body[0].display_name, stuffThatComesBack.body[0].lat, stuffThatComesBack.body[0].lon];
          client.query(sqlString, sqlArray);
        }).catch(errorThatComesBack => {
          console.log(errorThatComesBack);
          res.status(500).send('something went wrong');
        });
      }
    });
}

function Location(dataFromTheFile, cityName){
  this.search_query = cityName;
  this.formatted_query = dataFromTheFile[0].display_name;
  this.latitude = dataFromTheFile[0].lat;
  this.longitude = dataFromTheFile[0].lon;
}

function handleGetWeather(req, res){
  const cityName = req.query.search_query;
  const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${WEATHER_API_KEY}`;

  
  superagent.get(url).then(stuffThatComesBack => {
    const output = stuffThatComesBack.body.data.map(day => new Weather(day));
    res.send(output);
  }).catch(errorThatComesBack => {
    res.status(500).send(errorThatComesBack);
  });
}

function Weather(data){
  this.forecast = data.weather.description;
  this.time = data.datetime;
}

function handleGetParks(req, res){
  const parkCode = req.query.formatted_query;
  const url = `https://developer.nps.gov/api/v1/parks?limit=2&start=0&q=${parkCode}&sort=&api_key=${PARKS_API_KEY}`;
  superagent.get(url).then(stuffThatComesBack => {
    const output = stuffThatComesBack.body.data.map(park => new Parks(park));
    res.send(output);
  }).catch(errorThatComesBack => {
    res.status(500).send(errorThatComesBack);
  });
}
function Parks(data){
  this.name = data.fullName;
  this.address = data.addresses[0].line1;
  this.fee = data.fees.cost;
  this.description = data.description;
  this.url = data.url;
}
//=================== Initialization =================
client.connect().then(() => {
  app.listen(PORT, () => console.log(`app is up on port http://localhost:${PORT}`));
});