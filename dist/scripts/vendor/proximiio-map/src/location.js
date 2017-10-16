class ProximiioLocation {

  constructor(latitude, longitude, accuracy) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = accuracy || 0;
  }

  get json() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.accuracy,
    };
  }

  get latLng() {
    return [ this.latitude, this.longitude ];
  }

  get lngLat() {
    return [ this.longitude, this.latitude ];
  }

  get latLngObject() {
    return { lat: this.latitude, lng: this.longitude };
  }

  get coordinates() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  static fromLatLng(latLng) {
    return new ProximiioLocation(latLng.lat, latLng.lng);
  }

  static fromCoordinates(latitude, longitude) {
    return new ProximiioLocation(latitude, longitude);
  }

}

export default ProximiioLocation;
