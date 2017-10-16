import uuid from 'uuid';
import Location from './location';
import Point from './point';
import polyFetch from 'whatwg-fetch';
import { Promise as ES6Promise } from 'es6-promise-polyfill';
import MapBox from 'mapbox-gl';
import MapboxDirections from 'mapbox-gl-directions';
import axios from 'axios';
import _ from 'lodash';
import PitchToggle from './pitch_toggle';
import moment from 'moment';
import Style from './style.json';

class Map {

  constructor(platform, config) {
    this.id = uuid.v4();
    this.platform = platform;
    this.config = config;
    this.div = 'map';
    this.tileLayers = [];
    this.locationTracking = true;
    this.initialized = false;
    this.circles = {}; 
    this.firstCircleLayer = null;
    this.floorplans = {};

    this.platform.window.axios = axios;
    this.platform.window.Promise = ES6Promise;
    this.initMap();
  }

  setToken(token) {
    this.token = token;
  }

  remove() {
    this.map.remove();
    this.platform.onMapRemoved(this);
  }

  setLocationTracking(enabled) {
    this.locationTracking = enabled;
  }

  addHeat(range_from, range_to, visitor_id, cluster_options, non_cluster_options) {
    const self = this;
 
    if ((typeof range_from !== "number" || parseInt(range_from) !== range_from) &&
        (typeof range_to !== "number" || parseInt(range_to) !== range_to)) {
      console.warn("addHeat params are not unix date timestamp integers, unexpected behaviour might occur");
    }
       
    const params = {
      range_from,
      range_to,
      visitor_id,
      precision: 12,
      format: 'geojson'
    };
 
    axios.get('https://testapi.proximi.fi/custom_analytics/position_geohash', {
        params: params,
        headers: {
          authorization: 'Bearer ' + this.token
        }
      })
      .then(response => {
 
        if (self.map.getSource('proximiio')) {
          self.map.removeSource('proximiio');
        }
 
        if (self.map.getLayer('cluster-0')) {
          self.map.removeLayer('cluster-0');
          self.map.removeLayer('cluster-1');
          self.map.removeLayer('cluster-2');
          self.map.removeLayer('unclustered-points');
        }        
 
        self.map.addSource("proximiio", {
            type: "geojson",
            data: response.data,
            cluster: true,
            clusterMaxZoom: 20, // Max zoom to cluster points on
            clusterRadius: 20 // Use small cluster radius for the heatmap look
        });
 
        var layers = [
            [0, 'green'],
            [20, 'orange'],
            [200, 'red']
        ];
 
        layers.forEach(function (layer, i) {
            self.map.addLayer({
                "id": "cluster-" + i,
                "type": "circle",
                "source": "proximiio",
                "paint": {
                    "circle-color": layer[1],
                    "circle-radius": cluster_options.radius ? cluster_options.radius : 70,
                    "circle-opacity": cluster_options.opacity ? cluster_options.opacity : 1,
                    "circle-blur": cluster_options.blur ? cluster_options.blur : 1 // blur the circles to get a heatmap look
                },
                "filter": i === layers.length - 1 ?
                    [">=", "point_count", layer[0]] :
                    ["all",
                        [">=", "point_count", layer[0]],
                        ["<", "point_count", layers[i + 1][0]]]
            }, 'waterway-label');
        });
 
        self.map.addLayer({
            "id": "unclustered-points",
            "type": "circle",
            "source": "proximiio",
            "paint": {
                "circle-color": 'rgba(0,255,0,0.5)',
                "circle-radius": non_cluster_options.radius ? non_cluster_options.radius : 20,
                "circle-opacity": non_cluster_options.opacity ? non_cluster_options.opacity : 1,
                "circle-blur": non_cluster_options.blur ? non_cluster_options.blur : 1 // blur the circles to get a heatmap look
            },
            "filter": ["!=", "cluster", true]
        }, 'waterway-label');
      });    
  }

  addFloorPlan(floorPlan) {    
    if (this.initialized) {      
      const id = 'floorplan-' + floorPlan.id;
      const sourceId = 'floorplan-source-' + floorPlan.id;

      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);        
      }

      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
      
      const c = floorPlan.corners;

      const options = {
        type: 'image',
        url: floorPlan.imageUrl,
        coordinates: [c[0], c[1], c[3], c[2]]
      };

      this.map.addSource(sourceId, options);
   
      this.map.addLayer({
        id: id,
        source: sourceId,
        type: 'raster'
      }, 'directions-route-line');
            
