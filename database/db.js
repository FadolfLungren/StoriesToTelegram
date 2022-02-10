const {Sequelize} = require("sequelize")

module.exports = new Sequelize(
    //process.env.DB_NAME,
    //process.env.DB_USER,
    //process.env.DB_PASSWORD,
    process.env.DATABASE_URL,
    {
        dialect:"postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // <<<<<<< YOU NEED THIS
            }
        }
        //host:process.env.DB_HOST,
        //port:process.env.DB_PORT
    }

)
