angular.module('VitaminQuizApp', ['ngMaterial', 'md.data.table']).
  controller('QuizCtrl', function ($scope, $http) {
    $http.get('quiz.json').then(function (result) {
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
      if ($scope.finished) {
        return $scope.quiz.vitamins.filter(function (vitamin, i) {
          var intake = $scope.vitamin2intake[vitamin];
          var threshold = $scope.quiz.thresholds[i];
          return intake >= threshold;
        });
      }
    };

    $scope.vitaminsNotEnough = function () {
      if ($scope.finished) {
        return $scope.quiz.vitamins.filter(function (vitamin, i) {
          var intake = $scope.vitamin2intake[vitamin];
          var threshold = $scope.quiz.thresholds[i];
          return intake < threshold;
        });
      }
    };
  });
