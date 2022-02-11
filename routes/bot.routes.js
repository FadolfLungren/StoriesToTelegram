const Router = require('express')
userController = require("../controllers/controllers")
const router = new Router()

router.post('/bot', userController.parseBotReq)
router.post('/corn', userController.parseCornReq)
module.exports = router