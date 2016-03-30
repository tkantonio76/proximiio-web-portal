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
var proximiioInstanceRunning = false;

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

var RedHttpAdminRoot = "/red";
var RedHttpNodeRoot = "/api";

var initNodeRed = function(instance) {

  // Prevent node-red self signed certificate errors
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  // Create the settings object - see default settings.js file for other options
  var settings = {
    proximiio: instance,
    httpAdminRoot:RedHttpAdminRoot,
    httpNodeRoot: RedHttpNodeRoot,
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
  // Start the runtime
  RED.start();

  proximiioInstanceRunning = true;
};

app.redAdmin = function(req, res, next) {
  if (typeof RED != "undefined" && RED != null && typeof RED.httpAdmin != "undefined") {
    RED.httpAdmin(req, res, next);
  } else {
    res.send({success: true});
  }
};

app.redNode = function(req, res, next) {
  if (typeof RED != "undefined" && RED != null && typeof RED.httpNode != "undefined") {
    RED.httpNode(req, res, next);
  } else {
    res.send({success: true});
  }
};

app.use(RedHttpAdminRoot, app.redAdmin);
app.use(RedHttpNodeRoot, app.redNode);

app.initInstance = function(instance) {
  if (proximiioInstanceRunning) {
    if (proximiioInstance.organization.id != instance.organization.id) {
      fs.unlinkSync(proximiioInstancePath);
      process.exit(1);
      //setTimeout(function() {
      //  RED = null;
      //  RED = require('node-red-custom');
      //  proximiioInstance = instance;
      //  proximiioInstanceRunning = false;
      //  initNodeRed(proximiioInstance);
      //}, 3000);
    }
  } else {
    console.log('initInstance: not running');
    proximiioInstance = instance;
    initNodeRed(proximiioInstance);
  }
};

var postInstance = function(req, res) {
  if (typeof(req.body)!='undefined') {
    fs.writeFile(proximiioInstancePath, JSON.stringify(req.body), function(err) {
      if (err) {
        console.error(new Date(), 'unable to write instance file:', err);
        res.status(500).send({message: "Unable to write instance file"});
      } else {
        var response = {success: true};
        console.log('instance file written');
        if (proximiioInstanceRunning && proximiioInstance.organization.id != req.body.organization.id) {
          response.shutdown = true;
        }
        res.send(JSON.stringify(response));
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
  .version('0.0.35');

program
  .command('start')
  .description('initialize proximi.io portal')
  .action(function() {
    console.log('initializing portal...');

    if (proximiioInstanceExists) {
      app.initInstance(proximiioInstance);
    }

    server.listen(httpPort);
    open('http://localhost:' + httpPort);
  });

program.parse(process.argv);

if (!program.args.length) {
  program.help()
}
