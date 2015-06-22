angular.module('fishbowl', [])

.directive('transition', function() {
    return {
        restrict: 'AC',
        controller: 'transitionController',
        link: function(scope, element, attrs) {

        }
    };
})
.controller('transitionController', ['$scope', '$ionicModal', 'fsmService', 'waterlineServiceProvider', function($scope, $ionicModal, fsmService, waterlineServiceProvider) {
	$scope.fsm = null;
	$scope.ws = null;
	var level = null;

    $ionicModal.fromTemplateUrl('templates/openModal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        fsmName: '',
    })
    .then(function(modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function(namespace) {

        var fsm = fsmService[namespace];
        var ws = fsm.ws;

        fsm.on('newQty', function(data) {
        	ws.setQty(data.qty);
        })

        fsm.on('goal', function(data) {
        	ws.setOpt('goal', data.goal);
        })

        $scope.transition = function(state) {
            $scope.modal.hide();
	        fsm.transition(state);
        };

        $scope.modal.show();
    };

    $scope.closeModal = function() {
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

}]);
