LifeApp.getStartGame = function (createGameField, runIteration, visualizer, setInterval, clearInterval) {
  var interval;
  return function startGame(dimensions, initialState) {
    var gameField = createGameField(dimensions, initialState);
    visualizer.initializeField(gameField);

    if (interval) {
      clearInterval(interval);
    }

    interval = setInterval(function () {
      gameField = runIteration(gameField);

      visualizer.updateField(gameField);
    }, 500)
  }
}
