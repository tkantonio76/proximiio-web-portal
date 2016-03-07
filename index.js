#!/usr/bin/env node --harmony

var http = require('http');
var express = require('express');
var RED = require('node-red-custom');
var open = require('open');
var program = require('commander');
var InstanceController = require('./instanceController');
var fs = require('fs');
// Create an Express app
var app = express();

var instance = null;
try {
   instance = fs.readFileSync('./proximiio.json', 'utf8');
   instance = JSON.parse(instance);
} catch(e) {
   console.log('err', e);
   instance = null;
}

console.log('found instance', instance);
var instanceController = new InstanceController(instance);

// Configuration

//app.set('views', __dirname + '/app');
//app.set('view engine', 'jade');
var bodyParser = require('body-parser');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//app.use(express.methodOverride());
app.use(express.static(__dirname + '/dist'));
app.use('/public', express.static(__dirname + '/public'));
//add this so the browser can GET the bower files
//app.use('/bower_components', express.static(__dirname + '/bower_components'));
//app.use(app.router);
//app.engine('html', require('ejs').renderFile);

app.use('/instance', instanceController.router);

app.get('/', function(request, response) {
  response.render('dist/index.html')
});

// Create a server
var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
var settings = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/api",
    userDir: __dirname,
    nodesDir: __dirname + '/nodes',
    proximiio: instance,
    functionGlobalContext: {

    },    // enables global context
    editorTheme: {
        page: {
          title: "Proximi.io",
          //favicon: "/absolute/path/to/theme/icon",
          css: ["custom.css"]
        },
        header: {
          title: "",
          image: "", // or null to remove image
          url: "" // optional url to make the header text/image a link to this url
        }

        /*deployButton: {
         type:"simple",
         label:"Save",
         icon: "/absolute/path/to/deploy/button/image" // or null to remove image
         },

         menu: { // Hide unwanted menu items by id. see editor/js/main.js:loadEditor for complete list
         "menu-item-import-library": false,
         "menu-item-export-library": false,
         "menu-item-keyboard-shortcuts": false,
         "menu-item-help": {
         label: "Alternative Help Link Text",
         url: "http://example.com"
         }
         },

         userMenu: false, // Hide the user-menu even if adminAuth is enabled

         login: {
         image: "/absolute/path/to/login/page/big/image" // a 256x256 image
         }*/
    }
};

program._name = 'proximiio';
program
  .version('0.0.1');

program
  .command('start')
  .description('initialize proximi.io portal')
  .action(function(){
    console.log('starting portal...');
    // Initialise the runtime with a server and settings
    RED.init(server,settings);

    // Serve the editor UI from /orchestrator
    app.use(settings.httpAdminRoot,RED.httpAdmin);

    // Serve the http nodes UI from /api
    app.use(settings.httpNodeRoot,RED.httpNode);

    server.listen(8000);

    // Start the runtime
    RED.start();

    open('http://localhost:8000');
});

program.parse(process.argv);

if (!program.args.length) {
  program.help()
}
