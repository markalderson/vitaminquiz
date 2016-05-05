angular.module('VitaminQuizApp', ['ngMaterial', 'md.data.table', 'chart.js']).
  config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/data:|mailto:/);
  }]).
  controller('QuizCtrl', function ($scope, $q, $location, $http, $mdDialog) {
    var quiz_file = $location.search()['quiz'];
    $http.get(quiz_file).then(function (result) {
      $scope.quiz = result.data;
      $scope.quiz.available_foods = angular.copy($scope.quiz.foods);
      $scope.quiz.available_foods_intakes = angular.copy($scope.quiz.intakes);
      $scope.quiz.available_categories =
        Object.keys($scope.quiz.categories);
      $scope.quiz.selected_categories =
        Object.keys($scope.quiz.categories);
      $scope.food2answer = {};

      $scope.quiz.foods.forEach(function (food) {
        $scope.food2answer[food] = 0;
      });
    });

    $scope.$watch('quiz', function () {
      window.setTimeout(function () {
        var headers = document.querySelectorAll('#sticky-header > div');
        var header, column;
        var i;
        for (i = 0; i < headers.length; i++) {
          header = headers[i];
          column = document.querySelectorAll('tr:first-child td')[i];
          header.style.width = (column.offsetWidth - 15) + 'px';
          header.style.padding = 5 + 'px';
        }
      }, 100);
    }, true);

    $scope.addFood = function ($event) {
      $mdDialog.show({
        controller: 'AddFoodCtrl',
        templateUrl: 'add_food.html',
        locals: { nutrients: $scope.quiz.vitamins },
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose:true,
        fullscreen: true
      }).then(function (result) {
        $scope.quiz.foods.push(result.name);
        $scope.quiz.intakes.push(result.intakes);
        $scope.quiz.available_foods.push(result.name);
        $scope.quiz.available_foods_intakes.push(result.intakes);
      });
    };

    $scope.selectFoods = function ($event) {
      $mdDialog.show({
        controller: 'SelectFoodsCtrl',
        templateUrl: 'select_foods.html',
        parent: angular.element(document.body),
        locals: {
          foods: $scope.quiz.foods,
          available_foods: $scope.quiz.available_foods
        },
        targetEvent: $event,
        clickOutsideToClose:true,
        fullscreen: true
      }).then(function (selected) {
        $scope.quiz.foods = $scope.quiz.available_foods.filter(function (food) {
          return selected[food];
        });
        $scope.quiz.intakes = $scope.quiz.available_foods_intakes.filter(
          function (intakes, i) {
            var food = $scope.quiz.available_foods[i];
            return selected[food];
          }
        );
      });
    };

    $scope.customThresholds = function ($event) {
      $mdDialog.show({
        controller: 'CustomThresholdsCtrl',
        templateUrl: 'custom_thresholds.html',
        locals: {
          nutrients: $scope.quiz.vitamins,
          thresholds: $scope.quiz.thresholds
        },
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose:true,
        fullscreen: true
      }).then(function (thresholds) {
        $scope.quiz.thresholds = thresholds;
      });
    };

    $scope.selectCategories = function ($event) {
      $mdDialog.show({
        controller: 'SelectCategoriesCtrl',
        templateUrl: 'select_categories.html',
        locals: {
          categories: $scope.quiz.categories,
          available_categories: $scope.quiz.available_categories,
          selected_categories: $scope.quiz.selected_categories
        },
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose:true,
        fullscreen: true
      }).then(function (selected) {
        $scope.quiz.selected_categories = $scope.quiz.available_categories.
          filter(function (category) {
          return selected[category];
        });
      });
    };

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

      $scope.prepareCharts();
      $scope.finished = true;
    };

    $scope.$watch('quiz.selected_categories', function (categories) {
      if (categories) {
        var foods = categories.map(function (category) {
          var foods = $scope.quiz.categories[category];
          return foods;
        }).reduce(function (a, b) { return a.concat(b) }, []);

        var indices = $scope.quiz.available_foods.map(function (food, i) {
          return foods.indexOf(food) >= 0 ? i : 'ignore';
        }).filter(function (x) { return x !== 'ignore' });

        $scope.quiz.foods = $scope.quiz.available_foods.filter(
          function (food, i) {
            return indices.indexOf(i) >= 0;
          }
        );
        $scope.quiz.intakes = $scope.quiz.available_foods_intakes.filter(
          function (intake, i) {
            return indices.indexOf(i) >= 0;
          }
        );
      }
    });

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

    $scope.exportAsPdf = function () {
      var pdf = new jsPDF('p','pt','a4');
      pdf.addHTML(document.body, 0, 0, {}, function() {
        window.open(pdf.output('datauristring'), '_blank');
        setTimeout(function () {
          location.reload();
        }, 0);
      });
    };

    $scope.openResultsDialog = function ($event) {
      $mdDialog.show({
        controller: 'GetResultCtrl',
        templateUrl: 'results_dialog.html',
        parent: angular.element(document.body),
        targetEvent: $event,
        clickOutsideToClose:true,
        fullscreen: true
      }).then($scope.exportAsPdf);
    };

    $scope.prepareCharts = function () {
      $scope.prepareBarChart();
      $scope.preparePieCharts();
    };

    $scope.prepareBarChart = function () {
      $scope.chart_1_labels = $scope.quiz.vitamins;
      $scope.chart_1_series = ['You', 'Ideal'];

      $scope.chart_1_data = [
        $scope.quiz.vitamins.map(function (vitamin) {
          return $scope.vitamin2intake[vitamin]
        }),
        $scope.quiz.thresholds
      ];
    };

    $scope.preparePieCharts = function () {
      $scope.pie_chart_data = {};
      $scope.pie_chart_labels = {};
      $scope.quiz.vitamins.forEach(function (vitamin) {
        $scope.preparePieChartFor(vitamin);
      });
    };

    $scope.preparePieChartFor = function (vitamin) {
      $scope.pie_chart_data[vitamin] = $scope.quiz.foods.map(function (food) {
        var answer_index = $scope.food2answer[food];
        var multiplier = $scope.quiz.multipliers[answer_index];
        var i = $scope.quiz.foods.indexOf(food);
        var j = $scope.quiz.vitamins.indexOf(vitamin);
        return $scope.quiz.intakes[i][j] * multiplier;
      });
      $scope.pie_chart_labels[vitamin] = $scope.quiz.foods.map(
        function (food, i) { return 'F' + (i + 1); }
      );
    };
  }).
  controller('GetResultCtrl', function ($scope, $mdDialog) {
    $scope.dismiss = function () {
      $mdDialog.cancel();
    };

    $scope.download = function () {
      $mdDialog.hide();
    };

    $scope.emailCheck = function () {
      return !$scope.email || !$scope.email.includes('@');
    };
  }).
  controller('AddFoodCtrl', function ($scope, $mdDialog, nutrients) {
    $scope.nutrients = nutrients;
    $scope.intakes = {};

    $scope.allDone = function () {
      var name_ok = $scope.name ? true : false;
      var all_intakes_ok = $scope.nutrients.filter(function (nutrient) {
        return $scope.intakes[nutrient] ? true : false;
      }).length === $scope.nutrients.length;
      return name_ok && all_intakes_ok;
    };

    $scope.dismiss = function () {
      $mdDialog.cancel();
    };

    $scope.add = function () {
      var result = {};
      result.name = $scope.name;
      result.intakes = $scope.nutrients.map(function (nutrient) {
        return parseFloat($scope.intakes[nutrient]);
      });
      $mdDialog.hide(result);
    };
  }).
  controller('CustomThresholdsCtrl', function ($scope, $mdDialog, nutrients,
    thresholds) {
    $scope.nutrients = nutrients;
    $scope.thresholds = {};
    nutrients.forEach(function (nutrient, i) {
      $scope.thresholds[nutrient] = thresholds[i];
    });

    $scope.allDone = function () {
      return $scope.nutrients.filter(function (nutrient) {
        return $scope.thresholds[nutrient] ? true : false;
      }).length === $scope.nutrients.length;
    };

    $scope.dismiss = function () {
      $mdDialog.cancel();
    };

    $scope.confirm = function () {
      $mdDialog.hide($scope.nutrients.map(function (nutrient) {
        return parseFloat($scope.thresholds[nutrient]);
      }));
    };
  }).
  controller('SelectFoodsCtrl', function ($scope, $mdDialog, foods,
    available_foods) {
    $scope.available_foods = available_foods;
    $scope.selected = {};
    $scope.available_foods.forEach(function (food) {
      $scope.selected[food] = foods.indexOf(food) >= 0;
    });

    $scope.atLeastOne = function () {
      return $scope.available_foods.filter(function (food) {
        return $scope.selected[food];
      }).length > 0;
    };

    $scope.dismiss = function () {
      $mdDialog.cancel();
    };

    $scope.confirm = function () {
      $mdDialog.hide($scope.selected);
    };
  }).
  controller('SelectCategoriesCtrl', function ($scope, $mdDialog, categories,
  available_categories, selected_categories) {
    $scope.categories = categories;
    $scope.available_categories = available_categories;

    $scope.selected = {};
    $scope.available_categories.forEach(function (category) {
      $scope.selected[category] = selected_categories.indexOf(category) >= 0;
    });

    $scope.atLeastOne = function () {
      return $scope.available_categories.filter(function (category) {
        return $scope.selected[category];
      }).length > 0;
    };

    $scope.dismiss = function () {
      $mdDialog.cancel();
    };

    $scope.confirm = function () {
      $mdDialog.hide($scope.selected);
    };
  });
