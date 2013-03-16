var MERCATOR_RANGE = 256;

function bound(value, opt_min, opt_max) {
  if (opt_min !== null) value = Math.max(value, opt_min);
  if (opt_max !== null) value = Math.min(value, opt_max);
  return value;
}

function degreesToRadians(deg) {
  return deg * (Math.PI / 180);
}

function radiansToDegrees(rad) {
  return rad / (Math.PI / 180);
}

function MercatorProjection() {
  this.pixelOrigin_ = {x: MERCATOR_RANGE / 2, y: MERCATOR_RANGE / 2};
  this.pixelsPerLonDegree_ = MERCATOR_RANGE / 360;
  this.pixelsPerLonRadian_ = MERCATOR_RANGE / (2 * Math.PI);
}

MercatorProjection.prototype.fromLatLngToPoint = function(latLng, opt_point) {
  var point = opt_point || {x:0, y:0};

  var origin = this.pixelOrigin_;
  point.x = origin.x + latLng.lng * this.pixelsPerLonDegree_;
  // NOTE(appleton): Truncating to 0.9999 effectively limits latitude to
  // 89.189.  This is about a third of a tile past the edge of the world tile.
  var siny = bound(Math.sin(degreesToRadians(latLng.lat)), -0.9999, 0.9999);
  point.y = origin.y + 0.5 * Math.log((1 + siny) / (1 - siny)) * -this.pixelsPerLonRadian_;
  return point;
};

MercatorProjection.prototype.fromPointToLatLng = function(point) {
  var origin = this.pixelOrigin_;
  var lng = (point.x - origin.x) / this.pixelsPerLonDegree_;
  var latRadians = (point.y - origin.y) / -this.pixelsPerLonRadian_;
  var lat = radiansToDegrees(2 * Math.atan(Math.exp(latRadians)) - Math.PI / 2);
  return {lat: lat, lng: lng};
};

//pixelCoordinate = worldCoordinate * Math.pow(2,zoomLevel)