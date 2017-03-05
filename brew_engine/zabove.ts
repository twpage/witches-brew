module Brew {
    
}

module Brew.Definitions {

    export enum AboveType {
        Smoke = 1,
        Projectile,
        Flash
    }
    
    interface AboveDef {
        code?: string
        color?: number[]
    }
    
    let above_defaults : AboveDef = {
        code: "?",
        color: Brew.Color.black
    }
    
    // [key: number]: T
    interface IAboveDefs {
        [def_name: string] : AboveDef 
    } 
    
    let above_definitions  : IAboveDefs = {
        "Smoke": {
            code: "^",
            color: Brew.Color.red
        },
        "Projectile": {
            code: "*",
            color: Brew.Color.black
        },
        "Flash": {
            code: "#",
            color: Brew.Color.blue
        }
    }
    
    export function aboveFactory(above_type : AboveType, options : AboveDef = {}) : Brew.Above {
        let a : Brew.Above = new Brew.Above(above_type)
        
        // build up definition with 3 layers: default, given def, options
        // 1. default
        let def : AboveDef = clone(above_defaults)
        
        // 2. given definition
        let type_name = AboveType[above_type]
        let type_def = above_definitions[type_name]
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
            a[prop] = def[prop]
        }
        
        return a
    }
    
}