LifeApp.createGameField = (function () {
  return function createField(dimensions, initialState) {
    if (!dimensions || !initialState || dimensions.x * dimensions.y !== initialState.length) {
      throw new Error("incorrect initialState");
    }

    return {
      dimensions: dimensions,
      currentState: initialState,
      iterationNumber: 0
    }
  }
})();