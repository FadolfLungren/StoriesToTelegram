const TelegramApi = require("node-telegram-bot-api");
const Download = require("./downloadManager");
const Keyboard = require("./Bot_Assets/Keyboard");
const dbPersonController = require("./database/database_controller");
const dbAccountsController = require('./database/Accuont_db_controller')
const form_Html_templ = require("./Bot_Assets/HTML")
const {session} = require("./database/models/models");
//51101702585%3A6Xr2aYJ5gf2UvS%3A7
//51235652097%3AFzaaxV2OR6iO3T%3A12
//instagrStorybot 5278080039:AAGgEgbef6Ni_JKf67J2zM3uMiSVrfYZbT0
require("dotenv").config()
const bot = new TelegramApi(process.env.Token)

bot.setWebHook(process.env.URL+'/api/bot')

class Session {
    session_id
    #ChatId
    #milisec_between_posts
    account
    #IntervalObj
    #PersonId

    constructor(SessionData) {
        this.session_id = SessionData.id
        this.account = SessionData.account_name
        this.#milisec_between_posts = SessionData.frequency*60*1000
        this.#PersonId = SessionData.personId
    }

    async startSession(){
        console.log("ChatId:"+this.ChatId)

        this.#ChatId = await dbPersonController.getChatId(this.#PersonId)
        await Download.stories(this.account, this.#ChatId).then(async Story_mass => {
            if(Story_mass.length===0){
                console.log("stream empty")
            }

            await Story_mass.forEach(async Story => {
                if (Story.type==="vid") {
                    console.log("session id:", this.session_id, "sending_media")
                    await bot.sendVideo(this.#ChatId, Story.streamData.data)
                }else{
                    console.log("session id:", this.session_id, "sending_media")
                    await bot.sendPhoto(this.#ChatId, Story.streamData.data)
                }

            })
        })

        this.#IntervalObj=setInterval(async ()=> {

                await Download.stories(this.account, this.#ChatId).then(async Story_mass => {
                    await bot.sendMessage(827988306,`checked ${this.account} ${Story_mass}`)
                    if(Story_mass.length===0){
                        console.log("stream empty")
                    }
                    await Story_mass.forEach(async Story => {
                        if (Story.type==="vid") {
                            console.log("session id:", this.session_id, "sending_media")
                            await bot.sendVideo(this.#ChatId, Story.streamData.data,{
                                'caption':`${Story.href}`
                            })
                        }else{
                            console.log("session id:", this.session_id, "sending_media")
                            await bot.sendPhoto(this.#ChatId, Story.streamData.data, {
                                'caption': `ddddd ddd${Story.href}`
                            })
                        }

                    })
                })

            }
            ,this.#milisec_between_posts)


    }

    closeSession(){
        clearInterval(this.#IntervalObj)
    }
}
class MainProcess{
    SessionsPipeline = []

    async addActiveSession(msg,match){
        const createdSession = await dbAccountsController.createSession(msg,bot,match)
        createdSession.forEach(async SessionData=>{
            await SessionData.update({status:true})
            this.SessionsPipeline.push(new Session(SessionData))
        })
    }
    async addSession(msg,match){
        const createdSession = await dbAccountsController.createSession(msg,bot,match)
    }

    async deleteSession(ChatId,AccountName){

        const Victim = await dbAccountsController.deleteSession(ChatId, AccountName, bot)
        const index = await this.findActiveSessionByParams(ChatId,Victim)
        console.log("daeeeew"+index)
        if(this.SessionsPipeline[index]) {
            this.SessionsPipeline[index].closeSession()
            await bot.sendMessage(ChatId, `Session ${this.SessionsPipeline[index].account_name} closed id:${this.SessionsPipeline[index].session_id}`)
            this.SessionsPipeline.splice(index, 1)
        }
        console.log(this.SessionsPipeline)
    }

