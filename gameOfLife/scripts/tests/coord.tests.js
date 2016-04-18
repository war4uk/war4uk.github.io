"use strict";
describe("CoordsHelper", function () {
  var coordsHelper;

  beforeAll(function () {
    coordsHelper = LifeApp.CoordsHelper;
  });

  it("return correct neighbour coords", function () {
    var testField = {
      dimensions: { x: 5, y: 4 },
      currentState: [
        1, 2, 3, 4, 5,
        6, 7, 8, 9, 10,
        11, 12, 13, 14, 15,
        16, 17, 18, 19, 20
      ],
      iterationNumber: 0
    };

    var neightbourCoords = coordsHelper.getNeighbourValues({ x: 0, y: 1 }, testField);

    expect(neightbourCoords.sort()).toEqual([
      10, 7,
      15, 11, 12,
      5, 1, 2
    ].sort());
  });

  it("correctly transforms index to coords", function () {
    var testField = {
      dimensions: { x: 6, y: 6 },
      currentState: [
        1, 2, 3, 4, 5, 6,
        7, 8, 9, 10, 11, 12,
        13, 14, 15, 16, 17, 18,
        19, 20, 21, 22, 23, 24,
        25, 26, 27, 28, 29, 30,
        31, 32, 33, 34, 35, 36
      ],
      iterationNumber: 0
    };

    var index = 17;

    var coords = coordsHelper.getCoordsFromIndex(17, testField.dimensions);
    expect(coords).toEqual({ x: 5, y: 2 })
  });
});
