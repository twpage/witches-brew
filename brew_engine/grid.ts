module Brew {
    const MAX_GRID_SIZE = 1024
    export function xyToKey(xy: Coordinate) : number {
        return (xy.y * MAX_GRID_SIZE) + xy.x
    } 
    
    export function keyToXY(key: number) : Coordinate {
        return new Coordinate(key % MAX_GRID_SIZE, Math.floor(key / MAX_GRID_SIZE))
    }

    export function adjacentKeys(key: number) : number[] {
        // returns keys of 4 adjacent xy coords
        // todo: cache this
        return keyToXY(key).getAdjacent().map((xy:Brew.Coordinate, index, array) => { return xyToKey(xy) })
    }
    
    enum BrewObjectType {
        Thing = 1,
        Terrain,
        Item,
        Monster,
        Above
    }
    
    export class Coordinate {
        public x: number
        public y: number
        
		constructor (xx: number, yy: number) {
            this.x = xx
            this.y = yy
        }
        
        toString () {
            return `(${this.x}, ${this.y})`
        }
		
		clone () : Brew.Coordinate {
			return new Brew.Coordinate(this.x, this.y)
		}
		
		compare(other_xy: Brew.Coordinate) : boolean {
            return (this.x == other_xy.x) && (this.y == other_xy.y)
        }
        
        add (other_xy: Brew.Coordinate) : Brew.Coordinate {
			let xy = new Brew.Coordinate(this.x + other_xy.x, this.y + other_xy.y)
			return xy
		}
		
		subtract (other_xy: Brew.Coordinate) : Brew.Coordinate {
			let xy = new Brew.Coordinate(this.x - other_xy.x, this.y - other_xy.y)
			return xy
		}
		
		toUnit () : Brew.Coordinate {
			let x_sign : number = (this.x == 0) ? 0 : (Math.abs(this.x) / this.x)
			let y_sign : number = (this.y == 0) ? 0 : (Math.abs(this.y) / this.y)
			let xy = new Brew.Coordinate(x_sign, y_sign)
			return xy
		}
        
        getAdjacent() : Array<Brew.Coordinate> {
            return [
                this.add(Brew.Directions.UP),
                this.add(Brew.Directions.DOWN),
                this.add(Brew.Directions.LEFT),
                this.add(Brew.Directions.RIGHT)
            ]
        }
    }

    let init_id = Math.floor(ROT.RNG.getUniform() * 999) + 1
    function generateID() : number {
        init_id += 1
        return init_id
    }
    
    export class Thing {
        // public id: number
        protected objtype: BrewObjectType = BrewObjectType.Thing
        protected definition: any
        protected id : number
        
        public name: string = "unnamed_thing"
        public code: string = "0"
        public color: number[]
        public location: Coordinate
        
        constructor (objtype: BrewObjectType, definition: any) {
            this.objtype = objtype
            this.definition = definition
            this.id = generateID()
        }
        
        public setLocation(xyNew: Coordinate) : void {
            this.location = xyNew
        }
        
        public getDefinition() : any {
            return this.definition
        }
        
        public isType(other_definition: any) : boolean {
            return other_definition == this.definition
        } 
        
        public getID() : number {
            return this.id
        }
        
        public isSameThing(other_thing: Brew.Thing) : boolean {
            return this.getID() === other_thing.getID()
        }
    }
    
    export class Terrain extends Thing {
        blocks_walking: boolean
        blocks_vision: boolean

        constructor (definition: Brew.Definitions.TerrainType) {
            super(BrewObjectType.Terrain, definition)
        }
    }
    
    export class Item extends Thing {

        constructor (definition: Brew.Definitions.ItemType) {
            super(BrewObjectType.Item, definition)
        }
    }
    
    export class Above extends Thing {

        constructor (definition: Brew.Definitions.AboveType) {
            super(BrewObjectType.Above, definition)
        }
    }

    export enum MonsterStatus {
        Sleep,
        Wander,
        Hunt,
        Escape
    }
    
    interface IInventoryItemCatalog {
        [invkey: string]: IInventoryItem
    }

    interface IInventoryItem  {
        item: Brew.Item
        num_stacked: number
    }
    
    let default_inv_keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    
    export class Inventory {
        private items: IInventoryItemCatalog = {}
        num_items: number
        max_items: number
        inv_keys: string[]
        // assign_key_fn: () => string
                
        constructor(max_items: number, inv_keys: string[] = default_inv_keys) {
            // this.items = {}
            this.num_items = 0
            this.max_items = max_items
            this.inv_keys = inv_keys
            
            if (inv_keys.length < max_items) {
                throw new Error("Not enough inventory keys given for maximum number of items")
            }
        }
        
        hasCapacity() : boolean {
            return this.num_items < this.max_items
        }
        
        addItem(an_item: Brew.Item) : boolean {
            // returns false if inv is full
            if (this.num_items == this.max_items) {
                return false
            }
            
            let invkey = this.assignInventoryKey(an_item)
            this.items[invkey] = {
                item: an_item,
                num_stacked: 1
            }
            this.num_items += 1
            return true
        }
        
        assignInventoryKey(an_item: Brew.Item) : string {
            for (let key_value of this.inv_keys) {
                console.log(key_value, (!(key_value in this.items)))
                if (!(key_value in this.items)) {
                    return key_value
                }
            }
            
            throw new Error("Ran out of free inventory keys")
        }
        
        getItemByKey(inv_key: string) : Brew.Item {
            if (!(inv_key in this.items)) {
                throw new Error(`No item linked to inventory key: ${inv_key}`)
            }
            
            return this.items[inv_key].item
        }
        
        getInventoryItemByKey(inv_key: string) : IInventoryItem {
            if (!(inv_key in this.items)) {
                throw new Error(`No item linked to inventory key: ${inv_key}`)
            }
            
            return this.items[inv_key]
        }
        
        removeItemByKey(inv_key: string) : void {
            if (!(inv_key in this.items)) {
                throw new Error(`No item linked to inventory key: ${inv_key}`)
            }
            
            delete this.items[inv_key]
            this.num_items -= 1
        }
        
        getItems() : Array<Brew.Item> {
            let results : Array<Item> = []
            
            for (let invkey in this.items) {
                 results.push(this.items[invkey].item)
            }
            
            return results
        }
        
        getKeys() : Array<string> {
            let results : Array<string> = []
            
            for (let invkey in this.items) {
                results.push(invkey)
            }
            
            return results
        }
        
        
    }
    
    export class Monster extends Thing {
        speed: number
        sight_range: number
        monster_status: MonsterStatus
        destination_xy: Brew.Coordinate
        giveup: number
        attack_range: number = 1
        
        fov: GridOfThings<boolean>
        knowledge: GridOfThings<Thing>
        memory: GridOfThings<Thing>
        flags: Array<Brew.Flag> = []
        
        inventory: Inventory
        
        constructor (definition: Brew.Definitions.MonsterType) {
            super(BrewObjectType.Monster, definition)
            this.fov = new GridOfThings<boolean>()
            this.knowledge = new GridOfThings<Thing>()
            this.memory = new GridOfThings<Thing>()
            // this.flags = []
        }
        
        getSpeed() : number {
            return this.speed
        }

        act(): void {} // gets overridden by factory creation 

        clearFov() : void {
            this.fov = new Brew.GridOfThings<boolean>()
        }   
        
        clearKnowledge() : void {
            this.knowledge = new Brew.GridOfThings<Thing>()
        }

        inFOV(target: Brew.Thing) {
            return (this.fov.hasAt(target.location))
        }

        setFlag(flag: Brew.Flag) {
            Brew.remove(this.flags, flag)
            this.flags.push(flag)
        }
        
        removeFlag(flag: Brew.Flag) {
            Brew.remove(this.flags, flag)
        }
        
        hasFlag(flag: Brew.Flag) : boolean {
            return (this.flags.indexOf(flag) > -1) 
        }
    }
    
	interface ThingInterface {
		location: Brew.Coordinate
		code: string
	}
	
    interface Dict<T> {
        [key: number]: T
    }
    	
    export class GridOfThings<T> {

        // things: Dict<ThingInterface> = {}
        things: Dict<T> = {}
        
        hasAt (xy: Coordinate) : boolean {
            var key = xyToKey(xy)
            
            if (key in this.things) {
                return true
            } else { 
                return false
            }
        }
        
        getAt (xy: Coordinate) : T {
            if (this.hasAt(xy)) {
                var key = xyToKey(xy)
                return this.things[key]
            } else {
                return null
            }
        }
        
        // setAt (xy: Coordinate, something: Thing) : boolean {
        setAt (xy: Coordinate, something: T) : boolean {
            if (this.hasAt(xy)) {
                return false
            } else {
                var key = xyToKey(xy)
                this.things[key] = something
                
                // if its a Thing, set its location on the object as well 
                if (something instanceof Thing) {
                    (something as any).location = xy
                } 

                // something["location"] = xy

                return true
            }
        }
        
        removeAt (xy: Coordinate) : boolean {
            // returns true if we removed something, false if not
            if (this.hasAt(xy)) {
                var key = xyToKey(xy)
                delete this.things[key]
                return true
            } else {
                return false
            }
        }
        
        getAllCoordinates() : Array<Brew.Coordinate> {
            let xy: Brew.Coordinate
            let numberkey : number
            let coords : Array<Brew.Coordinate> = []
            
            for (let key in this.things) {
                numberkey = parseInt(key)
                xy = keyToXY(numberkey)
                coords.push(xy)
            }
            
            return coords
        }
        
        getAllThings() : Array<T> {
            let values : Array<T> = []
            for (let key in this.things) {
                values.push(this.things[key])
            }
            
            return values
        }
    }
    
    export class Level {
        width: number
        height: number
        depth: number
        simple_start_xy: Brew.Coordinate
        floors: Array<Brew.Coordinate>
        
        monsters: Brew.GridOfThings<Brew.Monster>
        terrain: Brew.GridOfThings<Brew.Terrain>
        items: Brew.GridOfThings<Brew.Item>
        above: Brew.GridOfThings<Brew.Above>
        
        constructor(width: number, height: number, depth?: number) {
            this.width = width
            this.height = height
            this.depth = depth || 0
            
            this.terrain = new Brew.GridOfThings<Brew.Terrain>()
            this.monsters = new Brew.GridOfThings<Brew.Monster>()
            this.items = new Brew.GridOfThings<Brew.Item>()
            this.above = new Brew.GridOfThings<Brew.Above>()
            
            this.constructLevel() // TODO: export to level builder class
        }
        
        constructLevel() : void {
            let terrain: Brew.Terrain
            var floors : Array<Brew.Coordinate> = []
            
            let easyMap = (x: number, y: number, what: number) => {
                let xy: Brew.Coordinate = new Brew.Coordinate(x, y)
                
                if (what == 1) {
                    terrain = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Wall)
                } else if (what == 0) {
                    terrain = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Floor)
                    floors.push(xy)
                } else {
                    throw new RangeError(`Unexpected levelgen return value ${what}`)
                }
                
                this.terrain.setAt(xy, terrain)
            }
            
            let rotMap = new ROT.Map.Rogue(this.width, this.height)
            rotMap.create(easyMap)
            
            // unless otherwise specified, pick a random start location
            this.simple_start_xy = Brew.randomOf(floors)
            this.floors = floors
            
            // some items
            let it : Brew.Item
            for (let i = 0; i < 4; i++) {
                it = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Widget)
                this.items.setAt(Brew.randomOf(floors), it)
            } 
            
        }
		
		isValid (xy: Brew.Coordinate) : boolean {
			return (xy.x >= 0) && (xy.y >= 0) && (xy.x < this.width) && (xy.y < this.height) 
		}
    }
    
}