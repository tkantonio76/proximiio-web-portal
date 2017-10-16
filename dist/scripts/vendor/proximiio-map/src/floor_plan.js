const _ = require('lodash');
const FLOORPLAN_PLACEHOLDER = 'images/no_floorplan_placeholder.png';

class FloorPlan {
  constructor(floorPlanId, anchors, imageUrl) {
    this.floorPlanId = floorPlanId;
    this.id = this.floorPlanId;
    const corners = typeof anchors == 'String' ? JSON.parse(anchors) : anchors;
    this.corners = _.map(corners, (corner) => [ corner.lng, corner.lat ]);
    this.imageUrl = imageUrl || FLOORPLAN_PLACEHOLDER;
  }

}

export default FloorPlan;
