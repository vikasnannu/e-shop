// To get the full path of the app (not full path of the file)..
//...which will return  /apps/myapp, from...
//... a module in sub folder /apps/myapp/data/models/mymodel.js

// Importing the Path Module of Node.js
const path = require('path');
// Exporting Function
module.exports = path.dirname(process.mainModule.filename);

/* ----------------------------------------------------------- */
// Information About Path Module 
// Importing the Path Module of Node.js
// Path provides a way of working with directories and file paths

// *** __dirname
// It returns the path of the folder where the Current Project Folder resides
// not the location of the root of the Main Project Folder
// Current Project Folder === Parent Folder
// For 'path.js' Current Project Folder === 'util' folder

// *** '..' => This element is used to go out or up one level in the directory
// const path = require('path'); // Core Node Module

// We can also follow the traditional method of finding directory
//**** => Path Join: Function of Core Path Module of Node to join path and..
// ... always use 'Join' isntead of concatinating '+'.. 
// ... as then this works for all the OS Mac, Linux and Windows

/* ----------------------------------------------------------- */