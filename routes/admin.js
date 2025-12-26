const router=require('express').Router();
const {getUsers,updateUser,getRentals,adminsupportsendmessage,checkValidAdmin,getCurrentAdmin,supportSendMessage,closeTicket,getUserTicket,supportmessageTickets,getAllTicketsForAdmins,markMessageAsRead,updateStatus,loginAdmin,updateVendor,deleteVendor,getVendors,resetAdmin,createAdmin,deleteUser,getDashboardData,pauseSubscription,getProducts,unPauseSubscription, updateProduct, getOrders}=require('../controller/admin')
let upload=require('../middleware/upload')
const {Auth}=require('../middleware/auth')

router.get('/getDashboardData',getDashboardData)
router.put('/admin/updateProduct/:id', upload.single('images'), updateProduct)
router.get('/getUsers',getUsers)
router.get('/getVendors',getVendors)
router.put('/update-user/:id',updateUser)
router.put('/update-vendor/:id',updateVendor)
router.delete('/delete-user/:id',deleteUser)

router.delete('/deleteVendor/:id',deleteVendor)
router.get('/admin/getProducts',getProducts)
router.get('/get-orders',getOrders)
router.get('/get-rentals',getRentals)
router.patch('/pauseSubscription/:subscriptionId',pauseSubscription)
router.patch('/unpauseSubscription/:subscriptionId',unPauseSubscription)
router.post('/loginAdmin',loginAdmin)
router.post('/createAdmin',createAdmin)
router.patch('/resetAdmin',resetAdmin)
router.patch('/admin/updateStatus/:id',updateStatus)
router.post('/support/mark-read/:ticketId', markMessageAsRead)
router.get('/support/messages/:ticketId',supportmessageTickets)
router.get('/admin/support/tickets',getAllTicketsForAdmins)
router.post('/admin/support/send-message',Auth,supportSendMessage)
router.get('/support/my-ticket', Auth,getUserTicket)



router.get('/getCurrentAdmin',getCurrentAdmin)
router.post('/admin/checkValidAdmin',checkValidAdmin)
module.exports=router;