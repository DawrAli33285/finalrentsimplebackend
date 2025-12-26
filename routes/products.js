const router = require('express').Router();
const { createProduct,deleteProduct,getProducts } = require('../controller/products');
const upload = require('../middleware/upload');

router.post('/create-product', upload.single('photo'), createProduct);
router.delete('/deleteProduct/:id',deleteProduct)
router.get('/getProducts',getProducts)

module.exports = router;
