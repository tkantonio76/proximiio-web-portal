#!/usr/bin/env node
var http = require('http');
var express = require('express');
var RED = require('node-red-custom');
var open = require('open');
var program = require('commander');
var InstanceController = require('./instanceController');
var fs = require('fs');
// Create an Express app
var app = express();

var homeDir = process.env.HOME || process.env.USERPROFILE;
var proximiioPath = homeDir + "/.proximiio";
var proximiioDirExists = false;
var proximiioInstanceExists = false;
var proximiioInstance = null;

try {
  if (!fs.existsSync(proximiioPath)) {
    console.log('proximiio directory: ', proximiioPath, ' does not exist yet, creating...');
    fs.mkdirSync(proximiioPath);
  }
  proximiioDirExists = true;
  if (proximiioDirExists) {
    proximiioInstanceExists = fs.existsSync(proximiioPath + '/proximiio.json');
    if (proximiioInstanceExists) {
      var instanceFile = fs.readFileSync(proximiioPath + '/proximiio.json', 'utf8');
      proximiioInstance = JSON.parse(instanceFile);
      console.log('proximi.io instance registered to: ', proximiioInstance.organization.name);
    } else {
      console.log('proximi.io instance not yet registered');
    }
  }
} catch(e) {
  if (!proximiioDirExists) {
    console.log('unable to create proximiio dir');
  }
  proximiioInstance = null;
}

if (!proximiioDirExists) {
  console.error('unable to create ~/.proximiio directory');
  process.exit();
}
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

var instanceController = new InstanceController(proximiioPath, proximiioInstance, app);
app.use('/instance', instanceController.router);

app.get('/', function(request, response) {
  response.render('dist/index.html')
});

var initNodeRed = function(instance) {
  // Create the settings object - see default settings.js file for other options
  var settings = {
    proximiio: instance,
    httpAdminRoot:"/red",
    httpNodeRoot: "/api",
    userDir: proximiioPath,
    nodesDir: __dirname + '/nodes',
    functionGlobalContext: {},    // enables global context
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
    }
  };

  RED.init(server, settings);

  // Serve the editor UI from /orchestrator
  app.use(settings.httpAdminRoot, RED.httpAdmin);

  // Serve the http nodes UI from /api
  app.use(settings.httpNodeRoot, RED.httpNode);

  // Start the runtime
  RED.start();
};

app.initInstance = function(instance) {
  proximiioInstance = instance;
  initNodeRed(proximiioInstance);
};

// Create a server
var server = http.createServer(app);

program._name = 'proximiio';
program
  .version('0.0.7');

program
  .command('start')
  .description('initialize proximi.io portal')
  .action(function() {
    console.log('starting portal...');
    // Initialise the runtime with a server and settings

    if (proximiioInstanceExists) {
      app.initInstance(proximiioInstance);
    }

    server.listen(8000);
    open('http://localhost:8000');
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help()
}
