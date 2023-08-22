'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING
      },
      middleName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      mobileNo: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      avatar: {
        type: Sequelize.STRING
      },
      designation: {
        type: Sequelize.STRING
      },
      employeeCode: {
        type: Sequelize.INTEGER
      },
      resetPasswordToken: {
        type: Sequelize.STRING
      },
      wrongAttempt: {
        type: Sequelize.INTEGER,
        defaultValue : 0
      },
      userRoleId: {
        type: Sequelize.INTEGER,
        reference : {
          model : 'userrole',
          key : 'id'
        }
      },
      agentId: {
        type: Sequelize.INTEGER,
        reference : {
          model : 'user',
          key : 'id'
        }
      },
      addedBy: {
        type: Sequelize.INTEGER,
        reference : {
          model : 'user',
          key : 'id'
        }
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue : true
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue : false
      },
      expireToken: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};