var Firebase = require('firebase');

module.exports = function(RED) {
    function ProximiioEventMarker(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        this.status({fill:"yellow",shape:"ring",text:"waiting"});

        this.totalCount = 0;

        this.inputRef = new Firebase(RED.settings.proximiio.organization.eventBusRef + '/proximity');
        this.on('input', function(data) {
            if (typeof data._proximi_id != "undefined") {
              var inputEventId = data._proximi_id;
              // mark processed

              node.inputRef.child(inputEventId).update({ processed: true }, function(error) {
                if (error) {
                    node.status({fill:"red",shape:"ring",text:"error occured"});
                } else {
                    node.totalCount++;
                    node.status({fill:"yellow",shape:"ring",text:"waiting (" + node.totalCount  + ")"});
                }
              });
            }
        });

        this.on('close', function(done) {
            done();
        });

        return this;
    }

    RED.nodes.registerType("proximiio-event-marker", ProximiioEventMarker);
};
