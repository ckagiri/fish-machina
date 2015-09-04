'use strict';
angular.module('fishbowl', [])

.directive('transition', function() {
    return {
        restrict: 'AC',
        controller: 'transitionController',
        link: function(scope, element, attrs) {

        }
    };
})
.controller('transitionController', ['$scope', '$ionicModal', '$ionicPopup', 'fsmService',  function($scope, $ionicModal, $ionicPopup, fsmService) {
    $scope.fsm = null; 
    $scope.ws = null;
    var level = null;

    $scope.openDialog = function(namespace) {
        var fsm = fsmService[namespace];
        var ws = fsm.ws;    

        fsm.on('newQty', function(data) {
            ws.setQty(data.qty);
        })

        fsm.on('goal', function(data) {
            ws.setOpt('goal', data.goal);
        })

        $scope.transition = function(state) {
            fsm.transition(state);
            myPopup.close();
        };

        var myPopup = $ionicPopup.show({
            title: (namespace === 'jug3' ? '3' : '5') + ' GALLON BOWL',
            subTitle: 'CLICK ON ACTION TO TAKE',
            templateUrl: 'templates/openPopover.html',
            scope: $scope,
            buttons: [
            {   
                text: '<b>Cancel</b>'
            },]

        });
        myPopup.then(function(res) {
          console.log('Tapped!', res);
        });
    }

}]);
