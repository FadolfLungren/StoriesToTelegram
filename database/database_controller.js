const sequelize = require("./db")
const {person} = require("./models/models")
const {stringify} = require("nodemon/lib/utils");


class PersonController{

    async createUser(msg,bot){
        const {username,id,language_code} = msg.from
        if (!username || !id || !language_code){
            await bot.sendMessage(msg.chat.id, "WRONG")
        }else{
            console.log(username,id,language_code)
            const candidate = await  person.findOne({where:{telegram_chat_id: stringify(id)}})
            if (candidate){
                await bot.sendMessage(msg.chat.id, "Candidat базирован")
            }else{
                const User = await person.create({name: username,telegram_chat_id: stringify(id),language_code})
            }
        }
    }
    async getLimit(msg,bot){
        const {username,id} = msg.chat
        console.log(username,id)
        if (!username || !id){
            await bot.sendMessage(msg.chat.id, "WRONG")
        }else{
            console.log(username,id)
            const candidate = await  person.findOne({where:{telegram_chat_id: stringify(id)}})
            if(candidate){
                return candidate.monitor_limit
            }else{
                console.log("eee")
                return null
            }
        }
    }
    async getChatId(id){
        const candidate = await person.findOne({where:{id: id}})
        if (candidate) {
            return candidate.telegram_chat_id
        }else{
            return undefined
        }
    }
}


module.exports = new PersonController()