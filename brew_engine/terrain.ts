module Brew.Definitions {

    export enum TerrainType {
        Wall,
        Floor,
        Chasm,
        Grass,
        Highlight
    }
    
    interface TerrainDef {
        code?: string
        color?: number[]
        blocks_walking?: boolean
        blocks_vision?: boolean
    }
    
    let terrain_defaults : TerrainDef = {
        code: " ",
        color: Brew.Color.normal,
        blocks_walking: false,
        blocks_vision: false
    }
    
    // [key: number]: T
    interface ITerrainDefs {
        [def_name: string] : TerrainDef 
    } 
    
    let terrain_definitions : ITerrainDefs = {
        "Wall": {
            code: "#",
            blocks_walking: true,
            blocks_vision: true 
        },
        "Floor":  {
            code: ".",
            blocks_walking: false,
            blocks_vision: false 
        },
        "Chasm":  {
            code: ":",
            blocks_walking: true,
            blocks_vision: false 
        },
        "Grass":  {
            code: "\"",
            blocks_walking: false,
            blocks_vision: false 
        },
        "Highlight": {
            code: " "
        }
    }
    
    export function terrainFactory(terrain_type : TerrainType, options : TerrainDef = {}) : Brew.Terrain {
        let t : Brew.Terrain = new Brew.Terrain(terrain_type)
        
        // build up definition with 3 layers: default, given def, options
        // 1. default
        let def : TerrainDef = clone(terrain_defaults)
        
        // 2. given definition
        let type_name = TerrainType[terrain_type]
        let type_def = terrain_definitions[type_name]
        for (let prop in type_def) {
            // console.log("typedef", prop, type_def[prop])
            def[prop] = type_def[prop]
        } 
        
        // 3. options
        for (let prop in options) {
            // console.log("options", prop, options[prop])
            def[prop] = options[prop]
        }
        
        // 4. set all properties
        for (let prop in def) {
            t[prop] = def[prop]
        }
        
        return t
    }
    
}