    async findActiveSessionByParams(ChatId,SessionData){
        if (!(this.SessionsPipeline.length === 0)) {
            return this.SessionsPipeline.findIndex(async (ActSessionObj) => {
                if (ActSessionObj.session_id === SessionData.id) {
                    if (SessionData.status) {
                        return true
                    } else {
                        //await bot.sendMessage(ChatId, `Session ${ActSessionObj.account} id:${ActSessionObj.session_id} status is False`)
                    }
                }
            })
        }else{
            //await bot.sendMessage(ChatId, `ActiveSessions Massive empty`)
        }
    }

    async CloseActiveSessionsOfUser(ChatId){
        const SessionsToStop = await dbAccountsController.getSessionsList(ChatId)
        if (!(SessionsToStop.length === 0)){
            //console.log(this.SessionsPipeline)
            SessionsToStop.forEach(async SessionData =>{
                const index = await this.findActiveSessionByParams(ChatId,SessionData)

                //console.log("sedsdfsd===="+index)
                if (this.SessionsPipeline[index]){
                    this.SessionsPipeline[index].closeSession()
                    //await bot.sendMessage(ChatId, `Session ${this.SessionsPipeline[index].account} closed id:${this.SessionsPipeline[index].session_id}`)
                    this.SessionsPipeline.splice(index, 1)
                    await SessionData.update({status: false})
                }else{
                    await SessionData.update({status: false})
                    await bot.sendMessage(ChatId, `Session ${SessionData.account_name} went wrong: status set to${SessionData.status}`)
                }
                console.log(this.SessionsPipeline)
            })


            Keyboard.home[0][1]= "Начать мониторинг"
            await bot.sendMessage(ChatId, "Больше бот не отправляет вам сторис",{
                reply_markup:{
                    keyboard: Keyboard.home
                }
            })
        }else{
            await bot.sendMessage(ChatId, "no_sessions_to_close set it by /monitor")
            Keyboard.home[0][1]= "Начать мониторинг"
            await bot.sendMessage(ChatId, "zzzzzzzzzzzz",{
                reply_markup:{
                    keyboard: Keyboard.home
                }
            })
        }
    }
    async OpenActiveSessionsOfUser(ChatId){
        const Sessions = await dbAccountsController.getSessionsList(ChatId)
        //console.log("========"+typeof (Sessions.length))
        if (!(Sessions.length === 0)){
            Sessions.forEach(async SessionData =>{
                const SessionObj = new Session(SessionData)
                await SessionObj.startSession()
                await SessionData.update({status:true})
                this.SessionsPipeline.push(SessionObj)
                    //await bot.sendMessage(ChatId, `Session ${SessionObj.account} id:${SessionObj.session_id} started`)
            })
            Keyboard.home[0][1]= "Закончить мониторинг"
            bot.sendMessage(ChatId, "Бот работает исправно",{
                reply_markup:{
                    keyboard: Keyboard.home
                }
            })
        }else{
            await bot.sendMessage(ChatId, "У вас не назначены аккаунты для слежки, назначте их с помощью /add[Аккаунты через пробел]")
        }
    }

}

const ProcessMAIN = new MainProcess

bot.onText(/\/start/,msg=>{
    const text = "Первое включени от" + msg.from.first_name

    bot.sendMessage(msg.chat.id, text,{
        reply_markup:{
            keyboard: Keyboard.home
        }
    })
    dbPersonController.createUser(msg,bot)
})

bot.onText(/\/add (.+)/ ,async (msg,[command, match])=>{
    await ProcessMAIN.addSession(msg,match)
})

