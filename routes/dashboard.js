const {getDashboardData,getRenterDashboardData}=require('../controller/dashboard')
const {Auth}=require('../middleware/auth')

const router=require('express').Router();

router.get('/getDashboardData',Auth,getDashboardData)
router.get('/getRenterDashboardData',Auth,getRenterDashboardData)
module.exports=router;