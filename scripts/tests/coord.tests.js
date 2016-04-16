runTest("return correct neighbour coords", function () {
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

  var neightbourCoords = LifeApp.Coords.getNeighbourValues({ x: 0, y: 1 }, testField);

  return compareCoordsArray(
    neightbourCoords,
    [
      5, 1, 2,
      10, 7,
      15, 11, 12
    ]);
});


runTest("correctly transforms index to coords", function () {
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

  var coords = LifeApp.Coords.getCoordsFromIndex(17, testField.dimensions);
  return compareCoords({ x: 5, y: 2 }, coords);
});

runTest("correctly handles loaf patten iteration", function () {
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

  var testLoafFieldAfterIteration = LifeApp.runIteration(testLoafField);
  // loaf is a stable form
  return compareArrays(loafState, testLoafFieldAfterIteration.currentState);
});

runTest("correctly handles blinker patten iteration", function () {
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

  var tesBlinkerFieldAfterIteration = LifeApp.runIteration(tesBlinkerField);
  
  var blinkerAfterIteration = [
    0, 0, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 0, 0,
  ].map(function (value) { return !!value; });
    
  return compareArrays(blinkerAfterIteration, tesBlinkerFieldAfterIteration.currentState);
});


function runTest(name, func) {
  if (func()) {
    console.log(name, "passed");
  } else {
    console.log(name, "FAILED");
  }
}

function compareArrays(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  return arr1.every(function (value, index) {
    return value === arr2[index];
  })

}

function compareCoordsArray(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  var isArr1InsideArr2 = arr1.every(function (item) {
    return isCoordInArray(item, arr2);
  });

  var isArr2InsideArr1 = arr2.every(function (item) {
    return isCoordInArray(item, arr1);
  });

  return isArr1InsideArr2 && isArr2InsideArr1;
}

function isCoordInArray(coord, array) {
  return array.some(function (value) {
    return compareCoords(value, coord);
  });
}

function compareCoords(coords1, coords2) {
  return coords1.x === coords2.x && coords1.y === coords2.y
}