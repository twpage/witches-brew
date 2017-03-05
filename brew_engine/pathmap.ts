namespace Brew.Path {
    
    let MAX_INT = Number.MAX_VALUE
    
    export enum PathmapType {
        ToTarget,
        EscapeTarget
    }
    
    export class Pathmap {
        pathtype: PathmapType
        field : GridOfThings<number>
        passable_keys_list : number[]
        
        // mostly for displaying debug
        max_value : number
        min_value : number 

        constructor(level: Brew.Level, pathtype: PathmapType) {
            this.field = new GridOfThings<number>()
            this.pathtype = pathtype
            this.initBlankPathmap(level)
        }
        
        initBlankPathmap(level: Brew.Level) {
            // fill in entire map with MAX INT
            
            for (let x = 0; x < level.width; x++) {
                for (let y = 0; y < level.height; y++) {
                    let xy = new Brew.Coordinate(x, y)
                    this.field.setAt(xy, MAX_INT)
                }
            }
            // todo: quicker way to fill in entier 2D array with number?
        }
        
        setPassableKeysList(passable_keys: number[]) {
            this.passable_keys_list = passable_keys
        }
        
        solve() {
            let made_changes = true
            let num_passes = 0
            
            while (made_changes) {
                made_changes = false
                
                for (let i = 0; i < this.passable_keys_list.length; i++) {
                    let key = this.passable_keys_list[i]
                    
                    let adj_keys = adjacentKeys(key)
                    let neighbor_val = MAX_INT
                    
                    for (let n = 0; n < adj_keys.length; n++) {
                        let adj_val = this.field.things[adj_keys[n]]
                        
                        if (adj_val != undefined) {
                            if (adj_val < MAX_INT) {
                                // console.log(adj_val)
                            }
                            neighbor_val = Math.min(neighbor_val, adj_val)
                        }
                    }
                    
                    if ((this.field.things[key] - neighbor_val) >= 2) {
                        this.field.things[key] = neighbor_val + 1
                        // console.log("changed", key)
                        made_changes = true
                    }
                }
                
                num_passes  += 1
            }
            
            this.max_value = null
            this.min_value = null
            
            this.field.getAllThings().forEach((value, index, array) => {
                if (value && (value != MAX_INT)) {
                    if (this.max_value) {
                        this.max_value = Math.max(this.max_value, value)
                    } else {
                        this.max_value = value
                    }
                    
                    if (this.min_value) {
                        this.min_value = Math.min(this.min_value, value)
                    } else {
                        this.min_value = value
                    }
                }
            })
        }
        
        getDownhillNeighbor(from_xy: Brew.Coordinate) : Brew.Coordinate {
            let lowest_xy = from_xy
            let lowest_val = this.field.getAt(lowest_xy)
            
            lowest_xy.getAdjacent().forEach((xy:Brew.Coordinate, index, array) => {
                let temp_val = this.field.getAt(xy)
                if (temp_val < lowest_val) {
                    lowest_val = temp_val
                    lowest_xy = xy
                }
            })
            
            return lowest_xy
        }

        getUnblockedDownhillNeighbor(from_xy: Brew.Coordinate, level: Brew.Level, except_mob?: Brew.Monster) : Brew.Coordinate {
            // return lowest-value cell not blocked by another something
            let lowest_xy = from_xy
            let lowest_val = this.field.getAt(lowest_xy)
            
            lowest_xy.getAdjacent().forEach((xy:Brew.Coordinate, index, array) => {
                let temp_val = this.field.getAt(xy)
                
                let m = level.monsters.getAt(xy)
                if (m && (!((except_mob != null) && m.isSameThing(except_mob)))) {
                    return
                }
                
                if (temp_val < lowest_val) {
                    lowest_val = temp_val
                    lowest_xy = xy
                }
            })
            
            return lowest_xy
        }
        
    }//end class
    
    export function createGenericMapToPlayer(gm: Brew.GameMaster, level: Brew.Level) : Pathmap {
        let pm = new Pathmap(level, PathmapType.ToTarget)
        
        let mob : Brew.Monster
        let player = gm.getPlayer()
        
        let passable_keys_list : number[] = level.floors.map((xy:Brew.Coordinate, index, array) => {
            return xyToKey(xy)
        })
        
        // // remove monsters from passable spots
        // level.monsters.getAllCoordinates().forEach((xy:Brew.Coordinate, index, array) =>{
        //     let m = level.monsters.getAt(xy)
            
        //     if (m.isSameThing(player)) {
        //         // skip
        //     } else {
        //         Brew.remove(passable_keys_list, xyToKey(xy))
        //     }
        // })
        
        // set target to 0
        pm.field.removeAt(player.location)
        pm.field.setAt(player.location, 0)
        pm.setPassableKeysList(passable_keys_list)
        pm.solve()
        return pm
    }
    
    export function createMapFromPlayer(gm: Brew.GameMaster, level: Brew.Level, to_map: Pathmap) : Pathmap {
        let from_map = new Pathmap(level, PathmapType.EscapeTarget)
        let escape_factor = -1.2
        
        let player = gm.getPlayer()
        
        // invert the to-map
        to_map.field.getAllCoordinates().forEach((xy:Brew.Coordinate, index, array) => {
            let path_val = to_map.field.getAt(xy)
            if (path_val != MAX_INT) {
                from_map.field.removeAt(xy)    
                from_map.field.setAt(xy, path_val * escape_factor)
            }
        })
        
        let passable_keys_list : number[] = level.floors.map((xy:Brew.Coordinate, index, array) => {
            return xyToKey(xy)
        })
        
        // // remove monsters from passable spots
        // level.monsters.getAllCoordinates().forEach((xy:Brew.Coordinate, index, array) =>{
        //     let m = level.monsters.getAt(xy)
            
        //     if (m.isSameThing(player)) {
        //         // skip
        //     } else {
        //         Brew.remove(passable_keys_list, xyToKey(xy))
        //     }
        // })
       
        // set target to 0
        from_map.field.removeAt(player.location)
        from_map.field.setAt(player.location, MAX_INT)
        from_map.setPassableKeysList(passable_keys_list)
        from_map.solve()
        return from_map
    }
}