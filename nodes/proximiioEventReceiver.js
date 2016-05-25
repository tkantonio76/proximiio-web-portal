var Firebase = require('firebase');

module.exports = function(RED) {
  function ProximiioEventReceiver(config) {
    RED.nodes.createNode(this, config);

    var TAG = "[ProximiioEventReceiver]";
    var node = this;
    var fbRef = RED.settings.proximiio.organization.eventBusRef + '/proximity';
    this.status({fill:"red",shape:"ring",text:"disconnected"});

    this.ref = new Firebase(fbRef);

    this.delete_event = typeof config.delete_event != "undefined" ? config.delete_event : false;

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

    console.log(TAG, 'deleteEvent set to:', this.delete_event);

    var onChildAdded = function(eventHandle) {
      node.status({fill:"green",shape:"dot",text:"connected"});
      var event = sanitize(eventHandle.val());
      console.log(TAG,'received event', eventHandle.key());

      var sendData = function(error) {
        console.log(TAG, 'removed event', eventHandle.key());
        node.send([event, {_event: event}]);
        console.log(TAG, 'sent event to processing chain', eventHandle.key());
      };

      if (node.delete_event) {
        node.ref.child(eventHandle.key()).remove(sendData);
      } else {
        sendData();
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
