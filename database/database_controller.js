const sequelize = require("./db")
const {person, session} = require("./models/models")
const {cookie} = require("./models/models")
const {stringify} = require("nodemon/lib/utils");
const credentials = require("../credentials.json")
const fs = require('fs');
const Credentials = require("../credentials.json");


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
                console.log(`user ${username} not found`)
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

    async replaceInvalidCookie(){
        const Cookie = await cookie.findOne({
            where: {
                is_valid: true
            }
        })
        if(Cookie){
            console.log(`${Cookie.session_id} choosen`)
            credentials.cookie = 'sessionid='+Cookie.session_id

            fs.writeFile('credentials.json', JSON.stringify(credentials,null,2), (err) => {
                if (err) console.log(err);
            })

        }else{
            console.log(`NO VALID COOKIES LEFT`)
        }
    }
    async cookieSetToInvaid(Credentials){
        console.log(`SEARCHING ++++++++ ${Credentials.cookie}`)
        const Victim = await cookie.findOne({where:{session_id: Credentials.cookie}})
        if(Victim){
            await Victim.update({is_vaild:false})
        }else{
            console.log("SOMTHING WENT WRONG VICTIM NOT FOUND")
        }
    }
    async addCookie(CookieData){
        console.log(`cookieID+++==${CookieData.session_id}`)
        await cookie.create({
            session_id: CookieData.session_id,
            is_valid:true
        })
    }
}

module.exports = new PersonController()