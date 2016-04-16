LifeApp.runIteration = (function (coordsHelper) {
  return runIteration;

  function runIteration(field) {
    field.currentState = field.currentState.map(function (isCurrentCellAlive, index) {
      var coords = coordsHelper.getCoordsFromIndex(index, field.dimensions);

      var neighbourValues = coordsHelper.getNeighbourValues(coords, field);
      var livingNeighboursCount = getLiveNeighboursCount(neighbourValues);

      return isCurrentCellAlive ? livingCellRule(livingNeighboursCount) : deadCellRule(livingNeighboursCount);
    });
    field.iterationNumber++;
    return field;
  }

  function livingCellRule(liveNeighboursCount) {
    // cell lives if it has 3 or 4 live neighbours
    return liveNeighboursCount === 2 || liveNeighboursCount === 3;
  }

  function deadCellRule(liveNeighboursCount) {
    // cell with 3 living neighbours ressurects
    return liveNeighboursCount === 3;
  }

  function getLiveNeighboursCount(neighbours) {
    return neighbours.reduce(
      function (prevCount, curValue) {
        return curValue ? (prevCount + 1) : prevCount;
      },
      0
    );
  }

})(LifeApp.Coords);