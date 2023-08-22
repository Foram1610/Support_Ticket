'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Activities extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Activities.init({
    ticketId: DataTypes.INTEGER,
    activityName: DataTypes.STRING,
    oldStatus: DataTypes.STRING,
    newStatus: DataTypes.STRING,
    comment: DataTypes.TEXT,
    documents: DataTypes.ARRAY(DataTypes.STRING),
  }, {
    sequelize,
    modelName: 'Activities',
  });
  return Activities;
};