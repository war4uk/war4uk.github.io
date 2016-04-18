LifeApp.CoordsHelper = (function () {
  return {
    getNeighbourValues: getNeighbourValues,
    getCoordsFromIndex: getCoordsFromIndex
  };

  function getCoordsFromIndex(index, dimensions) {
    if (!dimensions.x || !dimensions.y) {
      throw new Error("invalid argument");
    }
    var y = Math.floor(index / dimensions.x);
    var x = index % dimensions.x;

    return { x: x, y: y };
  }

  function getNeighbourValues(cellCoords, gameField) {
    if (cellCoords.x === undefined || cellCoords.y === undefined
      || cellCoords.x === null || cellCoords.y === null
      || !gameField.dimensions.x || !gameField.dimensions.y
      || (gameField.dimensions.x * gameField.dimensions.y !== gameField.currentState.length)
    ) {
      throw new Error("invalid argument");
    }

    var xMax = gameField.dimensions.x - 1;
    var yMax = gameField.dimensions.y - 1;

    var centerX = cellCoords.x;
    var centerY = cellCoords.y;

    var leftX = cellCoords.x === 0 ? xMax : (cellCoords.x - 1);
    var rightX = cellCoords.x === xMax ? 0 : (cellCoords.x + 1);

    var topY = cellCoords.y === 0 ? yMax : (cellCoords.y - 1);
    var bottomY = cellCoords.y === yMax ? 0 : (cellCoords.y + 1);

    var getValueByCoord = getValueByCoordFunc(gameField);

    return [
      getCoord(leftX, topY),
      getCoord(centerX, topY),
      getCoord(rightX, topY),

      getCoord(leftX, centerY),
      getCoord(rightX, centerY),

      getCoord(leftX, bottomY),
      getCoord(centerX, bottomY),
      getCoord(rightX, bottomY)
    ].map(getValueByCoord);
  }

  function getCoord(x, y) {
    return { x: x, y: y };
  }

  function getCellValueByCoord(gameField, coord) {
    var index = coord.y * gameField.dimensions.x + coord.x;

    return gameField.currentState[index];
  }

  function getValueByCoordFunc(gameField) {
    return function (coords) {
      return getCellValueByCoord(gameField, coords);
    }
  }
})();