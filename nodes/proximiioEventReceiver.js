var Firebase = require('firebase');

module.exports = function(RED) {
  function ProximiioEventReceiver(config) {
    RED.nodes.createNode(this, config);

    var node = this;
    var fbRef = RED.settings.proximiio.organization.eventBusRef + '/proximity';
    this.status({fill:"red",shape:"ring",text:"disconnected"});

    this.ref = new Firebase(fbRef).limitToLast(1);

    var sanitize = function(event) {
      event._proximi_id = event.id;
      event._proximi_visitor_id = event.data.visitor_id;
      delete event.organization_id;
      delete event.id;
      delete event.createdAt;
      delete event.updatedAt;
      event.processedAt = new Date();
      return event;
    };

    var onChildAdded = function(eventHandle) {
      node.status({fill:"green",shape:"dot",text:"connected"});
      var event = sanitize(eventHandle.val());
      // ignore already processed events
      if (typeof event.processed == 'undefined' || event.processed == false) {
        node.send([event, {_event: event}]);
      }
    };

    this.ref.on('child_added', onChildAdded);

    this.on('close', function(done) {
       node.ref.off('child_added', onChildAdded);
       done();
    });

    return this;
  }

  RED.nodes.registerType("proximiio-event-receiver", ProximiioEventReceiver);
};
