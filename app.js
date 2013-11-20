
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


function MainCtrl($scope, socket,$location) {
	$scope.message = '';
	$scope.messages = [];
	$scope.showMessenger=false;
	$scope.userName='';
	$scope.toUser='';
	$scope.pre="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Me: </b>";
	$scope.newMessage=0;
	$scope.appname="My Messenger";
	document.title= "My Messenger";
	// Tell the server there is a new message
	$scope.broadcast = function() {
	$scope.newMessage=0;
	document.title= $scope.appname;
		if(!angular.equals($scope.toUser,'') && !angular.equals($scope.userName,'') && !angular.equals($scope.message,'')){
			socket.emit('broadcast:msg', {message: $scope.message,to:$scope.toUser,from:$scope.userName});
			$scope.messages.unshift($scope.pre+$scope.message);
			$scope.message = '';
		}
	};
	
	$scope.login=function(){
		if(!angular.equals($scope.userName,'')){
			socket.init(io.connect('http://'+$location.host()+':'+$location.port()));
			socket.emit('user:add', {userName: $scope.userName});
		
			$scope.showMessenger=true;
			
			// When we see a new msg event from the server
			socket.on($scope.userName, function (data) {
				for(var i=0;i<data.length;i++){
					$scope.messages.unshift(data[i].from+": "+data[i].message);
					$scope.newMessage++;
				}
				if($scope.newMessage>0){
				document.title= "("+$scope.newMessage+") "+$scope.appname ;
				}
				
				
			});
		}
	}
	window.onfocus=function(){
		$scope.newMessage=0;
		document.title= $scope.appname;

	}
	
}