var Firebase = require('firebase');

module.exports = function(RED) {
  function ProximiioEventTransmitter(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    this.status({fill:"yellow",shape:"ring",text:"waiting"});

    this.sentCount = 0;
    this.totalCount = 0;

    this.outputRef = new Firebase(RED.settings.proximiio.organization.proximiioBusRef + '/output/');
    this.outputRef.authWithCustomToken(RED.settings.proximiio.organization.proximiioBusToken);

    this.onInput = function(data) {
      var inputEventId = data._proximi_id;
      var visitorId = data._proximi_visitor_id;
      if (typeof inputEventId != 'undefined' && typeof visitorId != 'undefined') {
        var update = {};
        update[inputEventId] = data;
        node.totalCount++;
        node.status({fill:"red",shape:"ring",text:"transmitting" });
        node.outputRef.child(visitorId).update(update, function(error) {
          if (error) {
            console.log('error', error);
          } else {
            node.sentCount++;
            node.status({fill:"yellow",shape:"ring",text:"waiting (" + node.sentCount + "/" + node.totalCount  + ")"});
          }
        });
      }
    };

    this.on('input', this.onInput);

    this.on('close', function(done) {
      done()
    });

    return this;
  }

  RED.nodes.registerType("proximiio-event-transmitter", ProximiioEventTransmitter);
};
