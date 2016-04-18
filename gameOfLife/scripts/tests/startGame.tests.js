"use strict";
describe("start game", function () {

    var startGame;

    var gameFieldCreatorCallCount, runIterationCallCount, visualizer, clearIntervalCalledCount;
    beforeEach(function () {
        // mocking dependencies
        jasmine.clock().install();
        runIterationCallCount = 0;
        gameFieldCreatorCallCount = 0;
        clearIntervalCalledCount = 0;

        var runIteration = function (field) {
            runIterationCallCount = runIterationCallCount + 1;
            field.currentState = "state after iteration";
            return field;
        };

        var gameFieldCreator = function (dimensions, initialState) {
            gameFieldCreatorCallCount = gameFieldCreatorCallCount + 1;
            return {
                dimensions: dimensions,
                currentState: initialState
            }
        };

        visualizer = jasmine.createSpyObj('jasmine.createSpyObj', ['initializeField', 'updateField']);
        var clearInterval = function (id) {
            clearIntervalCalledCount = clearIntervalCalledCount + 1;
            return window.clearInterval(id);
        };

        startGame = LifeApp.getStartGame(gameFieldCreator, runIteration, visualizer, window.setInterval, clearInterval);

    });

    afterEach(function () {
        jasmine.clock().uninstall();
    });

    it('initializes properly', function () {
        startGame("dimensions", "initialState"); // for a brewity send strings, we've mocked all the functionality anyway

        expect(gameFieldCreatorCallCount).toEqual(1);
        expect(visualizer.initializeField).toHaveBeenCalledWith({
            dimensions: "dimensions",
            currentState: "initialState"
        });
        jasmine.clock().tick(501);
        expect(runIterationCallCount).toEqual(1);
        expect(visualizer.updateField).toHaveBeenCalledWith({
            dimensions: "dimensions",
            currentState: "state after iteration"
        });
    });
});