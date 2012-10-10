


// http://narmaste.se/Map/JsonQuery?q=brevlada&lng=17.271347045898455&lat=59.23474362209861


function MapCtrl($scope, $http){
  $scope.pois = ['poi1', 'poi2'];
  $scope.query = 'brevlada';
  $scope.position = undefined;

  $scope.flatStyle = undefined;
  $scope.mapUrl = undefined;

  delete $http.defaults.headers.common['X-Requested-With'];

  var poiUrl = 'http://narmaste.se/Map/JsonQuery?q={query}&lng={lng}&lat={lat}';
  var mapUrl = "https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&scale=2&size=640x640&maptype=terrain&sensor=true";
      
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


  compass.onHeadingChange = function(heading){
    console.log(heading);
    // bind();
  };
  compass.onPositionChange = function(position){
    console.log(position);
    $scope.position = position;
  };


  function bind(){
    if (!$scope.position)
      return;

    $http.get(poiUrl.replace('{query}', $scope.query).replace('{lng}', $scope.position.lng).replace('{lat}', $scope.position.lat))
    .success(function(data){

      data = data.map(function(poi){
        poi.x = 640 + ( poi.Position.Longitude - $scope.position.lng ) * (zoomLevelScales[$scope.zoom] / 10);
        poi.y = 640 - ( poi.Position.Latitude - $scope.position.lat ) * (zoomLevelScales[$scope.zoom] / 10);

        poi.style = 'left:' + Math.round(poi.x) + "px; top:" + Math.round(poi.y) + "px";

        return poi;
      });

      console.log('data', data);
      $scope.pois = data;
    });
  }
}

// TODO: get this via api instead
var zoomLevelScales = {
  20 : 1128.497220,
  19 : 2256.994440,
  18 : 4513.988880,
  17 : 9027.977761,
  16 : 18055.955520,
  15 : 36111.911040,
  14 : 72223.822090,
  13 : 144447.644200,
  12 : 288895.288400,
  11 : 577790.576700,
  10 : 1155581.153000,
  9  : 2311162.307000,
  8  : 4622324.614000,
  7  : 9244649.227000,
  6  : 18489298.450000,
  5  : 36978596.910000,
  4  : 73957193.820000,
  3  : 147914387.600000,
  2  : 295828775.300000,
  1  : 591657550.500000
};
