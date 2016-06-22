define(['angular', 'jquery'], function (angular, $) {

  var SignUpController = function ($scope, $http, $window, vcRecaptchaService) {
    $scope.widgetId = null;

    $scope.reset = function (form) {
      if (form) {
        form.$setPristine();
        form.$setUntouched();
      }
    };

    $scope.reset();

    $scope.setWidgetId = function (widgetId) {
      $scope.widgetId = widgetId;
    };

    $scope.processForm = function () {
      $(".alert").addClass('hidden');

      var req = {
        method: 'POST',
        url: '/account/signup',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        data: {
          reference: $scope.account.ureference || "",
          name: $scope.account.uname,
          email: $scope.account.uemail,
          company: $scope.account.ucompany,
          temporary_password: $scope.account.temporary_password,
          password: $scope.account.upassword,
          confirmation: $scope.account.confirmation,
          'g-recaptcha-response': $scope.account.recaptcha
        }
      };
      $http(req)
        .then(function successCallback(response) {
          if (response.data.verified) {
            $window.location.href = response.data.redirect + '?email=' + response.data.email;
          } else {
            $("#form_container").addClass('hidden');
            $("#alert-info").removeClass('hidden').text(response.data.message);
          }
        }, function errorCallback(response) {
          vcRecaptchaService.reload($scope.widgetId);
          $("#alert-error").removeClass('hidden').text(response.data.message);
        });
    };
  };

  SignUpController.$inject = ['$scope', '$http', '$window', 'vcRecaptchaService'];

  return SignUpController;

});