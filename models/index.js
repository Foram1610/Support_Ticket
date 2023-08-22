'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.UserRole = require('../models/userrole')(sequelize, Sequelize)
db.User = require('../models/user')(sequelize, Sequelize)
db.TicketType = require('../models/tickettype')(sequelize, Sequelize)
db.Ticket = require('../models/ticket')(sequelize, Sequelize)
db.TicketStatusChange = require('../models/ticketstatuschange')(sequelize, Sequelize)
db.Feedback = require('../models/feedback')(sequelize, Sequelize)
db.Activities = require('../models/activities')(sequelize, Sequelize)

db.UserRole.hasMany(db.User, {
  foreignKey: 'userRoleId',
  onDelete: "cascade",
})
db.User.belongsTo(db.UserRole, {
  foreignKey: 'userRoleId',
  as: 'roletype',
  onDelete: "cascade",
})

db.User.hasMany(db.User, {
  foreignKey: 'addedBy',
  onDelete: "cascade",
})
db.User.hasMany(db.User, {
  foreignKey: 'agentId',
  onDelete: "cascade",
})
db.User.belongsTo(db.User, {
  foreignKey: 'addedBy',
  as: 'added',
  onDelete: "cascade",
})
db.User.belongsTo(db.User, {
  foreignKey: 'agentId',
  as: 'agent',
  onDelete: "cascade",
})

db.User.hasMany(db.Ticket, {
  foreignKey: 'userId',
  onDelete: "cascade",
})
db.User.hasMany(db.Ticket, {
  foreignKey: 'moderatorId',
  onDelete: "cascade",
})
db.User.hasMany(db.Ticket, {
  foreignKey: 'agentId',
  onDelete: "cascade"
})
db.User.hasMany(db.Ticket, {
  foreignKey: 'assignBy',
  onDelete: "cascade",
})
db.Ticket.belongsTo(db.User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: "cascade"
})
db.Ticket.belongsTo(db.User, {
  foreignKey: 'moderatorId',
  as: 'moderator',
  onDelete: "cascade"
})
db.Ticket.belongsTo(db.User, {
  foreignKey: 'agentId',
  as: 'agent',
  onDelete: "cascade"
})
db.Ticket.belongsTo(db.User, {
  foreignKey: 'assignBy',
  as: 'assign',
  onDelete: "cascade"
})

db.User.hasMany(db.TicketType, {
  foreignKey: 'addedBy',
  onDelete: "cascade",
})
db.TicketType.belongsTo(db.User, {
  foreignKey: 'addedBy',
  as: 'admin',
  onDelete: "cascade",
})

db.TicketType.hasMany(db.Ticket, {
  foreignKey: 'ticketTypeId',
  onDelete: "cascade",
})
db.Ticket.belongsTo(db.TicketType, {
  foreignKey: 'ticketTypeId',
  as: 'type',
  onDelete: "cascade",
})

db.Ticket.hasMany(db.TicketStatusChange, {
  foreignKey: 'ticketId',
  onDelete: "cascade"
})
db.TicketStatusChange.belongsTo(db.Ticket, {
  foreignKey: 'ticketId',
  as: 'status',
  onDelete: "cascade"
})

db.Ticket.hasMany(db.Feedback, {
  foreignKey: 'ticketId',
  onDelete: "cascade",
})
db.User.hasMany(db.Feedback, {
  foreignKey: 'agentId',
  onDelete: "cascade",
})
db.Feedback.belongsTo(db.Ticket, {
  foreignKey: 'ticketId',
  as: 'ticket',
  onDelete: "cascade",
})
db.Feedback.belongsTo(db.User, {
  foreignKey: 'agentId',
  as: 'agent',
  onDelete: "cascade",
})

db.Ticket.hasMany(db.Activities, {
  foreignKey: 'ticketId',
  onDelete: "cascade",
})
db.Activities.belongsTo(db.Ticket, {
  foreignKey: 'ticketId',
  as: 'ticket',
  onDelete: "cascade",
})

module.exports = db;
