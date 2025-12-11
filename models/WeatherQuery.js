// Model: WeatherQuery
// Stores city, temperature, and timestamp of each query

module.exports = (sequelize, DataTypes) => {
  const WeatherQuery = sequelize.define("WeatherQuery", {
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    queriedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    }
  });

  return WeatherQuery;
};
