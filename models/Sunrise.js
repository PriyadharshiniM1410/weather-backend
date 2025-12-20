module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Sunrise', {
    sunriseTime: {
      type: DataTypes.STRING,
      allowNull: false
    },
    weatherQueryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  });
};