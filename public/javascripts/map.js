var projection = new MercatorProjection(256);

// http://narmaste.se/Map/JsonQuery?q=brevlada&lng=17.271347045898455&lat=59.23474362209861
function MapCtrl($scope, $http){
  $scope.pois = ['poi1', 'poi2'];
  $scope.query = undefined;
  $scope.position = undefined;
  $scope.heading = undefined;

  $scope.flatStyle = undefined;
  $scope.mapUrl = undefined;

  // Toggle UI
  $scope.menuOpen = false;
  $scope.popupOpen = false;

  console.log($scope);

  delete $http.defaults.headers.common['X-Requested-With'];

  var poiUrl = 'api/poi?q={query}&lng={lng}&lat={lat}';
  var key =   'AIzaSyCxnLwfu0GSgTgFTjxQeV4_13jlmuMSTfU';
  var mapUrl = "https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&scale=2&size=256x256&maptype=terrain&sensor=true&style=feature:all%7Csaturation:-100%7Cweight:0.8&style=feature:water%7Clightness:90&key=" + key;
  var compass = new Compass();

  var scale = 20000;
  $scope.zoom = 15;

  $scope.updateQuery = function(type) {
    $scope.query = type;
    $scope.menuOpen = false;
  };

  $scope.$watch('query', function(){
    console.log('queryChange');
    bind();
  });

  $scope.$watch('position', function(){

    if ($scope.position) {
      var center = projection.fromLatLngToPoint($scope.position);

     
      
      console.log('center', center);

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
      $scope.maps = transformMatrix.map(function(transform){
        
        var point = {
          x : center.x + ((transform.x * 256) / scale),
          y : center.y + ((transform.y * 256) / scale)
        };
        
        var position = projection.fromPointToLatLng({x:point.x,y:point.y});
        return {
          point:{
            x:Math.floor(center.x + transform.x * 256),
            y:Math.floor(center.y + transform.y * 256)
          },
          url : mapUrl.replace('{lat}', position.lat).replace('{lng}', position.lng).replace('{zoom}', $scope.zoom || 12)
        };
      });
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

    scale = Math.pow(2, $scope.zoom);
    var center = projection.fromLatLngToPoint($scope.position);

    $http.get(poiUrl.replace('{query}', $scope.query).replace('{lng}', $scope.position.lng).replace('{lat}', $scope.position.lat))
    .success(function(data){
      data.push({Id: 'you', Position : {lng : $scope.position.lng, lat:$scope.position.lat}, Name: 'You', IconUrl:'/images/arrow_down.png'});
      data = data.map(function(poi){
        var point = projection.fromLatLngToPoint({lng:poi.Position.Longitude, lat: poi.Position.Latitude});

        var pixelOffset = {
          x: Math.floor((center.x - point.x) * scale),
          y: Math.floor((center.y - point.y) * scale)
        };

        console.log(pixelOffset);

        poi.x = pixelOffset.x + 256 * 2;
        poi.y = pixelOffset.y + 256 * 2;
        poi.style = 'left:' + Math.round(poi.x) + "px; top:" + Math.round(poi.y) + "px";

        return poi;
      });


      $scope.pois = data;
      console.log($scope.pois);
    });
  }
}



