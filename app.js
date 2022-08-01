/******************************** Imports ************************************/


/*************************** Node Core Modules Imported **************************/


// 'fs' => To Store, Access, and Manage data on Operating System
const fs = require('fs');
// 'path' => To Access and Interact with File System
const path = require('path');
// 'body-parser' => To Process Data sent through an HTTP Request Body
const bodyParser = require('body-parser');




/*************************** Node Framework Imported **************************/

// JS Framework => Fast, Unopinionated, Minimalist Web Framework to Manage Servers and Routes
const express = require('express');
// 'app' => Main Application Name
const app = express(); 



/****************************** NPM Packages Imported ****************************/

// 'express-session' => To Create and Manage Session Middleware
const session = require('express-session');
// 'csurf' => To Create a Middleware for CSRF Token and Validation
const csrf = require('csurf');
// 'connect-flash' => To Store Messages during Sessions
const flash = require('connect-flash');
// 'multer' => To handle Multipart/Form-Data, primarily for Uploading Files
const multer = require('multer');
// 'helmet' => To Secure App by setting various HTTP headers
const helmet = require('helmet');
// 'compression' => To Compress Response Bodies for Request from the Middleware
const compression = require('compression');
// 'morgan' => To Log HTTP Requests and Errors
const morgan = require('morgan');



/****************************** Database Imported ****************************/

// 'connect-mongodb-session' => To Connect with MongoDB Database Session
const MongoDBStore = require('connect-mongodb-session')(session);
// Cloud Link of Current or Required Database
const MONGODB_URI = "";
// Connecting to Database
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'session',
});
// 'mongoose' => JS Library => MongoDB Object Modeling Tool to work in an Asynchronous Environment
const mongoose = require('mongoose');



/****************************** Routes, Controllers and Models Imported ****************************/

// Routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// Error Controller
const errorController = require('./controllers/error');

// User Model
const User = require('./models/user');



/****************************** Initializing Packages and Utility Functions ****************************/

// Making 'csrf' Token Package Active
const csrfProtection = csrf();

// Making 'muler' Image Package Linked
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Filtering Out Non Images Files Function
const fileFilter = (req, file, cb) => {
    
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
// Linking App to Acces Log Directory Function
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {
    flags: 'a'
});


/****************************** Initializing and Setting Templating Engine ****************************/
// Before this => install NPM EJS (No need of Importing here)
app.set('view engine', 'ejs');
app.set('views', 'views'); 


/****************************** Initializing Middlewares  ****************************/

// Request goes from LEFT -> RIGHT with the help of next();
// Request goes from UP -> DOWN with the help of next();


// Making URL Encoded Data Active
app.use(bodyParser.urlencoded({
    extended: false
}));

// Making URL JSON Data Active
app.use(express.json());

// Using 'multer' for Storing Files after Filtering 
app.use(multer().single('image'));

// Setting Express.js Static Function to Serve Files Statically
app.use(express.static(path.join(__dirname, 'public')));

// Setting Express.js Static Function to Serve Images Statically
app.use('/images', express.static(path.join(__dirname, 'images')));

// Setting Session Storage
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

// Integrating CSRF Token
app.use(csrfProtection);

// Integrating Flash Messages
app.use(flash());

// Setting Authentication Parameter Middleware
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Authentication Checker Middleware
app.use((req, res, next) => {
    
    if (!req.session.user) {
        return next();
    }
    
    User.findById(req.session.user._id)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        });
});

// Integrating Compression Function Messages
app.use(compression());

// Integrating Logging Function
app.use(morgan('combined', {
    stream: accessLogStream
}));

// Database Middleware
app.use((req, res, next) => {
    
    if (!req.session.user) {
        return next();
    }
    
    User.findById(req.session.user._id)
        .then(user => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            throw new Error(err);
        });
});


/* --------------------------------------------------------------------------------------------------------- */
/****************************** Main Logic of The Application****************************/


app.use(authRoutes);
app.use(shopRoutes); 
app.use('/admin', adminRoutes); // Admin functionality => '/' + '/amin'
app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {

    res.status(500)
        .render('500', {
            pageTitle: 'Error!',
            path: '/500',
            isAuthenticated: req.session.isLoggedIn
        });
});

mongoose.connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || 8000);
        console.log("SERVER STARTED");
    })
    .catch(err => console.log(err));

