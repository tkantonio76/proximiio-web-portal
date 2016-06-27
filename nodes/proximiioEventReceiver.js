var Firebase = require('firebase');

module.exports = function(RED) {
  function ProximiioEventReceiver(config) {
    RED.nodes.createNode(this, config);

    var TAG = "[ProximiioEventReceiver]";
    var node = this;
    this.status({fill:"red",shape:"ring",text:"disconnected"});
    console.log(RED.settings.proximiio);
    this.ref = new Firebase(RED.settings.proximiio.organization.proximiioBusRef + '/proximity/');
    this.ref.authWithCustomToken(RED.settings.proximiio.organization.proximiioBusToken);

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

      var sendData = function(error) {
        node.send([event, {_event: event}]);
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
