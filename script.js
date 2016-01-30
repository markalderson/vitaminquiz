angular.module('VitaminQuizApp', ['ngMaterial', 'md.data.table']).
  config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/data:/);
  }]).
  controller('QuizCtrl', function ($scope, $location, $http) {
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
      var result = $scope.quiz.foods.map(function (food) {
        var answer_index = $scope.food2answer[food];
        var answer = $scope.quiz.answers[answer_index];
        var multiplier = $scope.quiz.multipliers[answer_index];
        var row = [food, answer, multiplier];
        return row.join(',');
      }).join('\n');
      return encodeURI(result);
    };
  });
