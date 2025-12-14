const express = require('express');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();


// 1. CONNECT TO POSTGRESQL DATABASE
const sequelize = new Sequelize('weatherdb', 'postgres', '1234', {
  host: 'localhost',
  dialect: 'postgres'
});

// Import model
const WeatherQuery = require('./models/WeatherQuery')(sequelize, DataTypes);

// Sync DB
sequelize.sync()
  .then(() => console.log("✅ Database synced"))
  .catch(err => console.log("❌ Error:", err));


// 2. ROUTE: FETCH WEATHER + STORE CITY, TEMP, UNIT (HTML)
app.get('/weather', async (req, res) => {
  try {
    const city = req.query.city?.trim();
    const unit = req.query.unit?.toLowerCase();

    if (!city || !unit) {
      return res.send(`<p style="color:red;">Error: city and unit are required</p>`);
    }

    if (unit !== "celsius" && unit !== "fahrenheit") {
      return res.send(`<p style="color:red;">Error: unit must be celsius or fahrenheit</p>`);
    }

    const API_KEY = "c4092ca26b5f97298c5a13bd9fa3dfe2";
    const apiUnit = unit === "fahrenheit" ? "imperial" : "metric";

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${apiUnit}`
    );

    const temperature = response.data.main.temp;

    // ✅ STORE unit also
    await WeatherQuery.create({
      city,
      temperature,
      unit,
      queriedAt: new Date()
    });

    // Return HTML table
    const html = `
      <h1>Weather Result</h1>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>City</th>
          <th>Temperature</th>
          <th>Unit</th>
        </tr>
        <tr>
          <td>${city}</td>
          <td>${temperature}</td>
          <td>${unit}</td>
        </tr>
      </table>
      <p><a href="/history">View Full History</a></p>
    `;

    res.send(html);

  } catch (error) {
    return res.send(`<p style="color:red;">Error: ${error.message}</p>`);
  }
});


// 3. ROUTE: GET ALL STORED HISTORY AS HTML TABLE
app.get('/history', async (req, res) => {
  try {
    const history = await WeatherQuery.findAll({
      order: [['queriedAt', 'DESC']]
    });

    let html = `
      <h1>Weather Query History</h1>
      <table border="1" cellpadding="5" cellspacing="0">
        <tr>
          <th>City</th>
          <th>Temperature</th>
          <th>Unit</th>
          <th>Queried At</th>
        </tr>
    `;

    history.forEach(item => {
      html += `
        <tr>
          <td>${item.city}</td>
          <td>${item.temperature}</td>
          <td>${item.unit}</td>
          <td>${new Date(item.queriedAt).toLocaleString()}</td>
        </tr>
      `;
    });

    html += `</table>`;
    html += `<p><a href="/weather?city=Chennai&unit=celsius">Check Weather Again</a></p>`;
    res.send(html);

  } catch (error) {
    return res.send(`<p style="color:red;">Error: ${error.message}</p>`);
  }
});

// 4. START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
