namespace Brew.Input {
    
    function inputError(errorMsg: string) : Brew.IBrewEventData {
        return {
            eventType: Brew.BrewEventType.Error,
            actor: null,
            playerInitiated: true,
            endsTurn: false,
            errorMsg: errorMsg
        }
    }
    
    // called from postal.js channel
    export function handleAllInput(gm: Brew.GameMaster, data: Brew.IBrewInputData, envelope) {
        
        let myEvent : Brew.IBrewEventData
        
        // default main handler
        if (gm.input_handler == Brew.InputHandler.Main) {
            myEvent = mainInputHandler(gm, data, envelope)
           
        // targeting handler
        } else if (gm.input_handler == Brew.InputHandler.Targeting) {
            myEvent = targetingInputHandler(gm, data, envelope)
            
        // inventory screen handler
        } else if (gm.input_handler == Brew.InputHandler.InventoryList) {
            myEvent = inventoryListInputHandler(gm, data, envelope)
             
        // context menu handler
        } else if (gm.input_handler == Brew.InputHandler.ContextMenu) {
            myEvent = contextMenuHandler(gm, data, envelope)

        } else {
            console.error(`unknown input handler ${gm.input_handler}`)
        }
        
        // post to events channel here ?
        gm.channel_event.publish("event.start", myEvent)
    }
    
    function inventoryListInputHandler(gm: Brew.GameMaster, data: Brew.IBrewInputData, envelope) : Brew.IBrewEventData {
        let keycode = data.code
        let invEvent : IBrewEventData
        
        if (KeyMap.Escape.indexOf(keycode) > -1) {
            invEvent = {
                eventType: BrewEventType.InventoryOff,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false
            }
            
            return invEvent
        
        } else if (KeyMap.MovementKeys.indexOf(keycode) > -1) {
            let cycle_dir : number
            
            let offset_xy = Utils.getDirectionFromKeycode(keycode)
            
            if ((offset_xy.x < 0) || (offset_xy.y < 0)) {
                cycle_dir = -1
            } else if ((offset_xy.x > 0) || (offset_xy.y > 0)) {
                cycle_dir = 1
            } else {
                throw new Error("Some kind of weird direction thingy happened")
            }
            
            invEvent = {
                eventType: BrewEventType.InventoryMove,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                eventData: {
                    direction: cycle_dir
                }
            }
            
            return invEvent
            
        } else if (KeyMap.Action.indexOf(keycode) > -1) {
            
            invEvent = {
                eventType: BrewEventType.InventorySelect,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false
            }
            return invEvent
            
        } else {
            
            return inputError("inventory screen - unknown keypress")
                
        }
    }

    function contextMenuHandler(gm: Brew.GameMaster, data: Brew.IBrewInputData, envelope) : Brew.IBrewEventData {
        let keycode = data.code
        let contextmenuEvent : IBrewEventData
        
        if (KeyMap.Escape.indexOf(keycode) > -1) {
            contextmenuEvent = {
                eventType: BrewEventType.ContextMenuOff,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false
            }
            
            return contextmenuEvent
        
        } else if (KeyMap.MovementKeys.indexOf(keycode) > -1) {
            let cycle_dir : number
            
            let offset_xy = Utils.getDirectionFromKeycode(keycode)
            
            if ((offset_xy.x < 0) || (offset_xy.y < 0)) {
                cycle_dir = -1
            } else if ((offset_xy.x > 0) || (offset_xy.y > 0)) {
                cycle_dir = 1
            } else {
                throw new Error("Some kind of weird direction thingy happened")
            }
            
            contextmenuEvent = {
                eventType: BrewEventType.ContextMenuMove,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                eventData: {
                    direction: cycle_dir
                }
            }
            
            return contextmenuEvent
            
        } else if (KeyMap.Action.indexOf(keycode) > -1) {
            
            contextmenuEvent = {
                eventType: BrewEventType.ContextMenuSelect,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false
            }
            return contextmenuEvent
            
        } else {
            
            return inputError("context menu - unknown keypress")
                
        }
    }
        
