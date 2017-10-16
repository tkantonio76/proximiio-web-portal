// import Leaflet from 'leaflet';

class Icon {
  constructor(options) {
    this.options = typeof options == 'String' ? JSON.parse(options) : options;
    // this.icon = L.icon(this.options);
  }
}

export default Icon;
