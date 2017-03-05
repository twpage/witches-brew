/// <reference path="./lib/rot.js-TS/rot.d.ts" />
/// <reference path="./lib/postal.d.ts" />
/// <reference path="./brew_engine/display.ts" />
/// <reference path="./brew_engine/grid.ts" />
/// <reference path="./brew_engine/pathmap.ts" />
/// <reference path="./brew_game/intel.ts" />
/// <reference path="./brew_game/events.ts" />
/// <reference path="./brew_game/input.ts" />
var gm : Brew.GameMaster
function startGame() {
    
    
    let divGame = <HTMLDivElement> (document.getElementById("id_div_game"))
    
    gm = new Brew.GameMaster(
        divGame,
        Brew.Input.handleAllInput, // input
        Brew.Events.mainEventhandler,// event
        Brew.Intel.mainAiHandler, // ai
        Brew.Intel.runBeforePlayerTurn, // pre-player
        Brew.Intel.runAfterPlayerTurn // post-player 
    )

    

}

window.onload = startGame

