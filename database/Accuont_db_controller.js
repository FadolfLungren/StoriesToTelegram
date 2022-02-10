const {person,session} = require("./models/models");
const Axios = require('axios')
const Credentials = require('../credentials.json')
const {stringify} = require("nodemon/lib/utils");
class AccountsController{
    async ValidateUrl(account_name){
        var result = true
        const response = await Axios.get(`https://www.instagram.com/${account_name}?__a=1`,{
            headers: {
                Cookie: Credentials.cookie
            }}).catch(error => {
            result = false
        })
        console.log(`entries:${Object.entries(response)}`)
        if(Object.entries(response) === 0){
            console.log(`LENGTH REJECTED:${account_name}:`)
            return null
        }else{
            return response
        }
    }

    async createSession(msg,bot,Str) {
        const {id} = msg.from
        const Arr = Str.split(" ")

        const countItems = Arr.reduce((acc, item) => {
            acc[item] = acc[item] ? acc[item] + 1 : 1; // если элемент уже был, то прибавляем 1, если нет - устанавливаем 1
            return acc;
        }, {});
        const result = Object.keys(countItems).filter((item) => countItems[item] > 1);


        if (!result.length){
            if (!id) {
                await bot.sendMessage(msg.chat.id, "Что то пошло не так")
            } else {

                const candidate = await person.findOne({where: {telegram_chat_id: stringify(id)}})

                if (candidate.monitor_limit >= (candidate.monitoring_now + Arr.length)) {

                    const createdSessions = await Promise.all(Arr.map(async (AccountName) => {
                        if (!await session.findOne({where: {account_name: AccountName, personId: candidate.id}})) {
                            if(await this.ValidateUrl(AccountName)) {
                                await session.create({
                                    account_name: AccountName,
                                    personId: candidate.id,
                                    last_monitored_post: "###",
                                    status: false,
                                    frequency: 120
                                })
                                const ss = await session.findOne({where: {account_name: AccountName, personId: candidate.id}})

                                await candidate.update({monitoring_now: candidate.monitoring_now + 1})
                                await bot.sendMessage(msg.chat.id, AccountName+" Добавлен")
                                return ss
                            }else{
                                await bot.sendMessage(msg.chat.id, "Несуществующий аккаунт инстаграмм (если уверены что всё верно попробуйте ещё раз через некоторое время)")
                            }
                        } else {
                            await bot.sendMessage(msg.chat.id, "Уже добавлен")
                        }

                    }))

                    return createdSessions
                } else {
                    await bot.sendMessage(msg.chat.id, `Ваш лимит ${candidate.monitor_limit} вы не можете добавить больше`)
                }
            }
    }else{
            await bot.sendMessage(msg.chat.id, "Одинаковые кандидаты: " + result + ". Попробуйте ещё раз, удалив повтаряющиеся аккаунты")
        }

    }
    async deleteSession(telegram_chat_id,AccountName,bot){
        if (!telegram_chat_id){
            await bot.sendMessage(telegram_chat_id, "WRONG")
        }else{
            const candidate = await person.findOne({where:{telegram_chat_id: stringify(telegram_chat_id)}})
            const victim = await session.findOne({where:{account_name: AccountName, personId: candidate.id}})

                if(!victim){
                    await bot.sendMessage(telegram_chat_id, "Вы не наблюдаете за "+AccountName)
                }else {
                    await victim.destroy()
                    await candidate.update({monitoring_now:candidate.monitoring_now-1})
                    return victim
                }

        }
    }
    async getSessionsList(telegram_chat_id){
        const candidate = await person.findOne({where:{telegram_chat_id: stringify(telegram_chat_id)}})
        return await session.findAll({
            where: {
                personId: candidate.id
            }
        });
    }
    async getLastPosted(username,chatId){
        const candidate = await person.findOne({where:{telegram_chat_id: stringify(chatId)}})
        const Account = await session.findOne({
            where:{
                account_name: username,
                personId: candidate.id
            }
        })
        console.log("Last post:"+Account.last_monitored_post)
        return await Account.last_monitored_post
    }
    async setLastPosted(username,chatId,postId){
        const candidate = await person.findOne({where:{telegram_chat_id: stringify(chatId)}})
        const Account = await session.findOne({
            where:{
                account_name: username,
                personId: candidate.id
            }
        })
        await Account.update({last_monitored_post:postId})
    }

}

module.exports = new AccountsController()