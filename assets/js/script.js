const key = '2d98e801101e2bb5515cb0f5b5aa471a';
const weatherEmojis = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '💧',
  Snow: '❄️'
};

function getCityID(cityName) {
  const geocodingUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${key}`;

  return fetch(geocodingUrl)
    .then(function(resp) {
      return resp.json();
    })
    .then(function(data) {
      return data.id;
    })
    .catch(function(error) {
      console.log('Error getting city ID:', error);
    });
}

function getWeather(cityName) {
  getCityID(cityName)
    .then(function(cityID) {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?id=${cityID}&appid=${key}`;

      fetch(weatherUrl)
        .then(function(resp) {
          return resp.json();
        })
        .then(function(data) {
          console.log(data);
          drawWeather(data);
        })
        .catch(function(error) {
          console.log('Error fetching weather data:', error);
        });
    });
}

function getForecast(cityName) {
  getCityID(cityName)
    .then(function(cityID2) {
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?id=${cityID2}&appid=${key}`;

      fetch(forecastUrl)
        .then(function(resp) {
          return resp.json();
        })
        .then(function(data) {
          console.log(data);
          drawForecast(data);
        })
        .catch(function(error) {
          console.log('Error fetching weather forecast data:', error);
        });
    });
}

function drawWeather(weatherdata) {
  const fahrenheit = Math.round(((parseFloat(weatherdata.main.temp) - 273.15) * 1.8) + 32);
  const wind = weatherdata.wind.speed;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const weatherEmoji = weatherEmojis[weatherdata.weather[0].main] || '';
  const humidity = weatherdata.main.humidity;

  document.getElementById('temp').innerHTML = 'Temperature: ' + fahrenheit + '&deg; F';
  document.getElementById('city-search-term').innerHTML = `${weatherdata.name} - ${currentDate} ${weatherEmoji}`;
  document.getElementById('wind').innerHTML = `Wind: ${wind} mph`;
  document.getElementById('humid').innerHTML = `Humidity: ${humidity} %`;
}

function drawForecast(forecastData) {
  const forecastContainer = document.getElementById('forecast-container');
  forecastContainer.innerHTML = '';

  const uniqueDates = [];
  const uniqueForecast = [];
  for (const forecast of forecastData.list) {
    const date = new Date(forecast.dt * 1000);
    const dateString = date.toDateString();
    if (!uniqueDates.includes(dateString)) {
      uniqueDates.push(dateString);
      uniqueForecast.push(forecast);
    }
    if (uniqueDates.length === 5) break; 
  }

  for (const forecast of uniqueForecast) {
    const date = new Date(forecast.dt * 1000);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const weatherEmoji = weatherEmojis[forecast.weather[0].main] || '';
    const temperature = Math.round(((parseFloat(forecast.main.temp) - 273.15) * 1.8) + 32);
    const wind = forecast.wind.speed;
    const humidity = forecast.main.humidity;

    const forecastItem = document.createElement('div');
    forecastItem.classList.add('forecast-item');
    forecastItem.innerHTML = `
      <div class="forecast-date">${dayOfWeek}</div>
      <div class="forecast-weather">${weatherEmoji}</div>
      <div class="forecast-temp">${temperature}&deg; F</div>
      <div class="forecast-wind">Wind: ${wind} mph</div>
      <div class="forecast-humidity">Humidity: ${humidity} %</div>
    `;

    forecastContainer.appendChild(forecastItem);
  }
}

function saveCityToLocalStorage(cityName, weatherData, forecastData) {
  let savedCities = JSON.parse(localStorage.getItem('savedCities')) || [];
  if (!savedCities.includes(cityName)) {
    savedCities.push(cityName);
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
    localStorage.setItem(cityName, JSON.stringify({ weather: weatherData, forecast: forecastData }));
    displaySavedCities();
  }
}

function displaySavedCities() {
  const savedCitiesContainer = document.getElementById('saved-cities');
  savedCitiesContainer.innerHTML = ''; // Clear previous cities

  const savedCities = JSON.parse(localStorage.getItem('savedCities')) || [];
  savedCities.forEach(city => {
    const cityElement = document.createElement('div');
    cityElement.textContent = city;
    cityElement.classList.add('saved-city');
    cityElement.addEventListener('click', () => {
      const cityData = JSON.parse(localStorage.getItem(city));
      if (cityData) {
        drawWeather(cityData.weather);
        drawForecast(cityData.forecast);
      } else {
        getWeatherAndForecast(city);
      }
    });
    savedCitiesContainer.appendChild(cityElement);
  });
}
displaySavedCities();

document.getElementById('search-btn').addEventListener('click', function() {
  const cityName = document.getElementById('city').value; 
  getWeatherAndForecast(cityName);
});

document.getElementById('city').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('search-btn').click();
  }
});

function getWeatherAndForecast(cityName) {
  getCityID(cityName)
    .then(function(cityID) {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?id=${cityID}&appid=${key}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?id=${cityID}&appid=${key}`;

      Promise.all([fetch(weatherUrl), fetch(forecastUrl)])
        .then(function(responses) {
          return Promise.all(responses.map(function(response) {
            return response.json();
          }));
        })
        .then(function(data) {
          const weatherData = data[0];
          const forecastData = data[1];
          saveCityToLocalStorage(cityName, weatherData, forecastData);
          drawWeather(weatherData);
          drawForecast(forecastData);
        })
        .catch(function(error) {
          console.log('Error fetching weather and forecast data:', error);
        });
    });
}