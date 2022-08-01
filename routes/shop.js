/**************************** Imports *******************************/


// JS Framework => Fast, Unopinionated, Minimalist Web Framework to Manage Servers and Routes
const express = require('express');
// Router is an Express's Middleware to create modular, mountable route handlers
const router = express.Router(); // This is also called as Mini APP

// Importing Middleware
const isAuth = require('../middleware/is-auth');

// Importing Shop Controllers
const shopController = require('../controllers/shop');


/**************************** Routes *******************************/

// Request goes from LEFT -> RIGHT with the help of next();
// Request goes from UP -> DOWN with the help of next();
// All Routes here is === /admin/ + 'Route'

// GET or Rendering Routes
router.get('/', shopController.getIndex);

router.get('/shop-products', shopController.getProducts);

router.get('/shop-products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.get('/checkout', isAuth, shopController.getCheckout);

router.get('/create-checkout-session', isAuth, shopController.getCreateCheckoutSession);

router.get('/checkout/success', shopController.getCheckoutSuccess);

router.get('/checkout/cancel', shopController.getCheckout);

router.get('/orders', isAuth, shopController.getOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

// POST or Functioning Routes
router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

module.exports = router;