'use strict';

// Declare app level module which depends on views, and components
var ippsApp = angular.module('ippsApp', [
  'ngRoute',
  'hospitalControllers',
  'angular.filter'
]);

ippsApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/map-view', {
        templateUrl: 'map.html',
        controller: 'HospitalMapCtrl'
      }).
      when('/list-view', {
        templateUrl: 'hospitals.html',
        controller: 'HospitalListCtrl'
      }).
      when('/list-view/:hospitalId', {
        templateUrl: 'reviews.html',
        controller: 'ReviewCtrl'
      }).
      otherwise({
        redirectTo: '/map-view'
      });
}]);