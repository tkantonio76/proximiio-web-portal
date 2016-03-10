var request = require('request');

module.exports = function(RED) {

  function ProximiioEventReceiver(config) {
    RED.nodes.createNode(this, config);

    var node = this;

    this.resource = config.resource;
    this.resource_id = config.resource_id;
    this.status({fill:"red", shape:"ring", text:"waiting"});

    this.fetch = function(data, callback) {
      var suffix = typeof node.resource_id == "undefined" ? '' : '/' + node.resource_id;
      request.get({
        url: 'http://api.proximi.fi/core/' + node.resource + suffix,
        headers: {
          'Authorization': 'Bearer ' + RED.settings.proximiio.token
        }
      }, callback);
    };

    this.on('input', function(data) {
      node.fetch(data, function (err, response, body) {
        node.send(body);
      });
    });

    this.on('close', function(done) {
      done();
    });

    return this;
  }

  RED.nodes.registerType("proximiio-resource", ProximiioEventReceiver);

};
