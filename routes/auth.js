/**************************** Imports *******************************/

// JS Framework => Fast, Unopinionated, Minimalist Web Framework to Manage Servers and Routes
const express = require('express');
// Router is an Express's Middleware to create modular, mountable route handlers
const router = express.Router(); // This is also called as Mini APP

// NPM Package => To Validate and Sanitize Data from Server
const {
    check,
    body
} = require('express-validator');

// Importing Authorizations Controllers
const authController = require('../controllers/auth');

// Importing Users Controllers
const User = require('../models/user');


/**************************** Routes *******************************/

// Request goes from LEFT -> RIGHT with the help of next();
// Request goes from UP -> DOWN with the help of next();
// All Routes here is === /admin/ + 'Route'

// GET or Rendering Routes
router.get('/signup', authController.getSignup);

router.get('/login', authController.getLogin);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewPassword);


// POST or Functioning Routes
router.post('/signup',
    [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, {
            req
        }) => {
            return User.findOne({
                email: value
            }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject(
                        'E-Mail exists already, please pick a different one.'
                    );
                }
            });
        })
        .normalizeEmail(),
        body(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters.'
        )
        .isLength({
            min: 5
        })
        .isAlphanumeric()
        .trim(),
        body('confirmPassword')
        .trim()
        .custom((value, {
            req
        }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
    ],
    authController.postSignup);

router.post('/login',
    [
        body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
        body('password', 'Password has to be valid.')
        .isLength({
            min: 5
        })
        .isAlphanumeric()
        .trim()
    ],
    authController.postLogin);

router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

router.post('/logout', authController.postLogout);


module.exports = router;