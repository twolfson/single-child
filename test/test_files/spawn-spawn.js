// Load in dependencies
var SingleChild = require('../../lib/single-child');

// Start a single child which console.log's to nowhere
var singleChild = new SingleChild('node', ['console.log(\'1\');']);
singleChild.start();