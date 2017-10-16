import PlatformFactory from './platform_factory';
import Map from './map';
import Location from './location';
import Point from './point';
import FloorPlan from './floor_plan';
import Marker from './marker';
import Icon from './icon';

class Controller {

  constructor(_window, _document, options) {
    this.platform = PlatformFactory.getPlatform(_window, _document);
    this.map = new Map(this.platform, options);
  }

}

export { Controller, Location, Point, FloorPlan };

window.Proximiio = {
  Location: Location,
  Point: Point,
  FloorPlan: FloorPlan,
  Marker: Marker,
  Icon: Icon,
  controller: new Controller(window, document, {}),
};
