/*global angular*/
'use strict';
angular.module('ionicApp', ['ionic', 'ionic-material', 'waterline', 'fishbowl', 'fsm'])

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('eventmenu', {
      url: '/event',
      abstract: true,
      templateUrl: 'templates/event-menu.html'
    })
    .state('eventmenu.home', {
      url: '/home',
      views: {
        'menuContent' :{
          templateUrl: 'templates/home.html'
        }
      }
    })
    .state('eventmenu.aquarium', {
      url: '/aquarium',
      views: {
        'menuContent' :{
          templateUrl: 'js/fish/fish.html',

        }
      }
    })
    .state('eventmenu.fish', {
      url: '/fish',
      views: {
        'menuContent' :{
          templateUrl: 'templates/fish.html',
        }
      }
    })
    .state('eventmenu.attendees', {
      url: '/attendees',
      views: {
        'menuContent' :{
          templateUrl: 'templates/attendees.html'
        }
      }
    });

  $urlRouterProvider.otherwise('/event/home');
})

.controller('MainCtrl', function($scope, ionicMaterialInk, ionicMaterialMotion, $ionicSideMenuDelegate, $timeout) {

  $timeout(function(){
    ionicMaterialInk.displayEffect();
      ionicMaterialMotion.ripple();
  },0);

  $scope.jugsInitialized = false;

  $scope.toggleLeft = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };
});

