namespace Brew.Intel {
    
    // called from postal.js channel
    export function mainAiHandler(gm: Brew.GameMaster, actor: Brew.Monster) : Brew.IBrewEventData {
        let level = gm.getCurrentLevel()
        let player = gm.getPlayer()
        
        // update FOV
        // todo: need this every turn for each monster?
        updateFov(gm, actor)
        
        // change status
        let is_changed : boolean
        is_changed = updateMonsterStatus(gm, actor)
        
        // find action
        
        // default event/action
        let ev : Brew.IBrewEventData = {
            actor: actor,
            eventType: Brew.BrewEventType.Wait,
            playerInitiated: false,
            endsTurn: true
        }

        if (actor.monster_status == Brew.MonsterStatus.Sleep) {
            // do nothing
            ;
            
        } else if (actor.monster_status == Brew.MonsterStatus.Wander) {
            
            // if we dont have a wander destination, get one
            if (!(actor.destination_xy)) {
                actor.destination_xy = getSafeLocation(gm, actor)
                actor.giveup = 0
            }
            
            if (actor.location.compare(actor.destination_xy)) {
                // reached our destination, get a new one
                actor.destination_xy = getSafeLocation(gm, actor)
                actor.giveup = 0
                 
            } else  {
                // haven't reached our destination yet
                if (actor.giveup > 4) {
                    // waited too long, get a new one
                    actor.destination_xy = getSafeLocation(gm, actor)
                    actor.giveup = 0
                    console.log(`${actor.name} gives up`)
                } else {
                    // keep our existing destination
                }
            }
            
            // go toward destination if possible
            let new_xy = getNextStepFromAStar(gm, actor, actor.destination_xy)
            
            if (!(new_xy)) {
                // couldn't pathfind, increase giveup count
                actor.giveup += 1
            } else {
                // got a valid path
                ev.eventType = Brew.BrewEventType.Move
                ev.eventData = {
                    from_xy: actor.location.clone(),
                    to_xy: new_xy
                }
            }
            
        } else if (actor.monster_status == Brew.MonsterStatus.Hunt) {
            let new_xy : Brew.Coordinate
            
            // manage keeps distance / ranged mobs
            if (actor.hasFlag(Flag.KeepsDistance)) {
                let dist = Math.floor(Utils.dist2d(actor.location, player.location))                
                
                if (dist < actor.attack_range )  {
                    // keep away 
                    new_xy = gm.pathmap_from_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player)
                } else if (dist > actor.attack_range) {
                    // move closer
                    new_xy = gm.pathmap_to_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player)
                } else {
                    
                    // range attack!
                    let attackEvent : Brew.IBrewEventData = {
                        actor: actor,
                        eventType: Brew.BrewEventType.Attack,
                        playerInitiated: false,
                        endsTurn: true,
                        eventData : {
                            from_xy: actor.location.clone(),
                            target: player,
                            to_xy: player.location.clone(),
                            isMelee: false
                        }
                    }
                    
                    attackEvent.targetingData = {
                        action: Brew.BrewTargetingAction.RangedAttack,
                        method: Brew.BrewTargetingMethod.StraightLine,
                        destinationMustBeVisible: true,
                        destinationMustHaveMob: true,
                        destinationMustBeWalkable: true,
                        from_xy: attackEvent.eventData.from_xy,
                        to_xy: attackEvent.eventData.to_xy,
                        pathBlockedByMobs: true
                    }
                    
                    // check this attack first
                    let rangeAttackCheck = Events.checkTargetingPath(gm, attackEvent)
                    
                    if (rangeAttackCheck.is_valid) {
                        return attackEvent
                    } else {
                        console.log("shot blocked!")
                        new_xy = gm.pathmap_to_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player)
                    }
                    
                }
                   
            } else {
                new_xy = gm.pathmap_to_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player)    
            }
            
            if (!(new_xy)) {
                // couldn't pathfind, increase giveup count
                actor.giveup += 1
            } else if (new_xy.compare(player.location)) {
                // attack!
                ev.eventType = Brew.BrewEventType.Attack
                ev.eventData = {
                    from_xy: actor.location.clone(),
                    target: player,
                    to_xy: player.location.clone(),
                    isMelee: true
                }
            } else {
                // got a valid path
                ev.eventType = Brew.BrewEventType.Move
                ev.eventData = {
                    from_xy: actor.location.clone(),
                    to_xy: new_xy
                }
            }
        } else if (actor.monster_status == Brew.MonsterStatus.Escape) {
            // todo: escape
        } else {
            throw new Error(`unknown monster status ${actor.monster_status} for ${actor.getID()}`)
        }
        
        return ev
    }
    
    function updateMonsterStatus(gm: Brew.GameMaster, actor: Brew.Monster) : boolean {
        let init_status = actor.monster_status
        let new_status : Brew.MonsterStatus
        
        if (actor.monster_status == Brew.MonsterStatus.Sleep) {
            new_status = Brew.MonsterStatus.Sleep
            
        } else if (actor.monster_status == Brew.MonsterStatus.Wander) {
            if (actor.inFOV(gm.getPlayer())) {
                // see the player for the 'first' time
                new_status = Brew.MonsterStatus.Hunt  
                actor.destination_xy = gm.getPlayer().location
                
            } else {
                // keep wandering
                new_status = Brew.MonsterStatus.Wander
            }
            
        } else if (actor.monster_status == Brew.MonsterStatus.Hunt) {
            if (actor.inFOV(gm.getPlayer())) {
                // still hunting
                new_status = Brew.MonsterStatus.Hunt  
            } else {
                // stop hunting
                new_status = Brew.MonsterStatus.Wander
            }
            
        } else if (actor.monster_status == Brew.MonsterStatus.Escape) {
            // todo: escape
            new_status = Brew.MonsterStatus.Escape
            
        } else {
            throw new Error(`unknown monster status ${actor.monster_status} for ${actor.getID()}`)
        }
        
        actor.monster_status = new_status
        return init_status == new_status
    }
    
    function getNextStepFromAStar(gm: Brew.GameMaster, actor: Brew.Monster, destination_xy: Brew.Coordinate) : Brew.Coordinate {
        let path = getPathFromAStar(gm, actor, destination_xy)
        if (path.length <= 1) {
            return null
        } else {
            return path[1]
        }
    }
    
    function getPathFromAStar(gm: Brew.GameMaster, actor: Brew.Monster, destination_xy: Brew.Coordinate) : Array<Brew.Coordinate> {
        let level = gm.getCurrentLevel()
        let fn_passable = (x: number, y: number) : boolean => {
            let xy = new Brew.Coordinate(x, y)
            
            if (!(level.isValid(xy))) {
                return false
            }
            
            if (level.monsters.hasAt(xy) && (!(actor.location.compare(xy))))  {
                return false
            }
            
            let t = level.terrain.getAt(xy)
            return (!(t.blocks_walking))
        }
        
        let path : Array<Brew.Coordinate> = []
        let fn_update_path = (x: number, y: number) : void => {
            // let xy = new Brew.Coordinate(x, y)
            path.push(new Brew.Coordinate(x, y))
        }
            
        let astar = new ROT.Path.AStar(destination_xy.x, destination_xy.y, fn_passable, {})
        astar.compute(actor.location.x, actor.location.y, fn_update_path)
        
        return path 
    }
    
    function getSafeLocation(gm: Brew.GameMaster, actor: Brew.Monster) : Brew.Coordinate {
        // returns a walkable, monster-free location
        
        let xy : Brew.Coordinate
        let tries = 0
        while (tries < 50) {
            xy = Brew.randomOf(gm.getCurrentLevel().floors)
            if (!(gm.getCurrentLevel().monsters.hasAt(xy))) {
                return xy
            }
            tries += 1
        }
        
        console.error("unable to find safe location")
        return null
    }
    
    export function runBeforePlayerTurn(gm: Brew.GameMaster, actor: Brew.Monster) {
        let updates = updateFov(gm, actor)
        
        gm.displayList(updates)  
    }
    
    export function runAfterPlayerTurn(gm: Brew.GameMaster, actor: Brew.Monster) {
        gm.pathmap_to_player = Brew.Path.createGenericMapToPlayer(gm, gm.getCurrentLevel())
        gm.pathmap_from_player = Brew.Path.createMapFromPlayer(gm, gm.getCurrentLevel(), gm.pathmap_to_player)
    }
    
    function isPlayer(actor: Brew.Monster) : boolean {
        return actor.isType(Brew.Definitions.MonsterType.Hero)
    }
    
    export function updateFov(gm: Brew.GameMaster, actor: Brew.Monster) : Array<Brew.Coordinate> {
        let old_fov : Array<Brew.Coordinate> = actor.fov.getAllCoordinates()
        let xy: Brew.Coordinate
        let numberkey : number
        
        actor.clearFov()
        actor.clearKnowledge()
        let level = gm.getCurrentLevel()
        let t : Brew.Terrain
        
        let fn_allow_vision = (x: number, y: number) => { 

			xy = new Brew.Coordinate(x, y)
            
			// can never see outside the level
            if (!(level.isValid(xy))) {
                return false
            } 
            
			//  can always see where you are standing
			if (xy.compare(actor.location)) {
				return true
            }
			
            t = level.terrain.getAt(xy)
            return (!(t.blocks_vision))
        }
        
        let fn_update_fov = (x, y, r, visibility) => {
			// TODO: also update level for lightcasting
			// ye_level.setLightAt(new Coordinate(x, y), 1)
            xy = new Brew.Coordinate(x, y)
            if (level.isValid(xy)) {
                // todo: add level to fov definition
                actor.fov.setAt(xy, true)
                updateMemoryAt(gm, actor, xy)
            }
            
			return true
        }
        
        // debug fov: see all
        if (isPlayer(actor) && (Brew.Debug.debug_vision == Brew.Debug.Vision.ShowAll)) {
            
            level.terrain.getAllCoordinates().forEach((xy, index, array) => {
                actor.fov.setAt(xy, true)
            })
        } else {
            // otherwise, run FOV normally
            // let rot_fov = new ROT.FOV.PreciseShadowcasting(fn_allow_vision, {})
            // rot_fov.compute(actor.location.x, actor.location.y, actor.sight_range, fn_update_fov)
            let rot_fov = new ROT.FOV.RecursiveShadowcasting(fn_allow_vision, {})
            rot_fov.compute(actor.location.x, actor.location.y, actor.sight_range, fn_update_fov)
        }
        
        // debug fov: add other monster view
        // todo: add different types of view for shading/whatever (e.g. not just boolean true/false)
        if (isPlayer(actor) && (Brew.Debug.debug_vision == Brew.Debug.Vision.ShowMobs)) {
            actor.clearFov()
            level.monsters.getAllThings().forEach((mob: Brew.Monster, index, array) => {
                if (mob.getID() == actor.getID()) {
                    return
                }
                
                mob.fov.getAllCoordinates().forEach((xy, index, array) => {
                    actor.fov.setAt(xy, true)
                })
            })
        }
        
        let return_xy = Brew.Utils.diffOfCoordinateArrays(old_fov, actor.fov.getAllCoordinates())
        
        return return_xy
    }
    
    export function updateMemoryAt(gm: Brew.GameMaster, actor: Brew.Monster, xy: Brew.Coordinate) {
        let level = gm.getCurrentLevel()
        
        if (actor.memory.hasAt(xy)) {
            actor.memory.removeAt(xy)
        }
        actor.memory.setAt(xy, level.terrain.getAt(xy))
        
        let it = level.items.getAt(xy)
        
        if (it) {
            // console.log("added item to memoryu", it.location)
            actor.memory.removeAt(xy)
            actor.memory.setAt(xy, it)
        }
    }

} // end namespace