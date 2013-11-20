
var app = angular.module('myApp', []);
// We define the socket service as a factory so that it
// is instantiated only once, and thus acts as a singleton
// for the scope of the application.
app.factory('socket', function ($rootScope) {
	var socket = '';
	return {
		init: function(sock){
		socket=sock;
		},
		on: function (eventName, callback) {
			socket.on(eventName, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function (eventName, data, callback) {
			socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
});


function MainCtrl($scope, socket) {
	$scope.message = '';
	$scope.messages = [];
	$scope.showMessenger=false;
	$scope.userName='';
	$scope.toUser='';
	
	// Tell the server there is a new message
	$scope.broadcast = function() {
		if(!angular.equals($scope.toUser,'') && !angular.equals($scope.userName,'') && !angular.equals($scope.message,'')){
			socket.emit('broadcast:msg', {message: $scope.message,to:$scope.toUser,from:$scope.userName});
			$scope.messages.push("Me: "+$scope.message);
			$scope.message = '';
		}
	};
	
	$scope.login=function(){
		if(!angular.equals($scope.userName,'')){
			socket.init(io.connect('http://localhost:2000'));
			socket.emit('user:add', {userName: $scope.userName});
		
			$scope.showMessenger=true;
			
			// When we see a new msg event from the server
			socket.on($scope.userName, function (data) {
				for(var i=0;i<data.length;i++){
					$scope.messages.push(data[i].from+": "+data[i].message);
				}
			});
		}
	}
}