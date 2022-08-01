/**************************** Imports *******************************/

// Helper Function => Delete Image Files from Local Storage
const fileHelper = require('../util/file');
// NPM Package => To Validate and Sanitize Data from Server
const {
    validationResult
} = require('express-validator');
// MongoDB Database => Product Model
const Product = require('../models/product');

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const crypto = require("crypto");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
    },
    region: "ap-south-1"
});

const sharp = require("sharp");


/********************** ADMIN Controllers Renders *******************/

// RENDERING
// Reading or Rendering Creating Products Control of Admin => GET Request
exports.getAddProduct = (req, res, next) => {

    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};
// RENDERING
// Reading or Rendering Editing Controler of Admin => GET Request
exports.getEditProduct = (req, res, next) => {

    const editMode = req.query.edit;

    if (!editMode) {
        return res.redirect('/');
    }

    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {

            if (!product) {
                return res.redirect('/');
            }

            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });

        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};

/************************** ADMIN CRUD *************************/

// CREATE
// Creating Products Control => POST Request
exports.postAddProduct = async (req, res, next) => {

    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;

    if (!image) {
        return res.status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: false,
                hasError: true,
                product: {
                    title: title,
                    price: price,
                    description: description
                },
                errorMessage: 'Attached file is not an image',
                validationErrors: []
            });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        console.log(errors.array());

        return res.status(422)
            .render('admin/edit-product', {
                pageTitle: 'Add Product',
                path: '/admin/add-product',
                editing: false,
                hasError: true,
                product: {
                    title: title,
                    price: price,
                    description: description,
                },
                errorMessage: errors.array()[0].msg,
                validationErrors: errors.array()
            });
    }

    console.log(req.file);
    console.log(req.file.buffer);

    const buffer = await sharp(req.file.buffer).resize({height: 1920, width: 1080, fit: "contain"}).toBuffer();
    const imageName = randomImageName();
    
    const uploadParams = {
        Bucket: "eshopvikasnannu",
        Body: buffer,
        Key: imageName,
        ContentType: req.file.mimetype,
    }

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const final_img_url = "https://eshopvikasnannu.s3.ap-south-1.amazonaws.com/" + imageName;
    console.log(final_img_url);

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: final_img_url,
        userId: req.user
    });

    product.save()
        .then(result => {
            console.log("CREATED PRODUCT");
            res.redirect('/admin/admin-products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
// READ
// Reading Products by Admin => GET Request
exports.getProducts = (req, res, next) => {

    Product.find({
            userId: req.user._id
        })
        .then(products => {
            res.render('admin/admin-products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/admin-products',
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
// UPDATE OR EDIT
// Editing Products Control => POST Request
exports.postEditProduct =  async (req, res, next) => {

    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDescription = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(422)
            .render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: false,
                hasError: true,
                product: {
                    title: updatedTitle,
                    price: updatedPrice,
                    description: updatedDescription,
                    _id: prodId
                },
                errorMessage: errors.array()[0].msg,
                validationErrors: errors.array()
            });
    }

    let final_img_url ="";
    const imageName = randomImageName();
    final_img_url = "https://eshopvikasnannu.s3.ap-south-1.amazonaws.com/" + imageName;

    const buffer = await sharp(req.file.buffer).resize({height: 1920, width: 1080, fit: "contain"}).toBuffer();
                
    const uploadParams = {
        Bucket: "eshopvikasnannu",
        Body: buffer,
        Key: imageName,
        ContentType: req.file.mimetype,
    }

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);
    

    Product.findById(prodId)
        .then(product => {

            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;



            if (image) {
                product.imageUrl = final_img_url;
            }
            

            return product.save()
                .then(result => {
                    console.log("UPDATED PRODUCT");
                    res.redirect('/admin/admin-products');
                });

        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
// DELETE
// Deleting Product Control=> POST Request
exports.postDeleteProduct = (req, res, next) => {

    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {

            if (!product) {
                return next(new Error('Product not found.'));
            }

            return Product.deleteOne({
                _id: prodId,
                userId: req.user._id
            });
        })
        .then(() => {
            console.log('DESTROYED PRODUCT');
            res.status(200).json({
                message: 'Success!'
            });
        })
        .catch(err => {
            res.status(500).json({
                message: 'Deleting product failed.'
            });
        });
};