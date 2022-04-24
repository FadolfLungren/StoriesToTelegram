const sequelize = require("../db")
const {DataTypes} = require("sequelize")

const person = sequelize.define('person',{
    id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name:{type: DataTypes.STRING, unique:true},
    telegram_chat_id:{type: DataTypes.STRING, unique:true},
    monitor_limit:{type:DataTypes.INTEGER, defaultValue:3},
    monitoring_now:{type:DataTypes.INTEGER,defaultValue: 0},
    language_code:{type:DataTypes.STRING}
}
)
const session = sequelize.define('session',{
    id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    account_name:{type: DataTypes.STRING},
    last_monitored_post:{type: DataTypes.STRING},
    status:{type:DataTypes.BOOLEAN},
    frequency:{type:DataTypes.INTEGER}
    }
)
const things_to_monitor = sequelize.define('things_to_monitor',{
        monitor_stories:{type: DataTypes.BOOLEAN},
        monitor_posts:{type: DataTypes.BOOLEAN}
    }
)

const cookie = sequelize.define('cookie',{
        id:{type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        session_id:{type: DataTypes.STRING},
        is_valid:{type: DataTypes.BOOLEAN}
    }
)

person.hasMany(session)
session.belongsTo(person)

session.hasOne(things_to_monitor)
things_to_monitor.belongsTo(session)

module.exports = {
    person,
    session,
    things_to_monitor,
    cookie
}