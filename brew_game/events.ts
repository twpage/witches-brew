namespace Brew.Events {
    
    // called from postal.js channel
    export function mainEventhandler(gm: Brew.GameMaster, data: Brew.IBrewEventData, envelope)  {
        if (data.eventType == Brew.BrewEventType.Error) {
            console.log(data.errorMsg)
            return
        } 
        
        // if (!(data.eventType in event_function_map)) {
        //     console.error("received unknown event type", data)
        //     return
        // }
        // event_function_map[data.eventType](gm, data)
        
        if (data.eventType == Brew.BrewEventType.Info) {
            displayInfo(gm, data)
            
        } else if (data.eventType == Brew.BrewEventType.Move) {
            move(gm, data)

        } else if (data.eventType == Brew.BrewEventType.Wait) {
            rest(gm, data)

        } else if (data.eventType == Brew.BrewEventType.Pickup) {
            pickup(gm, data)
        
        } else if (data.eventType == Brew.BrewEventType.Drop) {
            dropItemAttempt(gm, data)

        } else if (data.eventType == Brew.BrewEventType.Special) {
            special(gm, data)

        } else if (data.eventType == Brew.BrewEventType.Attack) {
            attack(gm, data)
        
        } else if (data.eventType == Brew.BrewEventType.TargetingOn) {
            targetingOn(gm, data)
            
        } else if (data.eventType == Brew.BrewEventType.TargetingCancel) {
            targetingCancel(gm, data)

        } else if (data.eventType == Brew.BrewEventType.TargetingFinish) {
            targetingFinish(gm, data)

        } else if (data.eventType == Brew.BrewEventType.TargetingMove) {
            targetingMove(gm, data)

        } else if (data.eventType == Brew.BrewEventType.InventoryOn) {
            showInventoryList(gm, data)

        } else if (data.eventType == Brew.BrewEventType.InventoryOff) {
            stopShowingInventoryList(gm, data)

        } else if (data.eventType == Brew.BrewEventType.InventoryMove) {
            updateInventoryList(gm, data)

        } else if (data.eventType == Brew.BrewEventType.InventorySelect) {
            selectInventoryItem(gm, data)
            
        } else if (data.eventType == Brew.BrewEventType.ContextMenuOn) {
            showContextMenu(gm, data)

        } else if (data.eventType == Brew.BrewEventType.ContextMenuOff) {
            stopShowingContextMenu(gm, data)

        } else if (data.eventType == Brew.BrewEventType.ContextMenuMove) {
            updateContextMenu(gm, data)

        } else if (data.eventType == Brew.BrewEventType.ContextMenuSelect) {
            selectContextFromMenu(gm, data)

        } else {
            console.error("received unknown event type", data)
        }
        
    }

    //////////////////// context menu
    
    function showContextMenu(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let contextList : Array<ContextMenuItem> = data.eventData.context_list
        
        gm.input_handler = InputHandler.ContextMenu
        gm.display.contextMenuDraw(contextList, 0)
        data.eventData.selected_item_index = 0
        gm.endEvent(data)
    }

    function stopShowingContextMenu(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        resetHUDToGame(gm)
        gm.endEvent(data)
    }

    function updateContextMenu(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let cycle_dir = data.eventData.direction
        let current_index : number = gm.getLastEvent().eventData.selected_item_index
        let menu_list : Array<ContextMenuItem> = gm.getLastEvent().eventData.context_list
         
        let new_index = Brew.mod(current_index + cycle_dir, menu_list.length)
        
        gm.display.contextMenuDraw(menu_list, new_index)
        
        // make sure data carries over during the subsequent event
        data.eventData.context_list = menu_list
        data.eventData.selected_item_index = new_index
        data.eventData.item = gm.getLastEvent().eventData.item
        data.eventData.invkey = gm.getLastEvent().eventData.invkey
        
        gm.endEvent(data)
    }
    
    function selectContextFromMenu(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let current_index : number = gm.getLastEvent().eventData.selected_item_index
        let context_list : Array<ContextMenuItem> = gm.getLastEvent().eventData.context_list
        
        let activeContext : ContextMenuItem = context_list[current_index]
        
        if (activeContext == ContextMenuItem.Drop) {
            let item : Item = gm.getLastEvent().eventData.item
            let invkey : string = gm.getLastEvent().eventData.invkey
            // todo: refactor to drop event, then call endevent with 2nd arg

            let dropEvent : Brew.IBrewEventData = {
                eventType: BrewEventType.Drop,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: true,
                eventData: {
                    item: item,
                    invkey: invkey,
                    target_xy: gm.getPlayer().location.clone()
                }
            }

            resetHUDToGame(gm)
            gm.endEvent(data, dropEvent)

        } else if (activeContext == ContextMenuItem.Throw) {
            let item : Item = gm.getLastEvent().eventData.item
            let invkey : string = gm.getLastEvent().eventData.invkey

            // zzz
            let startThrowEvent : Brew.IBrewEventData = {
                eventType: Brew.BrewEventType.TargetingOn,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                eventData: {
                    start_xy: gm.getPlayer().location,
                    target_xy: gm.getPlayer().location,
                    targetingAction: Brew.BrewTargetingAction.ThrowItem,
                    item: item,
                    invkey: invkey
                }
            }

            resetHUDToGame(gm)
            gm.endEvent(data, startThrowEvent)
        
        } else {
            throw new Error("bad context given")
        }
        
        
    }
        
    //////////////////// inventory
        
    function showInventoryList(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let inv : Brew.Inventory = data.eventData.inventory
        
        gm.input_handler = InputHandler.InventoryList
        gm.display.inventoryDraw(inv, 0)
        data.eventData.selected_item_index = 0
        gm.endEvent(data)
    }

    function stopShowingInventoryList(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        resetHUDToGame(gm)
        gm.endEvent(data)
    }
    
    function resetHUDToGame(gm: Brew.GameMaster) {
        gm.input_handler = InputHandler.Main
        gm.display.clearDisplay(DisplayNames.HUD)
        gm.displayAll()
    }
    
    function updateInventoryList(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let cycle_dir = data.eventData.direction
        
        let inv : Brew.Inventory = gm.getLastEvent().eventData.inventory
        let selected_item_index : number = gm.getLastEvent().eventData.selected_item_index
        
        let new_index = calcNewInventoryItemIndex(inv, selected_item_index, cycle_dir)
        
        // gm.input_handler = InputHandler.InventoryList
        gm.display.inventoryDraw(inv, new_index)
        
        // make sure data carries over during the subsequent event
        data.eventData.inventory = inv
        data.eventData.selected_item_index = new_index
        
        gm.endEvent(data)
    }
    
    function calcNewInventoryItemIndex(inv: Brew.Inventory, current_index : number, index_offset : number) : number {
        let keys = inv.getKeys()
        let new_index : number
        
        new_index = Brew.mod(current_index + index_offset, keys.length)
        return new_index
    }
    
    function selectInventoryItem(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        // grab selection from the last event
        let inv : Brew.Inventory = gm.getLastEvent().eventData.inventory
        let selected_item_index : number = gm.getLastEvent().eventData.selected_item_index
        
        let invkey = inv.getKeys()[selected_item_index]
        let it = inv.getItemByKey(invkey)
        
        // todo: different actions, throw, drop, etc
        // todo: need a way to generate follow-on events
        // let dropOK = dropItem(gm, invkey, it)

        let itemEvent : IBrewEventData = {
            eventType: BrewEventType.ContextMenuOn,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            eventData: {
                item: it,
                invkey: invkey,
                context_list: [ContextMenuItem.Drop, ContextMenuItem.Throw, ContextMenuItem.Use]
            }
        }
        
        resetHUDToGame(gm)
        gm.endEvent(data, itemEvent)
    }
    
    function dropItemAttempt(gm: Brew.GameMaster, data: Brew.IBrewEventData) { 
        let drop_xy = data.eventData.target_xy

        let it = gm.getCurrentLevel().items.getAt(drop_xy)
        if (it) {
            let dropError : IBrewEventData = {
                eventType: Brew.BrewEventType.Error,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                errorMsg: "something is already here"
            }

            data.endsTurn = false
            gm.endEvent(data, dropError)

        } else {
            let invkey = data.eventData.invkey
            let item = data.eventData.item

            gm.getPlayer().inventory.removeItemByKey(invkey)
            gm.getCurrentLevel().items.setAt(drop_xy, item)
            gm.displayAt(drop_xy)
            gm.endEvent(data)

        }
    }
    
    //////////////////// targeting
    
    function targetingOn(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        
        // targeting data
        data.targetingData = {
            action: data.eventData.targetingAction, // copied over from initial event
            from_xy: gm.getPlayer().location.clone(),
            to_xy: gm.getPlayer().location.clone(),
            method: Brew.BrewTargetingMethod.StraightLine, // todo: modify this based on targeting Action
            destinationMustBeVisible: true, 
            destinationMustBeWalkable: true,
            destinationMustHaveMob: false,
            pathBlockedByMobs: true
        }
        
        // initial highlights
        let tgtHighlight = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight)
        tgtHighlight.color = Brew.Color.target_cursor
        
        gm.display.highlights.setAt(gm.getPlayer().location, tgtHighlight)
        gm.displayAt(gm.getPlayer().location)
        
        gm.input_handler = Brew.InputHandler.Targeting
        
        gm.endEvent(data)
    }
    
    function targetingCancel(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        console.log("cancelling targeting")
        clearTargetingHighlights(gm)

        gm.input_handler = Brew.InputHandler.Main
        gm.endEvent(data)
    }
    
    function targetingFinish(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        console.log("target gotten: ", data.targetingData.action)
        clearTargetingHighlights(gm)

        gm.input_handler = Brew.InputHandler.Main
        
        copyAndReplaceEventData(data, gm.getLastEvent())

        console.log("targeting finish data", data)

        gm.endEvent(data)//, nextTargetingEvent)
        // todo: somehow kick off the next event
    }    
    
    enum TargetingError {
        TargetNotViewable = 1,
        PathBlockedByTerrain,
        PathBlockedByMob
    }
    
    export interface ITargetingResponse {
        is_valid: boolean
        path: Array<Brew.Coordinate>
        error_reason?: TargetingError
        actual_xy?: Brew.Coordinate
    }
    
    export function checkTargetingPath(gm: Brew.GameMaster, data: Brew.IBrewEventData) : ITargetingResponse {
        
        let response : ITargetingResponse = {
            is_valid: false,
            path: []
        }
        
        if (data.targetingData.method == Brew.BrewTargetingMethod.PointOnly) {
            
            let target_xy : Brew.Coordinate = data.targetingData.to_xy
            response.path = [target_xy]
            response.is_valid = true

        } else if (data.targetingData.method == Brew.BrewTargetingMethod.StraightLine) {
            
            // draw new path
            let path_lst = Brew.Utils.getLineBetweenPoints(data.targetingData.from_xy, data.targetingData.to_xy)

            // assume path is true unless we run into something
            response.is_valid = true
            
            let real_path_lst : Array<Brew.Coordinate> = []
            let level = gm.getCurrentLevel()
            
            for (let i = 0; i < path_lst.length; i++) {
                let xy = path_lst[i] 
                let t = level.terrain.getAt(xy)
                let in_fov = data.actor.inFOV(t)
                
                if (data.targetingData.destinationMustBeVisible && (!(in_fov))) {
                    response.is_valid = false
                    response.error_reason = TargetingError.TargetNotViewable
                    break
                } 
                
                if (data.targetingData.destinationMustBeWalkable && t.blocks_walking) {
                    response.is_valid = false
                    response.error_reason = TargetingError.PathBlockedByTerrain
                    break
                }
                
                let m = level.monsters.getAt(xy)
                let last_element = i == (path_lst.length - 1)
                
                if (!(last_element)) {
                    
                    // not the last coord, but mob is in the way
                    if (data.targetingData.pathBlockedByMobs && (m) && (!(i == 0))) {
                        real_path_lst.push(xy)
                        response.is_valid = false
                        response.error_reason = TargetingError.PathBlockedByMob
                        response.actual_xy = xy.clone()
                        break
                    }
                    
                } else {
                    // is the last element, check if we need to have a mob target
                    // todo: maybe some kind of good / bad indicator for the path
                } 
                
                real_path_lst.push(xy)
            } // end path for loop
            
            response.path = real_path_lst
        } // end if
        
        return response
    }
    
    function showTargetingHighlights(gm: Brew.GameMaster, data: Brew.IBrewEventData, targetingResponse : ITargetingResponse) {
        
        // clear the old highlights
        clearTargetingHighlights(gm)
        
        // setup our highlight colors
        let tHighlight = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight)
        tHighlight.color = Brew.Color.target_path
        let tCursor = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight)
        
        // set highlights across the path and show them
        targetingResponse.path.forEach((xy: Brew.Coordinate, index, array) => {
            gm.display.highlights.setAt(xy, tHighlight)
        })
        
        // change cursor color depending on the outcome
        if (targetingResponse.is_valid) {
            tCursor.color = Brew.Color.target_cursor
        } else {
            tCursor.color = Brew.Color.target_error
        }
        
        // set the cursor by itself
        gm.display.highlights.removeAt(data.targetingData.to_xy)
        gm.display.highlights.setAt(data.targetingData.to_xy, tCursor)
        
        // tell the display to redraw all these new highlighted squares
        gm.displayList(targetingResponse.path.concat(data.targetingData.to_xy))
        // gm.displayAt(data.targetingData.to_xy)
    }
    
    function clearTargetingHighlights(gm: Brew.GameMaster) {
        // actually just clear all highlights
        let copyList = gm.display.highlights.getAllCoordinates() 
        copyList.forEach((value, index, array) => {
            gm.display.highlights.removeAt(value)
        })
        gm.displayList(copyList)
    }

    function targetingMove(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        // modify event, so we can grab last event next time.. keep updating target location as we move
        
        // move target
        let offset_xy = data.eventData.offset_xy 
        let current_target_xy = data.targetingData.to_xy
        
        let new_target_xy = current_target_xy.add(offset_xy)
        
        // set new target
        data.targetingData.to_xy = new_target_xy
        
        // check new targeting and show the results
        let resp = checkTargetingPath(gm, data)
        showTargetingHighlights(gm, data, resp)
        console.log(data) //twp: its not copying.. getting overridden by targeting events and losing throw/item info
        // todo: may instead need a way that builds/replaces eventData over subsequent events, and clears out only after certain types
        // or certain types in the same family just copy everything every time
        copyAndReplaceEventData(data, gm.getLastEvent())
        console.log(data)   
        gm.endEvent(data)
    }

    function copyAndReplaceEventData(event_source: Brew.IBrewEventData, event_dest: Brew.IBrewEventData) {
        if (event_source.eventData) {
            event_dest.eventData = {}
            for (var key in event_source.eventData) {
                if (event_source.eventData.hasOwnProperty(key)) {
                    event_dest.eventData[key] = event_source.eventData[key];
                }
            }
        }
    }

    function move(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let level = gm.getCurrentLevel()
        level.monsters.removeAt(data.eventData.from_xy)
        level.monsters.setAt(data.eventData.to_xy, data.actor)
        
        gm.displayList([data.eventData.from_xy, data.eventData.to_xy])
        gm.endEvent(data)
    }
    
    function rest(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        console.log(`${data.actor.name} waits`)
        gm.endEvent(data)
    }
    
    function pickup(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        
        // remove it from the floor
        let it : Brew.Item = data.eventData.item
        gm.getCurrentLevel().items.removeAt(it.location)
        // console.log("removed from level", it.location)
        // Intel.updateMemoryAt(gm, gm.getPlayer(), it.location)
        
        // add to inventory
        let ok = gm.getPlayer().inventory.addItem(it)
        
        if (!(ok)) {
            throw new Error("inventory full - we shouldn't be here")
        }
        
        console.log(`Picked up ${it.name}`)
        gm.endEvent(data)
    }
    
    function attack(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        
        let target : Brew.Monster = data.eventData.target
        
        if (data.eventData.isMelee) {
            console.log(`${data.actor.name} attacks ${data.eventData.target.name}`)
            gm.endEvent(data)
        } else {
            console.log(`${data.actor.name} SHOOTS ${data.eventData.target.name}`)
            animateShot(gm, data)
        }
    }
    
    function animateShot(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let to_xy : Coordinate = data.eventData.to_xy
        let from_xy : Coordinate = data.eventData.from_xy
        let path = Utils.getLineBetweenPoints(from_xy, to_xy)
        path.splice(0, 1)
        let level = gm.getCurrentLevel()
        // console.log(path)
        
        path.forEach((xy: Coordinate, index, array) => {
            setTimeout(() => {
                if (index == path.length - 1) {
                    level.above.removeAt(path[index-1])
                    gm.displayAt(path[index-1])
                    gm.endEvent(data)
                } else {
                    if (index > 0) {
                        // remove old one
                        level.above.removeAt(path[index-1])
                        gm.displayAt(path[index-1])
                    } 
                    level.above.removeAt(xy)
                    level.above.setAt(xy, Definitions.aboveFactory(Definitions.AboveType.Projectile))
                    gm.displayAt(xy)
                }
            },
            (index * 150)
            )
        })
        
    }
    
    function special(gm: Brew.GameMaster, data: Brew.IBrewEventData) { 
        
        let level = gm.getCurrentLevel()
        
        // disappear
        level.monsters.removeAt(data.actor.location)
        gm.displayAt(data.actor.location)
        
        // reappear
        setTimeout( () => {
            level.monsters.setAt(data.eventData.target_xy, data.actor)
            gm.displayAt(data.eventData.target_xy)  
            
            gm.endEvent(data)
        },
        2500
        )

    }
    
    function displayInfo(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        let level = gm.getCurrentLevel()
        
        // debug show what's there
        let divDebug = <HTMLDivElement> (document.getElementById("id_div_debug"))
        divDebug.innerHTML = "<p>" + data.eventData.target_xy.toString() + "</p>"
        
        gm.endEvent(data)
    }

    function animateThrownItem(gm: Brew.GameMaster, data: Brew.IBrewEventData) {
        // todo: remove this duplicate pathfinding
        // todo: add a way to trigger event after animation is done (e.g. damage, drop item)
        let to_xy : Coordinate = data.eventData.to_xy
        let from_xy : Coordinate = data.eventData.from_xy
        let path = Utils.getLineBetweenPoints(from_xy, to_xy)
        path.splice(0, 1)
        let level = gm.getCurrentLevel()
        // console.log(path)
        
        path.forEach((xy: Coordinate, index, array) => {
            setTimeout(() => {
                if (index == path.length - 1) {
                    level.above.removeAt(path[index-1])
                    // todo: need a way to block or knock items already there
                    level.items.removeAt(path[index-1])
                    level.items.setAt(path[index-1], data.eventData.item)

                    gm.displayAt(path[index-1])
                    gm.endEvent(data)
                } else {
                    if (index > 0) {
                        // remove old one
                        level.above.removeAt(path[index-1])
                        gm.displayAt(path[index-1])
                    } 
                    level.above.removeAt(xy)
                    level.above.setAt(xy, Definitions.aboveFactory(Definitions.AboveType.Projectile))
                    gm.displayAt(xy)
                }
            },
            (index * 150)
            )
        })
        
    }


} // end namespace