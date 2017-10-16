import Platform from './platform';

class AndroidPlatform extends Platform {

  constructor(window, document) {
    super(window, document);    
    this.ready();
  }

  onMapRemoved(map) {
    super.onMapRemoved(map);
    this.fire('onMapRemoved', { id: map.id });
  }

  onMapClick(map, location, layerPoint, containerPoint) {
    super.onMapClick(map, location, layerPoint, containerPoint);
    this.fire('onMapClick', {
      map: map.id,
      location: location.json,
      layerPoint: layerPoint.json,
      containerPoint: containerPoint.json,
    });
  }

  onMapViewReset(map) {
    super.onMapViewReset(map);
    this.fire('onMapViewReset', { id: map.id });
  }

  onMapReady(map) {
    super.onMapReady(map);
    this.fire('onMapReady', "true");
  }

  ready() {
    super.ready();
    this.fire('onPlatformReady', 'ready');
  }

  // android specific methods

  fire(handler, message) {
    const serialized = typeof message === "object" ? JSON.stringify(message) : message;
    Android[handler](message);    
  }

}

export default AndroidPlatform;
