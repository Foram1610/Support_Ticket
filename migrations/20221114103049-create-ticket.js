'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tickets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        reference: {
          model: 'user',
          key: 'id'
        }
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      ticketTypeId: {
        type: Sequelize.INTEGER,
        reference: {
          model: 'tickettype',
          key: 'id'
        }
      },
      documents: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      moderatorId: {
        type: Sequelize.INTEGER,
        reference: {
          model: 'user',
          key: 'id'
        }
      },
      assignBy: {
        type: Sequelize.INTEGER,
        reference: {
          model: 'user',
          key: 'id'
        }
      },
      agentId: {
        type: Sequelize.INTEGER,
        reference: {
          model: 'user',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'unassigned'
      },
      feedbackStatus :{
        type: Sequelize.STRING,
        defaultValue: 'unset'
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.dropTable('Tickets');
  }
};