#!/usr/bin/env node
var http = require('http');
var express = require('express');
var RED = require('node-red-custom');
var open = require('open');
var program = require('commander');
var fs = require('fs');

var app = express();

var homeDir = process.env.HOME || process.env.USERPROFILE;
var proximiioPath = process.env.PROXIMIIO_HOME || homeDir + "/.proximiio";
var proximiioInstancePath = proximiioPath + '/proximiio.json';
var proximiioDirExists = false;
var proximiioInstanceExists = false;
var proximiioInstance = null;

var httpPort = process.env.PORT || 8000;

try {
  if (!fs.existsSync(proximiioPath)) {
    console.log('proximiio directory: ', proximiioPath, ' does not exist yet, creating...');
    fs.mkdirSync(proximiioPath);
  }
  proximiioDirExists = true;
  if (proximiioDirExists) {
    proximiioInstanceExists = fs.existsSync(proximiioInstancePath);
    if (proximiioInstanceExists) {
      var instanceFile = fs.readFileSync(proximiioInstancePath, 'utf8');
      proximiioInstance = JSON.parse(instanceFile);
      console.log('proximi.io instance registered to:', proximiioInstance.organization.name);
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
    storageModule: require('./proximiio_red_adapter'),
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
  if (proximiioInstance != null) {
    RED.stop();
  }
  initNodeRed(proximiioInstance);
};

var postInstance = function(req, res) {
  if (typeof(req.body)!='undefined') {
    fs.writeFile(proximiioInstancePath, JSON.stringify(req.body), function(err) {
      if (err) {
        console.error(new Date(), 'unable to write instance file:', err);
      } else {
        res.send(JSON.stringify({success: true}));
        app.initInstance(req.body);
      }
    });
  } else {
    res.status(500).send({message: "Request missing body"});
  }
};
app.post('/instance', postInstance);

// Create a server
var server = http.createServer(app);

program._name = 'proximiio';
program
  .version('0.0.15');

program
  .command('start')
  .description('initialize proximi.io portal')
  .action(function() {
    console.log('initializing portal...');

    if (proximiioInstanceExists) {
      app.initInstance(proximiioInstance);
    }

    server.listen(httpPort);
    console.log('server running at port: ', httpPort);
    open('http://localhost:' + httpPort);
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help()
}
