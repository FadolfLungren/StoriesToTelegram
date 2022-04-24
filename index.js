require("dotenv").config()
const express = require("express")

const dbController = require("./database/database_controller")

const sequelize = require("./database/db")
const models = require("./database/models/models")

router = require("./routes/bot.routes")

const PORT = process.env.PORT || 8080
const bot = require("./bot_logic")

const app = express()
app.use(express.json())
app.use("/api",router)

const Start = async ()=>{
	try{
		await sequelize.authenticate()
		await sequelize.sync()
		app.listen(PORT,()=> bot.sendMessage(827988306,`Server Restarted on port: ${PORT}`))
	}catch(e){
		if(e.status===429){
			console.log("429 SETTING TIME OUT")
			setTimeout(async ()=>{
						await sequelize.authenticate()
						await sequelize.sync()
						app.listen(PORT,()=> bot.sendMessage(827988306,`Server Restarted on port: ${PORT}`))
					},10000)
		}
		console.log(e.status)
	}
}
Start()

