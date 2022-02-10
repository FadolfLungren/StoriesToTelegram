module.exports = (Freq,selfCookie,active_accs,max_accs,Arr)=>{
List = ''
    if (Arr.length) {
        Arr.forEach(async (Account, index) => {
            index += 1
            var status = ""
            if(Account.status){
                status = "✅Активен"
            }else{
                status = "❌Не активен"
            }
            List = List + `<b>${index}</b>: <a href = 'https://www.instagram.com/${Account.account_name}/?hl=en'>${Account.account_name}</a> \n Последний пост : <a href="https://www.instagram.com/stories/${Account.account_name}/${Account.last_monitored_post}">${Account.last_monitored_post}</a> \n Статус : ${status}\n\n`
        })
    }else{
        List = "Не выбраны аккаунты, используйте /add что-бы настроить"
    }
return `
<b>Частота обновления</b>: ${Freq} \n
<b>Статус профиля</b>: Базовый \n
<b>Мониторится аккаунтов:</b> ${active_accs} <b>|</b> ${max_accs}
<b>Удалить аккаунты:</b> /delete 
<b>Добавить аккаунты:</b> /add [аккаунты через пробел]\n
${List}
`
}