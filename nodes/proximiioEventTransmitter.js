var firebase = require('firebase');

module.exports = function(RED) {
  function ProximiioEventTransmitter(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    this.status({fill:"yellow",shape:"ring",text:"waiting"});

    this.sentCount = 0;
    this.totalCount = 0;

    this.on('input', function(data) {
      var inputEventId = data._proximi_id;
      var visitorId = data._proximi_visitor_id;
      if (typeof inputEventId != 'undefined') {
        var update = {};
        update[inputEventId] = data;
        node.totalCount++;
        node.status({fill:"red",shape:"ring",text:"transmitting" });
        var fbRef = RED.settings.proximiio.organization.eventBusRef + '/output/' + visitorId;
        var ref = new Firebase(fbRef);
        ref.update(update, function(error) {
          if (error) {
            console.log('error', error);
          } else {
            node.sentCount++;
            node.status({fill:"yellow",shape:"ring",text:"waiting (" + node.sentCount + "/" + node.totalCount  + ")"});
          }
        });
     
        // mark processed
        var fbInputRef = new Firebase(RED.settings.proximiio.organization.eventBusRef + '/proximity/' + inputEventId); 
        var processed = {}; 
        fbInputRef.update({ processed: true }, function(error) { if (error) { console.log('error', error); } });
      }
    });

    this.on('close', function(done) { 
      done() 
    });

    return this;
  }

  RED.nodes.registerType("proximiio-event-transmitter", ProximiioEventTransmitter);
};