    function targetingInputHandler(gm: Brew.GameMaster, data: Brew.IBrewInputData, envelope) : Brew.IBrewEventData {
        
        let tgtEvent : Brew.IBrewEventData
        let lastEvent = gm.getLastEvent()
        
        if (data.source == Brew.BrewInputSource.Keyboard) {
            let keycode = data.code
            
            if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {

                // move target
                let offset_xy : Brew.Coordinate = Brew.Utils.getDirectionFromKeycode(keycode)
                
                let current_target_xy = lastEvent.targetingData.to_xy.clone()
                let new_target_xy = current_target_xy.add(offset_xy)
                
                if (!(gm.getCurrentLevel().isValid(new_target_xy))) {
                    return inputError("can't move target over there")
                }
                
                // new move event
                tgtEvent = {
                    eventType: Brew.BrewEventType.TargetingMove,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false,
                    eventData: {
                        offset_xy: offset_xy
                    }
                }

                // copy targeting data over from last event
                tgtEvent.targetingData = Brew.clone(lastEvent.targetingData)
                tgtEvent.targetingData.to_xy = lastEvent.targetingData.to_xy.clone()
                tgtEvent.targetingData.from_xy = lastEvent.targetingData.from_xy.clone()
                
            } else if ((Brew.KeyMap.Action.indexOf(keycode) > -1) || (Brew.KeyMap.Examine.indexOf(keycode) > -1)) { 
                // todo: make this trigger the actual thing we are targeting for
                // finish targeting
                tgtEvent = {
                    eventType: Brew.BrewEventType.TargetingFinish,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false
                }
                
                // copy targeting data over from last event
                tgtEvent.targetingData = Brew.clone(gm.getLastEvent().targetingData)
                
            } else {
                // cancel it
                tgtEvent = {
                    eventType: Brew.BrewEventType.TargetingCancel,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false
                }

            }
        } else if (data.source == Brew.BrewInputSource.Mouse) {
            let screen_xy = getScreenCoordsFromMouseEvent(gm, data)
            if (!(screen_xy)) {
                return inputError("click outside of screen")
            }
            
            let map_xy = gm.display.convertScreenToMap(screen_xy)
            
            if (data.jsevent.type == "mousedown") {
                
                // finish targeting
                tgtEvent = {
                    eventType: Brew.BrewEventType.TargetingFinish,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false
                }
                
                // copy targeting data over from last event
                tgtEvent.targetingData = Brew.clone(gm.getLastEvent().targetingData)
                
            } else if (data.jsevent.type == "mousemove") {

                let current_target_xy = lastEvent.targetingData.to_xy.clone()
                let new_target_xy = map_xy
                
                // new move event
                tgtEvent = {
                    eventType: Brew.BrewEventType.TargetingMove,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false,
                    eventData: {
                        offset_xy: map_xy.subtract(current_target_xy)
                    }
                }

                // copy targeting data over from last event
                tgtEvent.targetingData = Brew.clone(lastEvent.targetingData)
                tgtEvent.targetingData.to_xy = lastEvent.targetingData.to_xy.clone()
                tgtEvent.targetingData.from_xy = lastEvent.targetingData.from_xy.clone()

            }
        }

        return tgtEvent
    }
        
    function mainInputHandler(gm: Brew.GameMaster, data: Brew.IBrewInputData, envelope) : Brew.IBrewEventData {
        
        let playerEvent : Brew.IBrewEventData
        
        
        if (data.source == Brew.BrewInputSource.Keyboard) {
            playerEvent = translateKeyboardInputIntoEvent(gm, data, envelope)
        } else if (data.source == Brew.BrewInputSource.Mouse) {
            playerEvent = translateMouseInputIntoEvent(gm, data, envelope)
        } else {
            console.error("unexpected input type")
        }
        
        return playerEvent
    }

    function translateKeyboardInputIntoEvent(gm: Brew.GameMaster, data: Brew.IBrewInputData, envelope) : Brew.IBrewEventData {

        let ev : Brew.IBrewEventData
        ev = {
            eventType: null,
            actor: gm.getPlayer(),
            playerInitiated: true
        }
        
        let keycode = data.code
        
        if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
            return inputMovement(gm, keycode)
        } else if (Brew.KeyMap.Action.indexOf(keycode) > -1) {
            return inputAction(gm, keycode)
        } else if (Brew.KeyMap.Examine.indexOf(keycode) > -1) {
            return inputExamine(gm, keycode)
        } else if (Brew.KeyMap.DebugFOV.indexOf(keycode) > -1) {
            Brew.Debug.toggleFOV(gm)
        } else if (Brew.KeyMap.DebugPaths.indexOf(keycode) > -1) {
            Brew.Debug.togglePathmap(gm, Path.createGenericMapToPlayer(gm, gm.getCurrentLevel()))
        } else if (Brew.KeyMap.Inventory.indexOf(keycode) > -1) {
            return inputInventory(gm, keycode)
        }
        