bot.onText(/\/delete/ ,async (msg)=>{
    const Inline_mass = []
    const Sessions = await dbAccountsController.getSessionsList(msg.chat.id)
    console.log(Sessions.length)
    if(!(Sessions.length === 0)) {
        var curRow = 0
        Sessions.forEach((Session, index) => {
            if (index % 3 === 0) {
                const row = []
                row.push({
                    text: Session.account_name,
                    callback_data: "del" + index
                })
                Inline_mass.push(row)
                curRow += 1
            } else {
                Inline_mass[curRow - 1].push({
                    text: Session.account_name,
                    callback_data: "del" + index
                })
            }

        })
        Inline_mass.push([{
            text: "Закрыть",
            callback_data: "close"
        }])

        console.log(Inline_mass)
        await bot.sendMessage(msg.chat.id, "Удалить аккаунты", {
            reply_markup: {
                inline_keyboard: Inline_mass
            }
        })
    }else{
        await bot.sendMessage(msg.chat.id,"У вас нет аккаунтов, что-бы их удалять")
    }
})
bot.onText(/\/del_(.+)/ ,async (msg,query)=>{
    if(query)
    {
        await ProcessMAIN.deleteSession(msg.chat.id, query[1])
    }else{
        await bot.sendMessage(msg.from.id,"notBASED")
    }
})

ActiveSessions=[]
bot.on('message', async msg=>{
    const text = msg.text
    const ChatId = msg.chat.id
    switch (text){
        case "Начать мониторинг":
            await ProcessMAIN.OpenActiveSessionsOfUser(ChatId)
            break
        case "Закончить мониторинг":
            await ProcessMAIN.CloseActiveSessionsOfUser(ChatId)
            break
        case "Справка":
            await bot.sendMessage(ChatId, `
<b>Справка</b>

<b>InstagramStoryBot</b> - Этот Бот будет пересылать вам новые сторис из любых выбранных вами аккаунтов инстаграмм, кроме закрытых.

▶Бесплатно можно добавить до 3-х аккаунтов, что-бы это сделать пропишите /add [Аккаунты через пробел] Например: /add nike apple

▶Удалить аккаунты можно при помощи функции /delete❌ или через настройки /settings🔧

▶Чтобы запустить отслеживание сторис нажмите соответствующую кнопку на клавиатуре или пропишите /monitor

/create_keyboard - <b>Создать клавиатуру</b> ✅
/delete_keyboard - <b>Удалить клавиатуру</b> ❌

▶Для обратной связи 
📫fadolfsatan671@gmail.com 
телеграм: @jabronier
`,{
                parse_mode:"HTML"
            })
            break
        case "Активные аккаунты":
            const Arr = await dbAccountsController.getSessionsList(msg.chat.id)
            var names = ``
            if (Arr.length) {
                Arr.forEach(async (Account, index) => {
                    index += 1
                    names = names + `<b>${index}</b>: ${Account.account_name} \n`
                })
                console.log(names)
                await bot.sendMessage(msg.chat.id, names,{
                    parse_mode:"HTML"
                })
            }else{
                await bot.sendMessage(msg.chat.id, "Назначте аккаунты")
            }
            break
        case "Настройки":
            const Account_list = await dbAccountsController.getSessionsList(msg.chat.id)
            var number_of_accs = 0
            if (Account_list){
                number_of_accs = Account_list.length
            }

            await bot.sendMessage(msg.chat.id, form_Html_templ(
                "Раз в 2 часа",
                "Не указан",
                number_of_accs,
                (await dbPersonController.getLimit(msg, bot)), Account_list),
                {parse_mode:"HTML",
                    reply_markup:{
                    inline_keyboard:[[{
                        text:"❎Удалить аккаунты",
                        callback_data:"Settings_redraw"
                    }]]
                    }})

            break
        case "Донат":
            await bot.sendMessage(ChatId, `
<b>Донат для поддержки проекта</b>

<b>InstagrStoryBot</b> существует благодаря добровольным пожертвованиям пользователей. 
Так же если вы хотите расширить возможности бота, например мониторть больше аккаунтов одновременно вы можете при пожертвовании указать свой Username телеграмм(Например: @InstagrStory_bot)
<b>При донате в 100 рублей</b> ваш порог повышается с 3 до 10 аккаунтов навсегда
<b>При донате в 500 рублей</b> ваш порог повышается с 3 до 50 аккаунтов навсегда
<b>При донате в 1000 рублей</b> ваш порог становится 100 аккаунтов навсегда
<b>При донате выше 1000</b> вы повышаете лимит по расчёту 200 рублей за аккаунт
Все эти статусы считаются по совокупной стоимости пожертвований на один аккаунт телеграм, и они присваиваются с задеркой примерно в день

Киви - 
Сбер - 
`,{
                parse_mode:"HTML"
            })
            break
        case "/start":
            break
        case "/monitor":
            await bot.sendMessage(ChatId, "✅cerfСУКА")
        //default:
            //await bot.sendMessage(ChatId, text)
    }
})

