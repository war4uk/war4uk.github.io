(function (getStartGame, initialStates, coordsHelper, gameFieldCreator, getRunIteration, getVisualizer, window) {
  // emulate dependency injection
  var runIteration = getRunIteration(coordsHelper);
  var visualizer = getVisualizer(gameFieldCreator, coordsHelper);
  var startGame = getStartGame(gameFieldCreator, runIteration, visualizer, window.setInterval, window.clearInterval);

  var startButtons = document.getElementById('presets');

  initialStates.forEach(function (stateInfo) {
    var button = document.createElement("button");
    button.className = 'preset-button';
    button.innerText = 'Start ' + stateInfo.name;
    button.onclick = function () {
      startGame(stateInfo.state.dimensions, stateInfo.state.field);
    }

    startButtons.appendChild(button);
  });
})(LifeApp.getStartGame, LifeApp.initialStates, LifeApp.CoordsHelper, LifeApp.createGameField, LifeApp.getRunIteration, LifeApp.getVisualizer, window);