        return inputError("invalid keyboard input")
    }
    
    function inputMovement(gm: Brew.GameMaster, keycode: number) : Brew.IBrewEventData {
        
        let level = gm.getCurrentLevel()
        
        // determine offset
        let offset_xy : Brew.Coordinate = Brew.Utils.getDirectionFromKeycode(keycode)
        if (!(offset_xy)) {
            return inputError("invalid movement key - no direction")
        }
        
        // check whats over there
        let new_xy = gm.getPlayer().location.add(offset_xy)
        
        if (!(level.isValid(new_xy))) {
            return inputError("You can't go there")
        }
        
        let t: Brew.Terrain = level.terrain.getAt(new_xy)
        if (t.blocks_walking) {
            return inputError("You can't WALK there")
        }
        
        let m: Brew.Monster = level.monsters.getAt(new_xy)
        if (m) {
            return playerMeleeAttack(gm, m)
        }
        
        // move event
        let old_xy = gm.getPlayer().location.clone()
        
        let moveEvent : Brew.IBrewEventData = {
            eventType: Brew.BrewEventType.Move,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: true,
            eventData: {
                from_xy: old_xy,
                to_xy: new_xy
            }
        }
        return moveEvent
    }

    function playerMeleeAttack(gm: Brew.GameMaster, target: Brew.Monster) : Brew.IBrewEventData {
        let attackEvent : IBrewEventData = {
            eventType: BrewEventType.Attack,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: true,
            eventData: {
                from_xy: gm.getPlayer().location,
                to_xy: target.location,
                target: target,
                isMelee: true
            }
        }
        
        return attackEvent
    }
    
    function inputAction(gm: Brew.GameMaster, keycode: number) : Brew.IBrewEventData {
        // pickup / rest
        
        // lets see whats here
        let level = gm.getCurrentLevel()
        let player = gm.getPlayer()
        let it = level.items.getAt(player.location)
        
        if (it) {
            // try to  pick it up
            let ok = player.inventory.hasCapacity()
            if (ok) {
                
                let pickupEvent : Brew.IBrewEventData = {
                    eventType: Brew.BrewEventType.Pickup,
                    actor: player,
                    playerInitiated: true,
                    endsTurn: true,
                    eventData: {
                        item: it
                    }
                }
                return pickupEvent
                
            } else {
                return inputError("Your inventory is full")
            }
            
        } else {
            // nothing here, so rest
            
            let restEvent : Brew.IBrewEventData = {
                eventType: Brew.BrewEventType.Wait,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: true
            }
        
            return restEvent
        }
    }

    function inputExamine(gm: Brew.GameMaster, keycode: number) : Brew.IBrewEventData {
        let examineEvent : Brew.IBrewEventData = {
            eventType: Brew.BrewEventType.TargetingOn,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            eventData: {
                start_xy: gm.getPlayer().location,
                target_xy: gm.getPlayer().location,
                targetingAction: Brew.BrewTargetingAction.Examine
            }
        }
        
        return examineEvent
    }
    
    function inputInventory(gm: Brew.GameMaster, keycode: number) : Brew.IBrewEventData {
        let invEvent : Brew.IBrewEventData = {
            eventType: Brew.BrewEventType.InventoryOn,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            eventData: {
                inventory: gm.getPlayer().inventory
            }
        }
        return invEvent
    }
    
    function getScreenCoordsFromMouseEvent(gm: Brew.GameMaster, data: Brew.IBrewInputData) : Brew.Coordinate {
        
        // use ROT to translate on screen coords
        let rot_coords : number[]
        rot_coords = gm.display.getDisplay(Brew.DisplayNames.Game).eventToPosition(data.jsevent)
        
        if (rot_coords[0] == -1)  { // rot: coord outside of canvas
            return null
        }
        
        let screen_xy = new Brew.Coordinate(rot_coords[0], rot_coords[1])
        
        return screen_xy
    }
    
    function translateMouseInputIntoEvent(gm: Brew.GameMaster, data: Brew.IBrewInputData, envelope) : Brew.IBrewEventData {
        
        let screen_xy = getScreenCoordsFromMouseEvent(gm, data)
        if (!(screen_xy)) {
            return inputError("click outside of screen")
        }
        
        let map_xy = gm.display.convertScreenToMap(screen_xy)
        
        if (data.jsevent.type != "mousedown") {
            return inputHover(gm, map_xy)
        }
        
        if (data.button == 0) {
            // regular click
            return inputClick(gm, map_xy)
        } else {
            // return inputAltClick(gm, data, map_xy)
            return inputError("no alt clicking allowed")
        }
    }
    
    function inputHover(gm: Brew.GameMaster, map_xy: Brew.Coordinate) {
        let infoEvent : Brew.IBrewEventData = {
            eventType: Brew.BrewEventType.Info,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            eventData: {
                target_xy: map_xy
            }
        }
        
        return infoEvent
    }
    
    function inputClick(gm: Brew.GameMaster, map_xy: Brew.Coordinate) {
        let specialEvent : Brew.IBrewEventData = {
            eventType: Brew.BrewEventType.Special,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: true,
            eventData: {
                target_xy: map_xy
            }
        }
        
        return specialEvent
    }
    
} // end namespace