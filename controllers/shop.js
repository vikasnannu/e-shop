/**************************** Imports *******************************/
// Core Node Module
const fs = require('fs');
// Core Node Module
const path = require('path');

// MongoDB Database => Product Model
const Product = require('../models/product');
// MongoDB Database => Order Model
const Order = require('../models/order');

// NPM Package => To Make PDF Documents
const PDFDocument = require('pdfkit');

// STRIPE PAYMENTS API INTEGRATION => To Make Transaction
const stripe = require('stripe')(process.env.STRIPE_KEY);

//Global Variable for Pagination
const ITEMS_PER_PAGE = 4;

/********************** SHOP's Page Rendering Controls **********************/

// Home Page or Info Page
exports.getIndex = (req, res, next) => {

    res.render('shop/index', {
        pageTitle: 'Info',
        path: '/',
    });

};

// Products Page or Main Shop Page
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        }).then(products => {
            res.render('shop/shop-products', {
                prods: products,
                pageTitle: 'Products',
                path: '/shop-products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// Product Details Page (Product => Product Details)
exports.getProduct = (req, res, next) => {
    // Accessing Product's Product ID
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/shop-products'
            })
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// Cart Page
exports.getCart = (req, res, next) => {

    req.user
        .populate('cart.items.productId')
        .then(user => {

            const products = user.cart.items;

            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            });

            //console.log("Current active user's cart loaded", user);
        }).catch(err => {
            const error = new Error(err);
            console.log(error);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// Orders Page
exports.getOrders = (req, res, next) => {

    Order.find({
            'user.userId': req.user._id
        })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// Checkout Page
exports.getCheckout = (req, res, next) => {
    console.log('Came to the checkout page');
    let products;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .then(user => {

            products = user.cart.items;
            total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price;
            });

            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total,
            });

        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


/********************** SHOP's CART Controls **********************/
// 'ADD TO CART' Control
exports.postCart = (req, res, next) => {

    const prodId = req.body.productId;

    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            console.log("PRODUCT ADDED TO THE CART");
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// 'DELETE FROM CART' Control
exports.postCartDeleteProduct = (req, res, next) => {

    const prodId = req.body.productId;

    req.user
        .removeFromCart(prodId)
        .then(result => {
            console.log("PRODUCT REMOVED FROM THE CART");
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


/******************* SHOP's Payments and Invoice Controls *******************/

// Payment Gateway Control and Merchant Page Redirection
exports.getCreateCheckoutSession = async (req, res, next) => {
    let total = 0;

    req.user.populate('cart.items.productId')
        .then(user => {
            console.log("Populated");
            const products = user.cart.items;
            //console.log(products);
            let itemArray = [];

            products.forEach(p => {

                let temp = {
                    name: p.productId.title,
                    description: p.productId.description,
                    amount: p.productId.price * 100,
                    currency: 'inr',
                    quantity: p.quantity
                }

                itemArray.push(temp);
            });

            return itemArray;
        })
        .then(arr => {
            const session = stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: arr,
                mode: 'payment',
                success_url: 'https://e-shop-vikasnannu.herokuapp.com/checkout/success',
                cancel_url: 'https://e-shop-vikasnannu.herokuapp.com/checkout/cancel',
            });

            return session;
        }).then(session => {
            res.redirect(session.url);
        })
        .catch(err => console.log(err));

}

// Payment Success Control and Orders Page Redirection
exports.getCheckoutSuccess = (req, res, next) => {

    console.log("Sucess Hit");

    req.user
        .populate('cart.items.productId')
        .then(user => {
            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    product: {
                        ...i.productId._doc
                    }
                };
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

// Invoice Control and Invoice PDF Redirection
exports.getInvoice = (req, res, next) => {

    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then(order => {

            if (!order) {
                return next(new Error('No Order'));
            }

            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }

            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);
            const pdfDoc = new PDFDocument();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            });

            let totalPrice = 0;

            pdfDoc.text('---------------------');

            order.products.forEach(prod => {
                totalPrice = totalPrice + prod.quantity * prod.product.price;
                pdfDoc.fontSize(14).text(prod.product.title + '-' + prod.quantity + ' x ' + 'INR' + prod.product.price);
            });

            pdfDoc.text('--------------------')
            pdfDoc.fontSize(20).text('Total Price: INR' + totalPrice);
            pdfDoc.end();

        }).catch(err => next(err));
};