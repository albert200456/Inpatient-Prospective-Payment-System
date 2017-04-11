var ippsControllers = angular.module('hospitalControllers', ['uiGmapgoogle-maps']);

function dropMarkers($scope) {
	$scope.markers = [];
	var gc = new google.maps.Geocoder();
	for (var i = 0; i < $scope.hospitals.length; i++) {
		var hospital = $scope.hospitals[i];
		var address = hospital.street_address+hospital.city+hospital.state+hospital.zip_code;
		// convert address to GPS coordinates
		gc.geocode({address: address}, function(hospital) {
			return(function(results, status) {
				if (status === google.maps.GeocoderStatus.OK) {
					var gps_coordinate = results[0].geometry.location;
					if (gps_coordinate) {
						// set up markers
						var marker = new google.maps.Marker({id:hospital.provider_id, latitude: gps_coordinate.lat(), longitude: gps_coordinate.lng(), name:hospital.name, street_address:hospital.street_address, postal_address:hospital.city+" "+hospital.state+" "+hospital.zip_code, acc:"Average covered charges: "+hospital.average_covered_charges, atp:"Average total payments: "+hospital.average_total_payments, amp:"Average medicare payments: "+hospital.average_medicare_payments});
						$scope.markers.push(marker);
						// console.log(hospital.provider_id +" "+ hospital.name);
					}
				} else {
					console.log("Geocode was not successful for the following reason: " + status);
				}
				// $scope.markerCluster = new MarkerClusterer($scope.map, $scope.markers);
				$scope.$apply();
			});
		}(hospital));
	}
	return $scope;
}
function updateUserGeoloc($scope) {
	// get user geolocation
	$scope.showPosition = function (position) {
		$scope.user_lat = position.coords.latitude;
		$scope.user_lng = position.coords.longitude;
		$scope.map.center.latitude = $scope.user_lat;
		$scope.map.center.longitude= $scope.user_lng;
		var user_marker = new google.maps.Marker({id:0, latitude:$scope.user_lat, longitude:$scope.user_lng});
		$scope.user_marker.push(user_marker);
		$scope.$apply();
	}
	$scope.showError = function (error) {
		$scope.error = "Geolocation error."
		$scope.$apply();
	}
	$scope.getLocation = function () {
	  if (navigator.geolocation) {
	      navigator.geolocation.getCurrentPosition($scope.showPosition, $scope.showError);
	  } else {
	      $scope.error = "Geolocation is not supported by this browser.";
	      // alert($scope.error);
	  }
	};
	$scope.getLocation();
	// console.log($scope.map.center)
	return $scope;
}

ippsControllers.controller('HospitalMapCtrl', ['$scope', '$http', '$filter',
	function($scope, $http, $filter) {
	$http.get('ipps_stl.json').success(function(data) {
		$scope.user_lat = 39;
        $scope.user_lng = -90;
        $scope.user_marker = [];
		// enable Google map with customized style
		$scope.map = { center: { latitude: $scope.user_lat, longitude: $scope.user_lng }, zoom: 10, bounds: {}, styles: [{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"on"},{"lightness":33}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2e5d4"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#c5dac6"}]},{"featureType":"poi.park","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":20}]},{"featureType":"road","elementType":"all","stylers":[{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#c5c6c6"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#e4d7c6"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#fbfaf7"}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"on"},{"color":"#acbcc9"}]}] };
		// enable window on map
		$scope.windowOptions = {
            visible: false
        };
        $scope.onClick = function() {
            $scope.windowOptions.visible = !$scope.windowOptions.visible;
        };
        $scope.closeClick = function() {
            $scope.windowOptions.visible = false;
        };
		// get json data
		$scope.all_hospitals = data;
		$scope.category_hospitals = angular.copy($scope.all_hospitals);
		$scope.hospitals = angular.copy($scope.all_hospitals);
		$scope.DRG_selected = "Select your diagnosis category";
		$scope.$watch($scope.active, function() {
			// apply user geolocation
			$scope = updateUserGeoloc($scope);
			// apply category filtering
			$scope.category = function(DRG_selected){
				$scope.category_hospitals = $filter('filter')($scope.all_hospitals, DRG_selected);
				$scope.hospitals = $scope.category_hospitals;
				$scope.DRG_selected = DRG_selected;
				// drop markers
				$scope = dropMarkers($scope);
			};
			$scope.selectedItem = "Filter by price range";
			$scope.accFilter = function(selection, max, min){
				$scope.selectedItem = selection;
				$scope.hospitals = [];
				var numMax = Number(max);
				var numMin = Number(min);
				angular.forEach($scope.category_hospitals, function(value){
					var acc = value.average_covered_charges;
					var numACC = Number(acc.replace(/[^0-9\.]+/g,""));
					if(numACC <= numMax && numACC >= numMin){
						$scope.hospitals.push(value);
					}
				});
				$scope = dropMarkers($scope);
			};
			$scope.atpFilter = function(selection, max, min){
				$scope.selectedItem = selection;
				$scope.hospitals = [];
				var numMax = Number(max);
				var numMin = Number(min);
				angular.forEach($scope.category_hospitals, function(value){
					var atp = value.average_total_payments;
					var numATP = Number(atp.replace(/[^0-9\.]+/g,""));
					if(numATP < numMax && numATP > numMin){
						$scope.hospitals.push(value);
					}
				});
				$scope = dropMarkers($scope);
			};
			$scope.ampFilter = function(selection, max, min){
				$scope.selectedItem = selection;
				$scope.hospitals = [];
				var numMax = Number(max);
				var numMin = Number(min);
				angular.forEach($scope.category_hospitals, function(value){
					var amp = value.average_medicare_payments;
					var numAMP = Number(amp.replace(/[^0-9\.]+/g,""));
					if(numAMP < numMax && numAMP > numMin){
						$scope.hospitals.push(value);
					}
				});
				$scope = dropMarkers($scope);
			};
		}, true);
	});
}]);

