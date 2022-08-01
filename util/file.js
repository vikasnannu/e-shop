/* Helper Function => To Delete Files from Local Storage */

// Importing Core Node Module

const fs = require('fs');
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    });
};

exports.deleteFile = deleteFile;