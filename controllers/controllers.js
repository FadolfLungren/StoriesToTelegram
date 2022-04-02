bot = require("../bot_logic")
dbController = require("../database/database_controller")
class UserController{

    async parseBotReq(req,res){
        console.log(req.body)
        bot.processUpdate(req.body)
        res.json("200")
    }

    async parseCornReq(req,res){
        await bot.sendMessage(827988306,"Corn UPDATED")
        res.json("200")
    }

    async parseAdminReq(req,res){
        await dbController.addCookie(req.body)
        await bot.sendMessage(827988306,"Cookie updated")
        res.json("200")
    }

}

module.exports = new UserController()