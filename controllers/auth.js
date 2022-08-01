/**************************** Imports *******************************/

// NPM Package =>  To Encrypts and Decrypts Data
const crypto = require('crypto');
// NPM Package => To Hash The Passwords
const bcrypt = require('bcryptjs');
// NPM Package => To Validate and Sanitize Data from Server
const {
    validationResult
} = require('express-validator');

// MongoDB Database => Product Model
const User = require('../models/user');

// NODEMAILER API INTEGRATION => TO Send Authorization Mails
const nodemailer = require('nodemailer'); //Sending Emails are left
// NODEMAILER Function => Create A Host
const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "68ae5960b69d70",
        pass: "100d42530dcaac"
    }
});


/************* AUTHORIZATION Controllers Renders ***************/
// SIGN UP Page
exports.getSignup = (req, res, next) => {

    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    });
};
// LOG IN Page
exports.getLogin = (req, res, next) => {

    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};
// RESET Page
exports.getReset = (req, res, next) => {

    let message = req.flash('error');

    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};
// RESET PASSWORD Page
exports.getNewPassword = (req, res, next) => {

    const token = req.params.token;

    User.findOne({
            resetToken: token,
            resetTokenExpiration: {
                $gt: Date.now()
            }
        })
        .then(user => {

            let message = req.flash('error');

            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }

            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


/************* AUTHORIZATION CONTROLS ***************/
// SIGN UP Control
exports.postSignup = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        });
    }

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
            return transport.sendMail({
                to: email,
                from: 'vikasnannu@gmail.com',
                subject: 'Signup succeeded!',
                html: '<h1>You successfully signed up!</h1>'
            }, (err, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};
// LOGIN Control
exports.postLogin = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({
        email: email
    }).then(user => {

        if (!user) {
            return res.status(422).render('auth/login', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage: 'Invalid email or password',
                oldInput: {
                    email: email,
                    password: password,
                },
                validationErrors: []
            });
        }

        bcrypt.compare(password, user.password)
            .then(doMatch => {

                if (doMatch) {
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    return req.session.save(err => {
                        console.log(err);
                        res.redirect('/');
                    });
                }

                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password',
                    oldInput: {
                        email: email,
                        password: password,
                    },
                    validationErrors: []
                });

            }).catch(err => {
                console.log(err);
                res.redirect('/login');
            });

    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};
// RESET Control
exports.postReset = (req, res, next) => {

    crypto
        .randomBytes(32, (err, buffer) => {

            if (err) {
                console.log(err);
                return res.redirect('/reset');
            }

            const token = buffer.toString('hex');

            User.findOne({
                    email: req.body.email
                }).then(user => {

                    if (!user) {
                        req.flash('error', 'No account with that email found.');
                        return res.redirect('/reset');
                    }

                    user.resetToken = token;
                    user.resetTokenExpiration = Date.now() + 3600000;
                    return user.save();
                })
                .then(result => {

                    res.redirect('/');

                    transport.sendMail({
                        to: req.body.email,
                        from: 'vikasnannu@gmail.com',
                        subject: 'Password Reset',
                        html: `<p>You requested a password reset</p>
                            <p>Click this
                            <a href="https://e-shop-vikasnannu.herokuapp.com/reset/${token}">link</a> 
                            to set a new password</p>`
                    });
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        });
};
// NEW PASSWORD Control
exports.postNewPassword = (req, res, next) => {

    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
            resetToken: passwordToken,
            resetTokenExpiration: {
                $gt: Date.now()
            },
            _id: userId
        }).then(user => {

            resetUser = user;
            return bcrypt.hash(newPassword, 12);

        }).then(hashedPassword => {

            resetUser.password = hashedPassword;
            resetUser.resetToken = null;
            resetUser.resetTokenExpiration = undefined;

            resetUser.save();

        }).then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
// LOG OUT Control
exports.postLogout = (req, res, next) => {

    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};