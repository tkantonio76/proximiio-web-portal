class Platform {

  constructor(window, document) {
    this.window = window;
    this.document = document;

    this.isAndroid = typeof Android !== 'undefined';
    this.isIos = typeof window.webkit !== 'undefined' &&
                 typeof window.webkit.messageHandlers !== 'undefined';
    this.isMobile = this.isAndroid || this.isIos;
  }

  onMapClick(map, location, layerPoint, containerPoint) {
    console.log(`Platform: onMapClick(map: ${map.id},\n
      location: ${location.json},\n
      layerPoint: ${layerPoint.json},\n
      containerPoint: ${containerPoint.json})`);
  }

  onMapReady(map) {
    console.log(`Platform: onMapReady: ${map.id}`);
    this.ready();
  }

  ready() {
    console.log(`Platform: ready: ${map.id}`);
    return true;
  }

}

export default Platform;
