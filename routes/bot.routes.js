const Router = require('express')
userController = require("../controllers/controllers")
const router = new Router()

router.post('/bot', userController.parseBotReq)

module.exports = router