'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcryptjs')
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    firstName: DataTypes.STRING,
    middleName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    mobileNo: DataTypes.STRING,
    password: DataTypes.STRING,
    avatar: DataTypes.STRING,
    designation: DataTypes.STRING,
    employeeCode: DataTypes.INTEGER,
    resetPasswordToken: DataTypes.STRING,
    wrongAttempt: DataTypes.INTEGER,
    userRoleId: DataTypes.INTEGER,
    agentId : DataTypes.INTEGER,
    addedBy: DataTypes.INTEGER,
    expireToken: DataTypes.DATE,
    isActive: DataTypes.BOOLEAN,
    isDeleted: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: (user) => {
        {
          user.password = user.password && user.password != "" ? bcrypt.hashSync(user.password, 10) : "";
        }
      }
    }
  });

  return User;
};