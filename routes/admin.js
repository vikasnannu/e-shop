/**************************** Imports *******************************/


// JS Framework => Fast, Unopinionated, Minimalist Web Framework to Manage Servers and Routes
const express = require('express');
// Router is an Express's Middleware to create modular, mountable route handlers
const router = express.Router(); // This is also called as Mini APP

// Importing Middleware
const isAuth = require('../middleware/is-auth');
// NPM Package => To Validate and Sanitize Data from Server
const {
    body
} = require('express-validator');

// Importing Admin Controllers
const adminController = require('../controllers/admin');

const multer = require("multer");
const upload = multer({dest: 'newimages/'});


/**************************** Routes *******************************/

// Request goes from LEFT -> RIGHT with the help of next();
// Request goes from UP -> DOWN with the help of next();
// All Routes here is === /admin/ + 'Route'

// GET or Rendering Routes
router.get('/admin-products', isAuth, adminController.getProducts);

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);


// POST or Functioning Routes
router.post('/add-product',
    [
        body('title')
        .isString()
        .isLength({
            min: 3
        })
        .trim(),
        body('price').isFloat(),
        body('description')
        .isLength({
            min: 5,
            max: 400
        })
        .trim()
    ],
    isAuth,
    adminController.postAddProduct);

router.post('/edit-product',
    [
        body('title')
        .isString()
        .isLength({
            min: 3
        })
        .trim(),
        body('price').isFloat(),
        body('description')
        .isLength({
            min: 5,
            max: 400
        })
        .trim()
    ],
    isAuth,
    adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.postDeleteProduct);


module.exports = router;