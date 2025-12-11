const express = require('express');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();


// 1. CONNECT TO POSTGRESQL DATABASE
const sequelize = new Sequelize('weatherdb', 'postgres', '1234', {
  host: 'localhost',
  dialect: 'postgres'
});

// Import the model
const WeatherQuery = require('./models/WeatherQuery')(sequelize, DataTypes);

// Sync model with DB (creates table if not exists)
sequelize.sync()
  .then(() => console.log("✅ Database synced"))
  .catch(err => console.log("❌ Error:", err));


// 2. ROUTE: FETCH WEATHER + STORE IN DATABASE
app.get('/weather', async (req, res) => {
  try {
    const city = req.query.city.trim();


    // Validate
    if (!city) {
      return res.status(400).json({ message: "City is required" });
    }

    const API_KEY = "c4092ca26b5f97298c5a13bd9fa3dfe2";

    // Fetch weather from OpenWeather API
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );

    const temperature = response.data.main.temp;

    // Store into DB using ORM
    await WeatherQuery.create({
      city: city,
      temperature: temperature,
      queriedAt: new Date()
    });

    // Respond to client
    return res.json({
      city,
      temperature
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});



// 3. ROUTE: GET ALL STORED WEATHER HISTORY
app.get('/history', async (req, res) => {
  try {
    const history = await WeatherQuery.findAll({
      order: [['queriedAt', 'DESC']]
    });

    // Clean city names before sending
    const cleanHistory = history.map(item => ({
      id: item.id,
      city: item.city.trim(),       
      temperature: item.temperature,
      queriedAt: item.queriedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    return res.json(cleanHistory);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});



// 4. START SERVER
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
