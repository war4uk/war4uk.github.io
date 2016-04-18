LifeApp.getVisualizer = function (gameFieldCreator, coordsHelper) {
  return {
    initializeField: initializeField,
    updateField: updateField
  };

  function initializeField(gameField) {
    createFieldStructure(gameField.dimensions);

    gameField.currentState.forEach(function (value, index) {
      updateCell(value, index, gameField.dimensions);
    });
  }

  function updateField(field) {
    field.currentState.forEach(function (value, index) {
      updateCell(value, index, field.dimensions);
    });
  }

  function updateCell(isAlive, index, dimensions) {
    var coords = coordsHelper.getCoordsFromIndex(index, dimensions);
    var cellId = getIdFromCoords(coords);
    var cellElement = document.getElementById(cellId);

    cellElement.className = !isAlive ? "cell" : "cell alive";
    cellElement.innerHTML = '&#9679';
  }

  function createFieldStructure(dimensions) {
    var container = document.getElementById('content');
    container.innerHTML = "";

    for (var yCoord = 0; yCoord < dimensions.y; yCoord++) {
      var currentRow = createRow();
      for (var xCoord = 0; xCoord < dimensions.x; xCoord++) {
        currentRow.appendChild(createCell({ x: xCoord, y: yCoord }));
      }
      container.appendChild(currentRow);
    }
  }

  function createRow() {
    // todo some styling
    var row = document.createElement('div');
    row.className = 'row';
    return row;
  }

  function createCell(coords) {
    // todo some styling
    var cellContainer = document.createElement('span');
    cellContainer.className = 'cell-container';

    var cell = document.createElement('span');

    cell.id = getIdFromCoords(coords);
    cell.className = "cell";

    cellContainer.appendChild(cell);
    return cellContainer;
  }

  function getIdFromCoords(coords) {
    return coords.x + '_' + coords.y;
  }

  function getCoordsFromId(id) {
    var splitted = id.split('_');

    return { x: splitted.x, y: splitted.y };
  }


};
