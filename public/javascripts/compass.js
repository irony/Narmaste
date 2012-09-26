function Compass(options)
{

  var self = this;

  this.heading = 0;
  this.onHeadingChange = null;
  this.onPositionChange = null;

  var ref = 0,
      logger,
      dir = 0,
      _transform = "WebkitTransform" in document.body.style ? "WebkitTransform" : "MozTransform" in document.body.style ? "MozTransform" : "msTransform" in document.body.style ? "msTransform" : false;


  if (!options || options.updatePosition) {
    navigator.geolocation.getCurrentPosition(function(position) {
      if (self.onPositionChange) {
        self.onPositionChange({lat:position.coords.latitude, lng: position.coords.longitude});
      }
    });
  }

  if (!options || options.updateHeading) {
    _transform && window.addEventListener("deviceorientation", function(e) {

        var direction, delta, heading;

        heading = self.heading;

        if (typeof e.webkitCompassHeading !== 'undefined') {
            direction = e.webkitCompassHeading;
            if (typeof window.orientation !== 'undefined') {
                direction += window.orientation;
            }
        } else {
            direction = 360 - e.alpha;
        }

        delta = Math.round(direction) - ref;
        ref = Math.round(direction);
        if (delta < -180) delta += 360;
        if (delta > 180) delta -= 360;
        dir += delta;

        self.heading = direction;
        while (heading >= 360) {
            self.heading -= 360;
        }
        while (heading < 0) {
            self.heading += 360;
        }

        // todo: add average filter here
        if (heading != self.heading && self.onHeadingChange){
          self.onHeadingChange(self.heading);
        }

    });
  }
}