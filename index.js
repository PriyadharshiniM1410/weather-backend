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



// 2. ROUTE: FETCH WEATHER + STORE CITY, TEMP, UNIT
app.get('/weather', async (req, res) => {
  try {
    const city = req.query.city?.trim();
    const unit = req.query.unit?.toLowerCase();

    if (!city || !unit) {
      return res.status(400).json({
        message: "city and unit are required"
      });
    }

    if (unit !== "celsius" && unit !== "fahrenheit") {
      return res.status(400).json({
        message: "unit must be celsius or fahrenheit"
      });
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

    return res.json({
      city,
      temperature,
      unit
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});



// 3. ROUTE: GET ALL STORED HISTORY (WITH UNIT)
app.get('/history', async (req, res) => {
  try {
    const history = await WeatherQuery.findAll({
      order: [['queriedAt', 'DESC']]
    });

    return res.json(history);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});



// 4. START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
