const express = require('express');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

// DATABASE 
const sequelize = new Sequelize('weatherdb', 'postgres', '1234', {
  host: 'localhost',
  dialect: 'postgres'
});

// Test DB connection
sequelize.authenticate()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// MODELS 
const WeatherQuery = sequelize.define('WeatherQuery', {
  city: { type: DataTypes.STRING, allowNull: false },
  temperature: { type: DataTypes.FLOAT, allowNull: false },
  unit: { type: DataTypes.STRING, allowNull: false },
  queriedAt: { type: DataTypes.DATE, allowNull: false }
});

const Sunrise = sequelize.define('Sunrise', {
  sunriseTime: { type: DataTypes.STRING, allowNull: false },
  weatherQueryId: { type: DataTypes.INTEGER, allowNull: false }
});

// Relations
WeatherQuery.hasOne(Sunrise, { foreignKey: 'weatherQueryId' });
Sunrise.belongsTo(WeatherQuery, { foreignKey: 'weatherQueryId' });

// Sync DB
sequelize.sync()
  .then(() => console.log('✅ Tables synced'))
  .catch(err => console.error(err));

//  HELPER 
function temperatureColor(temp, unit) {
  let t = temp;
  if(unit === 'fahrenheit') t = (temp - 32) * 5/9; // convert to Celsius
  if(t <= 15) return '#3498db';       // blue = cold
  if(t <= 25) return '#f39c12';       // orange = mild
  return '#e74c3c';                    // red = hot
}

// WEATHER ROUTE 
app.get('/weather', async (req, res) => {
  const city = req.query.city || '';
  const unit = req.query.unit || '';
  let weatherHTML = '';

  if (city && unit) {
    try {
      const apiUnit = unit.toLowerCase() === 'fahrenheit' ? 'imperial' : 'metric';
      const API_KEY = 'c4092ca26b5f97298c5a13bd9fa3dfe2'; 

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${apiUnit}`
      );

      const temperature = response.data.main.temp;
      const sunriseTime = new Date(response.data.sys.sunrise * 1000).toLocaleTimeString();

      // Save to DB
      const weather = await WeatherQuery.create({
        city, temperature, unit, queriedAt: new Date()
      });

      await Sunrise.create({
        sunriseTime,
        weatherQueryId: weather.id
      });

      // Weather Card HTML
      weatherHTML = `
        <div class="card">
          <h2>${city}</h2>
          <div class="weather-info">
            <p>Temperature: 
              <strong style="color:${temperatureColor(temperature, unit)};">
                ${temperature} °${unit === 'celsius' ? 'C' : 'F'}
              </strong>
            </p>
            <p>Sunrise: <span class="sun-icon">🌅</span> <strong>${sunriseTime}</strong></p>
          </div>
          <a href="/full-history">View Full History</a>
        </div>
      `;
    } catch (err) {
      weatherHTML = `<p style="color:red;">${err.response?.data?.message || err.message}</p>`;
    }
  }

  // Input form + card
  res.send(`
    <html>
    <head>
      <title>Weather App</title>
      <style>
        body { font-family: Arial; background: linear-gradient(to right,#e0f7fa,#80deea); margin:0; padding:0; }
        header { background:#00796b; color:white; padding:20px; text-align:center; font-size:24px; }
        main { display:flex; flex-direction:column; align-items:center; margin:30px 20px; }
        form { background:#ffffffaa; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1);
               display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-bottom:30px; }
        input, select, button { padding:10px; border-radius:6px; border:1px solid #ccc; font-size:16px; }
        button { background:#00796b; color:white; border:none; cursor:pointer; }
        button:hover { background:#004d40; }
        .card { background: linear-gradient(135deg, #ffffff, #a2ded0); padding:25px 35px; border-radius:16px;
                box-shadow:0 6px 20px rgba(0,0,0,0.2); text-align:center; width:320px; margin-bottom:20px;
                transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-5px); box-shadow:0 12px 25px rgba(0,0,0,0.3); }
        .card h2 { margin-bottom:15px; color:#00796b; font-size:26px; }
        .weather-info p { font-size:18px; margin:8px 0; }
        .sun-icon { font-size:22px; }
        a { text-decoration:none; background:#00796b; color:white; padding:10px 22px; border-radius:10px; display:inline-block; margin-top:15px; }
        a:hover { background:#004d40; }
      </style>
    </head>
    <body>
      <header>Weather Dashboard</header>
      <main>
        <form action="/weather" method="get">
          <input type="text" name="city" value="${city}" placeholder="City" required>
          <select name="unit" required>
            <option value="celsius" ${unit==='celsius'?'selected':''}>Celsius</option>
            <option value="fahrenheit" ${unit==='fahrenheit'?'selected':''}>Fahrenheit</option>
          </select>
          <button type="submit">Check Weather</button>
        </form>
        ${weatherHTML}
      </main>
    </body>
    </html>
  `);
});

// FULL HISTORY
app.get('/full-history', async (req, res) => {
  try {
    const data = await WeatherQuery.findAll({ include: Sunrise, order: [['queriedAt', 'DESC']] });

    let html = `
      <html>
      <head>
        <title>Weather History</title>
        <style>
          body { font-family: Arial; background: linear-gradient(to right,#f1f8e9,#dcedc8); margin:0; padding:0; }
          header { background:#689f38; color:white; padding:20px; text-align:center; font-size:24px; }
          main { margin:30px 20px; display:flex; flex-direction:column; align-items:center; }
          table { border-collapse:collapse; width:90%; max-width:900px; background:white; border-radius:12px;
                  overflow:hidden; box-shadow:0 3px 15px rgba(0,0,0,0.1); }
          th, td { padding:12px; text-align:center; border-bottom:1px solid #ddd; }
          th { background:#689f38; color:white; }
          tr:nth-child(even) { background:#f9fbe7; }
          tr:hover { background:#dcedc8; }
          a { text-decoration:none; background:#689f38; color:white; padding:10px 20px; border-radius:8px;
              margin-top:20px; display:inline-block; }
          a:hover { background:#33691e; }
        </style>
      </head>
      <body>
        <header>Weather History Dashboard</header>
        <main>
          <table>
            <tr>
              <th>City</th>
              <th>Temperature</th>
              <th>Unit</th>
              <th>Sunrise</th>
              <th>Queried At</th>
            </tr>
    `;

    data.forEach(item => {
      html += `
        <tr>
          <td>${item.city}</td>
          <td>${item.temperature}</td>
          <td>${item.unit}</td>
          <td>${item.Sunrise ? item.Sunrise.sunriseTime : 'N/A'} 🌅</td>
          <td>${new Date(item.queriedAt).toLocaleString()}</td>
        </tr>
      `;
    });

    html += `
          </table>
          <a href="/weather">Back to Weather</a>
        </main>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    res.send(`<p style="color:red;">${err.message}</p>`);
  }
});

//  SERVER 
app.listen(5000, () => console.log('🚀 Server running on port 5000'));
