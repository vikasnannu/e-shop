/********************* ERROR CONTROLS ***********************/

// RENDERING 404 = 'PAGE NOT FOUND' PAGE
exports.get404 = (req, res, next) => {
    res.status(404)
        .render('404', {
            pageTitle: 'Page Not Found',
            path: '/404',
            isAuthenticated: req.session.isLoggedIn
        });
};

// RENDERING 505 = 'AN ERROR OCCURED' PAGE
exports.get500 = (req, res, next) => {
    res.status(500)
        .render('500', {
            pageTitle: 'Error',
            path: '/500',
            isAuthenticated: req.session.isLoggedIn
        });
};