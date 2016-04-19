angular.module('VitaminQuizApp', ['ngMaterial', 'md.data.table']).
  config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/data:|mailto:/);
  }]).
  controller('QuizCtrl', function ($scope, $location, $http, $mdDialog) {
    var quiz_file = $location.search()['quiz'];
    $http.get(quiz_file).then(function (result) {
      $scope.quiz = result.data;
      $scope.food2answer = {};

      $scope.quiz.foods.forEach(function (food) {
        $scope.food2answer[food] = 0;
      });
    });

    $scope.results = function () {
      var vitamin2intake = {};
      $scope.quiz.foods.forEach(function (food, i) {
        var answer_index = $scope.food2answer[food];
        var multiplier = $scope.quiz.multipliers[answer_index];
        $scope.quiz.vitamins.forEach(function (vitamin, j) {
          var intake = vitamin2intake[vitamin];
          if (!intake) intake = 0;
          intake += $scope.quiz.intakes[i][j] * multiplier;
          vitamin2intake[vitamin] = intake;
        });
      });
      $scope.vitamin2intake = vitamin2intake;

      $scope.finished = true;
    };

    $scope.intake = function (vitamin) {
      return $scope.vitamin2intake[vitamin];
    };

    $scope.percentage = function (vitamin) {
      var i = $scope.quiz.vitamins.indexOf(vitamin);
      return $scope.vitamin2intake[vitamin] / $scope.quiz.thresholds[i] * 100;
    };

    $scope.vitaminsEnough = function () {
      return $scope.quiz.vitamins.filter(function (vitamin, i) {
        var intake = $scope.vitamin2intake[vitamin];
        var threshold = $scope.quiz.thresholds[i];
        return intake >= threshold;
      });
    };

    $scope.vitaminsNotEnough = function () {
      return $scope.quiz.vitamins.filter(function (vitamin, i) {
        var intake = $scope.vitamin2intake[vitamin];
        var threshold = $scope.quiz.thresholds[i];
        return intake < threshold;
      });
    };

    $scope.exportAsCsv = function () {
      var result = '';
      var not_enough = $scope.vitaminsNotEnough();
      if (not_enough.length > 0) {
        result += 'Nutrients you don\'t get enough of\n';
        result += not_enough.join('\n');
        result += '\n'
      }
      result += 'Your answers\n';
      result += $scope.quiz.foods.map(function (food) {
        var answer_index = $scope.food2answer[food];
        var answer = $scope.quiz.answers[answer_index];
        var multiplier = $scope.quiz.multipliers[answer_index];
        var row = [food, answer, multiplier];
        return row.join(',');
      }).join('\n');
      return encodeURI(result);
    };

    $scope.openResultsDialog = function ($event) {
      $mdDialog.show({
        controller: 'GetResultCtrl',
        templateUrl: 'results_dialog.html',
        locals: { result: $scope.exportAsCsv() },
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose:true,
        fullscreen: true
      });
    };
  }).
  controller('GetResultCtrl', function ($scope, $mdDialog, result) {
    $scope.result = result;

    $scope.dismiss = function () {
      $mdDialog.cancel();
    };

    $scope.emailCheck = function () {
      return !$scope.email || !$scope.email.includes('@');
    };
  });