bot.on("callback_query" ,async query=>{
    const form = {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        parse_mode:"HTML"
    }
    switch(true){
        case /del(.+)/.test(query.data):
            //console.log(JSON.stringify(query))
            const index = parseInt(query.data.match(/del(.+)/)[1])
            const Deleted = await dbAccountsController.deleteSession(query.from.id,query.message.reply_markup.inline_keyboard[Math.floor(index/3)][index%3].text,bot)

            if (Deleted) {
                const Inline_mass = []
                const Sessions = await dbAccountsController.getSessionsList(query.message.chat.id)
                var curRow = 0
                Sessions.forEach((Session, index) => {
                    if (index % 3 === 0) {
                        const row = []
                        row.push({
                            text: Session.account_name,
                            callback_data: "del" + index
                        })
                        Inline_mass.push(row)
                        curRow += 1
                    } else {
                        Inline_mass[curRow - 1].push({
                            text: Session.account_name,
                            callback_data: "del" + index
                        })
                    }

                })


                console.log("LAST++++++++"+JSON.stringify(query.message.from))
                if(!query.message.from.is_bot){
                Inline_mass.push([{
                    text: "Закрыть",
                    callback_data: "close"
                }])
                }else{
                    Inline_mass.push([{
                        text: "⏪Вернуться",
                        callback_data: "Back"
                    }])
                }

                if(!(Inline_mass.length === 0)) {
                    query.message.reply_markup.inline_keyboard = Inline_mass
                    await bot.editMessageReplyMarkup(query.message.reply_markup, form)
                }else{
                    await bot.deleteMessage(query.from.id, query.message.message_id)
                }
            }

            //await bot.deleteMessage(query.from.id, query.message.message_id)
            break
        case /close/.test(query.data):
            await bot.deleteMessage(query.from.id, query.message.message_id)
            break

        case /Settings_redraw/.test(query.data):
            const Inline_mass = []
            const Sessions = await dbAccountsController.getSessionsList(query.message.chat.id)
            if (!(Sessions.length === 0)) {
                var curRow = 0
                Sessions.forEach((Session, index) => {
                    if (index % 3 === 0) {
                        const row = []
                        row.push({
                            text: Session.account_name,
                            callback_data: "del" + index
                        })
                        Inline_mass.push(row)
                        curRow += 1
                    } else {
                        Inline_mass[curRow - 1].push({
                            text: Session.account_name,
                            callback_data: "del" + index
                        })
                    }

                })
                Inline_mass.push([{
                    text: "⏪Вернуться",
                    callback_data: "Back"
                }])
                query.message.reply_markup.inline_keyboard = Inline_mass
                await bot.editMessageText("Удалить аккаунты❌", form)
                await bot.editMessageReplyMarkup(query.message.reply_markup, form)
            }else{
                await bot.sendMessage(query.message.chat.id,"У вас нет аккаунтов, что-бы их удалять")
            }
            break
        case /Back/.test(query.data):
            console.log(JSON.stringify(query))
            const Account_list = await dbAccountsController.getSessionsList(query.message.chat.id)
            var number_of_accs = 0
            if (Account_list){
                number_of_accs = Account_list.length
            }

            await bot.editMessageText(form_Html_templ(
                "Раз в 2 часа",
                "Не указан",
                number_of_accs,
                (await dbPersonController.getLimit(query.message, bot)), Account_list),form)
            query.message.reply_markup.inline_keyboard = [[{
                text:"❎Удалить аккаунты",
                callback_data:"Settings_redraw"
            }]]
            await bot.editMessageReplyMarkup(query.message.reply_markup,form)
            break
    }

})
module.exports = bot