      if (this.firstCircleLayer && typeof this._map.getLayer('directions-route-line') !== "undefined") {
        this._map.moveLayer(this.firstCircleLayer, 'directions-route-line');
      }
    }
  }

  getCenter() {
    return Location.fromLatLng(this.map.getCenter());
  }

  removeLastTileLayer() {
    const lastLayer = this.tileLayers[this.tileLayers.length - 1];
    this.map.removeLayer(lastLayer);
    this.tileLayers.pop();
  }

  setCurrentLocationMarker(location, title) {
    if (this.currentLocationMarker !== undefined) {
      this.currentLocationMarker.remove();
    }
    
    this.currentLocationMarker = this.addMarker(location, {});                

    if (this.directions) {
      this.directions.setCustomOrigin(location.lngLat);
      Proximiio.controller.map.map.moveLayer('floorplan', 'directions-route-line')
    }
  }

  geoJsonCircle(center, radiusInKm, title) {
    const points = 64;

    var coords = {
        latitude: center[1],
        longitude: center[0]
    };

    var km = radiusInKm;

    var ret = [];
    var distanceX = km/(111.320*Math.cos(coords.latitude*Math.PI/180));
    var distanceY = km/110.574;

    var theta, x, y;
    for(var i=0; i<points; i++) {
        theta = (i/points)*(2*Math.PI);
        x = distanceX*Math.cos(theta);
        y = distanceY*Math.sin(theta);

        ret.push([coords.longitude+x, coords.latitude+y]);
    }
    ret.push(ret[0]);

    return {
      "type": "geojson",      
      "data": {
        "type": "FeatureCollection",        
        "features": [{              
          "type": "Feature",
          "properties": {
            "level": 0,
            "height": 0,
            "base_height": 0,
            "color": "limegreen",
            "name": "Geofence",
            "title": title
          },
          "geometry": {
              "type": "Polygon",
              "coordinates": [ret]
          }
        }]
      }
    };
  }

  setDestination(location) {      
      this.directions.setCustomDestination(location.lngLat);
  }

  addCircle(id, location, radius, color, fillColor, opacity, title) {
    if (this.initialized) {
      const self = this;
      const sourceId = 'source-' + id;
      const layerId = 'layer-' + id;
      
      if (!this.firstCircleLayer) {
        this.firstCircleLayer = layerId;
      }

      if (this.map.getSource(sourceId)) {
        this.map.removeLayer(layerId);
        this.map.removeSource(sourceId);
      }

      const circle = this.geoJsonCircle(location.lngLat, radius / 1000, title);
      const layer = {
        "id": layerId,
        "type": "fill",
        "source": sourceId,
        "layout": {},
        "paint": {
          "fill-color": fillColor,
          "fill-opacity": opacity,
        }
      };

      this.map.addSource(sourceId, circle);
      const source = this.map.getSource(sourceId);

      this.map.addLayer(layer);

      this.map.on('click', layerId, function (e) {        
        new MapBox.Popup()
            .setLngLat(location.lngLat)
            .setHTML(title)
            .addTo(self.map);
      });        
    } 
  }

  addMarker(location, options) {
    const defaults = {
      iconSize: [78, 78],
      iconAnchor: [-36, -36],
      iconUrl: 'images/icon_bludot2x.png',
      popupText: '' 
    };

    const settings = _.merge(defaults, options);    

    const el = document.createElement('div');
    el.className = 'marker';
    el.style.width = settings.iconSize[0] + 'px';
    el.style.height = settings.iconSize[1] + 'px';
    el.style.backgroundImage = `url(${settings.iconUrl})`;
    el.style.backgroundSize = '100% 100%';

    el.addEventListener('click', function() {      
      window.alert(marker.properties.message);
    });

    // add marker to map    
    const markerOptions = {
      offset: [ settings.iconAnchor[0], settings.iconAnchor[1] ]
    };
    
    // create the popup
    var popup = new MapBox.Popup({offset: 25})
      .setHTML(settings.popupText);

    const marker = new MapBox.Marker(el, markerOptions)
      .setLngLat(location.lngLat)
      .setPopup(popup)
      .addTo(this.map);    

    return marker;
  }

  setView(location, zoom) {                
    this.map.setCenter(location.lngLat);
    if (zoom) {
      this.map.setZoom(zoom);
    }
  }

  viewReset() {
    this.platform.onMapViewReset(this);
  }

  onClick(event) {    
    if (this.directions) {
      const coords = [event.lngLat.lng, event.lngLat.lat];
      this.directions.setCustomDestination(coords);
    }
    const location = Location.fromLatLng(event.lngLat);    
    this.platform.onMapClick(this, location);
  }

  onLoad() {
    const map = Proximiio.controller.map;
    const floorDummySource = {
      type: 'image',
      url: 'file://',      
      coordinates: [[0, 0], [0,0], [0,0], [0, 0]]
    };
        
    map.directions = new MapboxDirections({});
    
    map.map.addControl(new PitchToggle({minpitchzoom: 12}));            
    map.map.addControl(map.directions, 'bottom-right');    

    map.initialized = true;
    map.platform.onMapReady(true);
  }

  get showZoomControls() {
    return this.config.showZoomControls || true;
  }

  get drawEnabled() {
    return this.config.enableDraw || false;
  }

  get draggingEnabled() {
    return this.config.dragging || true;
  }

  log(message) {
    console.log(message);
  }

  initMap() {
    const _this = this;
    this.map = new MapBox.Map({
      container: 'map',
      style: 'https://raw.githubusercontent.com/osm2vectortiles/mapbox-gl-styles/master/styles/bright-v9-cdn.json',
      token: 'no-token',
      maxZoom: 24,      
      center: [0, 0],
      zoom: 18
    });
    
    this.map.addControl(new MapBox.NavigationControl());
    
    this.map.on('click', (evt) => {
      _this.onClick(evt);
    });

    this.map.on('load', this.onLoad);    
  }

}

export default Map;
