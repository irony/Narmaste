var projection = new MercatorProjection(256);

// http://narmaste.se/Map/JsonQuery?q=brevlada&lng=17.271347045898455&lat=59.23474362209861
function MapCtrl($scope, $http){
  $scope.pois = [];
  $scope.query = undefined;
  $scope.position = undefined;
  $scope.heading = undefined;
  $scope.distance = undefined;
  $scope.bearing = undefined;

  $scope.flatStyle = undefined;
  $scope.mapUrl = undefined;

  // Toggle UI
  $scope.menuOpen = true;
  $scope.popupOpen = false;
  $scope.showTarget = false
  $scope.showStationInfo = false;

  $scope.types = {"mataffär":"icon-shopping-cart"};

  console.log($scope);

  delete $http.defaults.headers.common['X-Requested-With'];

  var poiUrl = 'api/poi?q={query}&lng={lng}&lat={lat}';
  var key = 'AIzaSyCxnLwfu0GSgTgFTjxQeV4_13jlmuMSTfU';
  var mapUrl = "https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&scale=2&size=512x512&maptype=terrain&sensor=true&key=" + key;
  var compass = new Compass();

  var scale = 20000;
  $scope.zoom = 15;

  $scope.updateQuery = function(type) {
    $scope.query = type;
    //$scope.menuOpen = false;
  };

  $scope.$watch('query', function(){
    console.log('queryChange');
    bind();
  });

  $scope.mapClick = function(event){
    console.log(event);
  };

  $scope.$watch('position', function(){

    if ($scope.position) {
      var center = projection.fromLatLngToPoint($scope.position);
      var zoom = $scope.zoom || 12;

      var transformMatrix = [
      {x:-1, y:-1},
      {x: 0, y:-1},
      {x: 1, y:-1},
      {x:-1, y: 0},
      {x: 0, y: 0},
      {x: 1, y: 0},
      {x:-1, y: 1},
      {x: 0, y: 1},
      {x: 1, y: 1},
      ];

      var maps = transformMatrix.map(function(transform){  
        var point = {
          x : center.x + ((transform.x * 512)/1.635 / scale),
          y : center.y + ((transform.y * 512)/1.635 / scale)
        };
        
        var position = projection.fromPointToLatLng({x:point.x,y:point.y});
        console.log('position',position);
        return {
          transform : transform,
          point:{
            x:Math.floor(center.x + transform.x * 256) - 256 - 256 / 2,
            y:Math.floor(center.y + transform.y * 256) - 256
          },
          url : mapUrl.replace('{lat}', position.lat).replace('{lng}', position.lng).replace('{zoom}', zoom)
        };
      });
      $scope.maps = maps;
    }
    bind();
  });

  $scope.$watch('bearing', function(bearing) {
    $scope.bearing = bearing;
  });3

  compass.onHeadingChange = function(heading){
    $scope.heading = Math.round(heading);
    if ($scope.trackingPoi){
      $scope.bearing = compass.getBearingDelta({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude});
      $scope.distance = compass.getDistanceTo({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude});
      
      // if (Math.abs(heading) > 90) return player.play(0); // silent?
      // if (Math.abs(heading) > 40) return player.play(0);
      // if (Math.abs(heading) > 20) return player.play(1);
      // return player.play(2);

      $scope.$apply(function() { $scope.bearing = $scope.bearing});
      $scope.$apply(function() { $scope.distance = Math.round($scope.distance * 1000)});

      if ($scope.bearing < 15 && $scope.bearing > -15) {
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
      $scope.distance = compass.getDistanceTo({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude});
      // $scope.bearing = compass.getBearingTo({lat: $scope.trackingPoi.Position.Latitude, lng: $scope.trackingPoi.Position.Longitude});


    }

  };

  function bind(){
    if (!$scope.position)
      return;

    scale = Math.pow(2, $scope.zoom);
    var center = projection.fromLatLngToPoint($scope.position);

    $http.get(poiUrl.replace('{query}', $scope.query).replace('{lng}', $scope.position.lng).replace('{lat}', $scope.position.lat))
    .success(function(data){

      if (data.length) {
        $scope.trackingPoi = data[0]; // TODO: let the user choose one ;)
      }

      if($scope.query == 'Tunnelbana') {
            $http.get('/api/stationInfo?q=Liljeholmen').success(function(departures) {
              console.log(departures);
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


      $scope.pois = data;
      console.log($scope);
    });
  }
}


