import Platform from './platform';

class IosPlatform extends Platform {

  constructor(window, document) {
    super(window, document);
    this.handlers = window.webkit.messageHandlers;
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
    this.fire('onMapReady', { id: map.id });
  }

  ready() {
    super.ready();
    this.fire('onPlatformReady', 'ready');
  }

  // ios specific methods

  fire(handler, message) {
    if (this.handlerPresent(handler)) {
      this.handlers[handler].postMessage(message);
    }
  }

  handlerPresent(handler) {
    const result = typeof window.webkit.messageHandlers[handler] !== 'undefined';
    return result;
  }

}

export default IosPlatform;
