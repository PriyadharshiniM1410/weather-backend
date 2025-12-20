module.exports = (sequelize, DataTypes) => {
  return sequelize.define('WeatherQuery', {
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false
    },
    queriedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  });
};
