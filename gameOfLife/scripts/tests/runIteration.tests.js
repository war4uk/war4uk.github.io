"use strict";
describe("Run iteration", function () {
  var iterationRunner;

  beforeAll(function () {
    iterationRunner = LifeApp.getRunIteration(LifeApp.CoordsHelper); // assume that CoordsHelper is reliable enough to not mock it
  });

  it("correctly handles loaf patten iteration", function () {
    var loafState = [
      0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 0, 0,
      0, 1, 0, 0, 1, 0,
      0, 0, 1, 0, 1, 0,
      0, 0, 0, 1, 0, 0,
      0, 0, 0, 0, 0, 0,
    ].map(function (value) { return !!value; });
    var testLoafField = {
      dimensions: { x: 6, y: 6 },
      currentState: loafState,
      iterationNumber: 0
    };

    var testLoafFieldAfterIteration = iterationRunner(testLoafField);
    // loaf is a stable form
    expect(testLoafFieldAfterIteration.currentState).toEqual(loafState);
  })

  it("correctly handles blinker patten iteration", function () {
    var blinkerInitialState = [
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 1, 1, 1, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
    ].map(function (value) { return !!value; });

    var tesBlinkerField = {
      dimensions: { x: 5, y: 5 },
      currentState: blinkerInitialState,
      iterationNumber: 0
    };

    var actualBlinkerFieldAfterIteration = iterationRunner(tesBlinkerField).currentState;

    var expectedBlinkerFieldAfterIteration = [
      0, 0, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 0, 0,
    ].map(function (value) { return !!value; });

    return expect(actualBlinkerFieldAfterIteration).toEqual(expectedBlinkerFieldAfterIteration);
  })
});