ippsControllers.controller('HospitalListCtrl', ['$scope', '$http', '$filter', function($scope, $http, $filter) {
	$http.get('ipps_stl.json').success(function(data) {
		$scope.all_hospitals = data;
		$scope.category_hospitals = data;
		$scope.hospitals = data;
		$scope.DRG_selected = "Select your diagnosis category";
		// split strings
		$scope.split = function(data){
			data = data.toString();
			var data1 = (data.split(' ')[0]);
			$scope.splitData = data1;
		};
		// categorize DRG groups
		$scope.category = function(DRG_selected){
			$scope.category_hospitals = $filter('filter')($scope.all_hospitals, DRG_selected);
			$scope.hospitals = $scope.category_hospitals;
			$scope.DRG_selected = DRG_selected;
		};
		// price filtering
		$scope.selectedItem = "Filter by price range";
		$scope.accFilter = function(selection, max, min){
			$scope.selectedItem = selection;
			$scope.hospitals = [];
			var numMax = Number(max);
			var numMin = Number(min);
			angular.forEach($scope.category_hospitals, function(value){
				var acc = value.average_covered_charges;
				var numACC = Number(acc.replace(/[^0-9\.]+/g,""));
				if(numACC <= numMax && numACC >= numMin){
					$scope.hospitals.push(value);
				}
			});
		};
		$scope.atpFilter = function(selection, max, min){
			$scope.selectedItem = selection;
			$scope.hospitals = [];
			var numMax = Number(max);
			var numMin = Number(min);
			angular.forEach($scope.category_hospitals, function(value){
				var atp = value.average_total_payments;
				var numATP = Number(atp.replace(/[^0-9\.]+/g,""));
				if(numATP < numMax && numATP > numMin){
					$scope.hospitals.push(value);
				}
			});
		};
		$scope.ampFilter = function(selection, max, min){
			$scope.selectedItem = selection;
			$scope.hospitals = [];
			var numMax = Number(max);
			var numMin = Number(min);
			angular.forEach($scope.category_hospitals, function(value){
				var amp = value.average_medicare_payments;
				var numAMP = Number(amp.replace(/[^0-9\.]+/g,""));
				if(numAMP < numMax && numAMP > numMin){
					$scope.hospitals.push(value);
				}
			});
		};
    });
}]);

ippsControllers.controller('ReviewCtrl', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {
	$http.get('ipps_stl.json').success(function(data) {
		$scope.all_hospitals = data;
		$scope.hospitals = [];
		$scope.reviews = [];
		angular.forEach($scope.all_hospitals, function(value){
			var data = value.DRG_definition;
			if($routeParams.hospitalId == value.provider_id+"-"+(data.split(' ')[0])){
				$scope.hospitals.push(value);
			}
		});
		$scope.add_review = function(){
			$scope.reviews.push({
				username: $scope.username,
				rating: $scope.rating,
				review: $scope.review
			});
			$scope.username = '';
			$scope.rating = '';
			$scope.review = '';
		};
	});
}]);
