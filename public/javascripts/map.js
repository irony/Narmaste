var projection = new MercatorProjection(640);
var player = new Track('/audio/TrackingDevice.mp3', 3, 2000, 7000);

// http://narmaste.se/Map/JsonQuery?q=brevlada&lng=17.271347045898455&lat=59.23474362209861
function MapCtrl($scope, $http){
  $scope.allPois = [];
  $scope.pois = [];
  $scope.query = undefined;
  $scope.position = undefined;
  $scope.heading = 0;
  $scope.averageHeading = 0;
  $scope.distance = undefined;
  $scope.bearing = undefined;

  $scope.flatStyle = undefined;
  $scope.mapUrl = undefined;

  // Toggle UI
  $scope.menuOpen = true;
  $scope.popupOpen = false;
  $scope.showTarget = false;
  $scope.showStationInfo = false;

  $scope.types = {"mataffär":"icon-shopping-cart"};

  console.log($scope);

  delete $http.defaults.headers.common['X-Requested-With'];

  var poiUrl = 'api/poi?q={query}&lng={lng}&lat={lat}';
  $scope.key = 'AIzaSyCxnLwfu0GSgTgFTjxQeV4_13jlmuMSTfU';
  var mapUrl = "https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&scale=2&size=640x640&maptype=terrain&sensor=true&key=" + $scope.key;
  var compass = new Compass();

  var scale = 20000;
  $scope.zoom = 15;

  $scope.startTracker = function(poi, open){
    if (!open && $scope.pois.length) {
      $scope.trackingPoi = poi;
    } else {
      $scope.trackingPoi = null;
    }
  };

  $scope.updateQuery = function(type) {
    $scope.query = type;
    //$scope.menuOpen = false;
  };

  $scope.$watch('query', function(){
    console.log('queryChange');
    $scope.pois = [];
    bind();
  });

  $scope.mapClick = function(event){
    console.log(event);
  };

  $scope.$watch('position', function(){

    
    if ($scope.position) {
      var center = projection.fromLatLngToPoint($scope.position);

      scale = Math.pow(2, $scope.zoom);
     
      var transformMatrix = [
      //{x:-1, y:-1},
      //{x: 0, y:-1},
      //{x: 1, y:-1},
      //{x:-1, y: 0},
      {x: 0, y: 0},
      //{x: 1, y: 0},
      //{x:-1, y: 1},
      //{x: 0, y: 1},
      //{x: 1, y: 1},
      ];
      $scope.maps = transformMatrix.map(function(transform){
        
        var point = {
          x : center.x + transform.x * 256,
          y : center.y + transform.y * 256
        };
        var position = projection.fromPointToLatLng(point);
        return {
          point:{
            x:Math.floor(point.x),
            y:Math.floor(point.y)
          },
          url : mapUrl.replace('{lat}', position.lat).replace('{lng}', position.lng).replace('{zoom}', $scope.zoom || 12)
        };
      });
    }
    bind();
  });

  var beepTimer = null;
  var lastBearing = null;
  var rotate = null;

  $scope.$watch('bearing', function(bearing) {
    $scope.bearing = bearing;
  });

  var lastHeadings = [];
  compass.onHeadingChange = function(heading){
    
    lastHeadings.unshift(heading);
    lastHeadings = lastHeadings.slice(0,5);

    $scope.averageHeading = Math.floor(lastHeadings.reduce(function(a, b){
      return a + b;
    }) / lastHeadings.length);

    if ( $scope.averageHeading !== $scope.heading){

      $scope.heading = Math.round($scope.averageHeading);
      if ($scope.trackingPoi){
        $scope.bearing = compass.getBearingDelta({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude});
        $scope.distance = compass.getDistanceTo({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude});
        
        $scope.$apply(function() { $scope.bearing = $scope.bearing});
        $scope.$apply(function() { $scope.distance = Math.round($scope.distance * 1000)});

        if (!lastBearing || Math.abs(lastBearing - $scope.bearing) > 3) // ignore small changes
        {
          lastBearing = $scope.bearing;
          if (Math.abs(heading) > 90) player.play(0); // silent?
          else if (Math.abs(heading) > 40) player.play(0);
          else if (Math.abs(heading) > 20) player.play(1);
          else player.play(2);
        }

      }

      $scope.allPois.map(function(poi){
        poi.bearing = Math.floor((compass.getBearingDelta({lat: poi.Position.Latitude, lng: poi.Position.Longitude}) % 360)) ;
        poi.distance = Math.floor(compass.getDistanceTo({lat: poi.Position.Latitude, lng: poi.Position.Longitude}) * 1000);
        poi.transform = "translateZ(50px) rotateX(-90deg) rotateY(" + -heading + "deg) ";
        return poi;
      });

      $scope.pois = $scope.allPois.sort(function(a,b){
        return Math.round((Math.abs(a.bearing) - Math.abs(b.bearing)) / 90) * 90;
      }).slice(0, 5).sort(function(a,b){
        return a.distance - b.distance;
      });

      if ($scope.bearing < 25 && $scope.bearing > -25) {
        $scope.showTarget = true;
      }
      else {
        $scope.showTarget = false;
      }
    }

  };

  compass.onPositionChange = function(position){
    $scope.position = position;
    
    if ($scope.trackingPoi){
      $scope.distance = compass.getDistanceTo({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude}) * 1000;
      $scope.bearing = compass.getBearingTo({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude});
    }
  };

  function bind(){
    // only update if we have actually moved
    if (!$scope.position)
      return;

    scale = Math.pow(2, $scope.zoom);
    var center = projection.fromLatLngToPoint($scope.position);

    $http.get(poiUrl.replace('{query}', $scope.query).replace('{lng}', $scope.position.lng).replace('{lat}', $scope.position.lat))
    .success(function(data){


      if(data[0].Name.indexOf('Tunnelbana') >= 0 || data[0].Name.indexOf('T-bana') >= 0) {
            $http.get('/api/stationInfo?q=' + data[0].Name.replace('T-bana', '')).success(function(departures) {
              $scope.metros = departures.Departure.Metros.Metro;
            });
        $scope.showStationInfo = true;
      }
      else {
        $scope.showStationInfo = false;
      }

      data = data.map(function(poi){
        var point = projection.fromLatLngToPoint({lng:poi.Position.Longitude, lat: poi.Position.Latitude});

        var pixelOffset = {
          x: Math.floor((center.x - point.x) * scale),
          y: Math.floor((center.y - point.y) * scale)
        };

        poi.x = pixelOffset.x + 512;
        poi.y = pixelOffset.y + 512;
        poi.style = 'left:' + Math.round(poi.x) + "px; top:" + Math.round(poi.y) + "px";

        return poi;
      });


      $scope.allPois = data;
      // $scope.pois = $scope.allPois.slice(0,5);
      compass.reset();
    });
  }
}


