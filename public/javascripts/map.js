
// http://narmaste.se/Map/JsonQuery?q=brevlada&lng=17.271347045898455&lat=59.23474362209861


function MapCtrl($scope, $http){
  $scope.pois = ['poi1', 'poi2'];
  $scope.query = 'brevlåda';
  $scope.position = undefined;
  $scope.heading = undefined;

  $scope.flatStyle = undefined;
  $scope.mapUrl = undefined;

  $scope.menuOpen = false;
  $scope.popupOpen = false;

  console.log($scope);

  delete $http.defaults.headers.common['X-Requested-With'];

  var poiUrl = 'api/poi?q={query}&lng={lng}&lat={lat}';
  var mapUrl = "https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&scale=1&size=640x640&maptype=terrain&sensor=true";
      
  var compass = new Compass();

  var scale = 20000;
  $scope.zoom = 15;

  $scope.$watch('query', function(){
    console.log('queryChange');
    bind();
  });

  $scope.$watch('position', function(){
    console.log('positionChange');
    if ($scope.position) {
      $scope.mapUrl = mapUrl.replace('{lat}', $scope.position.lat).replace('{lng}', $scope.position.lng).replace('{zoom}', $scope.zoom || 12);
    }
    bind();
  });
  
  $scope.$watch('heading', function() {
    console.log('headingChange');
  });

  compass.onHeadingChange = function(heading){
    $scope.heading = Math.round(heading);
    console.log('scopeHeading', $scope.heading);
    document.getElementById('flat').style.webkitTransform = 'perspective(800px) translateZ(0) rotateX(60deg) rotateZ(' + -heading + 'deg) translate3d(0,0,1px)';
  };
  compass.onPositionChange = function(position){
    $scope.position = position;
  };

  function bind(){
    if (!$scope.position)
      return;

    var projection = new MercatorProjection(256);

    $http.get(poiUrl.replace('{query}', $scope.query).replace('{lng}', $scope.position.lng).replace('{lat}', $scope.position.lat))
    .success(function(data){
      data = data.map(function(poi){
        var point = projection.fromLatLngToPoint({lng:poi.Position.Longitude, lat: poi.Position.Latitude});
        console.log(point);
        poi.x = point.x * 2; // 2* because scale 2
        poi.y = point.y * 2;
        poi.style = 'left:' + Math.round(poi.x) + "px; top:" + Math.round(poi.y) + "px";

        return poi;
      });

      $scope.pois = data;
      console.log($scope.pois);
    });
  }
}



