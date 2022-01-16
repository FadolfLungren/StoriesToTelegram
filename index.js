const Download = require("./downloadManager.js")
const TelegramApi = require('node-telegram-bot-api')

const Token = "1638628109:AAEwQN23T65IBYqLRJr6kN38jkU7vjoaQj4"

const bot = new TelegramApi(Token,{polling:true})

class Session {
	#session_id
	#ChatId
	#PATH = undefined
	#milisec_between_posts
	#account
	#IntervalObj

	constructor(story_acc_name,session_id,minutes_between_posts,ChatId) {
		this.#session_id = session_id
		this.#account = story_acc_name
		this.#milisec_between_posts = minutes_between_posts*60*1000
		this.ChatId = ChatId
	}

	async startSession(){
		await Download.stories(this.#account, this.#PATH).then(async stream => {
			console.log("session id:", this.#session_id, "sending_media")
			await bot.sendVideo(this.ChatId, stream.data)

		})
		this.IntervalObj=setInterval(async ()=> {
				await Download.stories(this.#account, this.#PATH).then(async stream => {
					console.log("session id:", this.#session_id, "sending_media")
					await bot.sendVideo(this.ChatId, stream.data)

				})
			}
		,this.#milisec_between_posts)


	}

	closeSession(){
		clearInterval(this.IntervalObj)
	}
}

Sessions = []

bot.on('message', async msg=>{
	const text = msg.text 
	const ChatId = msg.chat.id

	if (text==="/start") {
		const SessionObj = new Session("nike", "21", 1, ChatId)
		await bot.sendMessage(ChatId, "session started")
		Sessions.push(SessionObj)
		await SessionObj.startSession()
	}else{
		if (text === "/stop"){
			if(!(Sessions.length===0)){
				Sessions[0].closeSession()
				await bot.sendMessage(ChatId, "session closed")
				Sessions.pop()
			}else{
				await bot.sendMessage(ChatId, "no active session")
			}
		}
		await bot.sendMessage(ChatId, text)
	}
})