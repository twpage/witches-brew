module Brew.Definitions {

    export enum ItemType {
        Widget,
        Sprocket,
        Gear
    }
    
    interface ItemDef {
        code?: string
        color?: number[]
    }
    
    let item_defaults : ItemDef = {
        code: "?",
        color: Brew.Color.black
    }
    
    // [key: number]: T
    interface IItemDefs {
        [def_name: string] : ItemDef 
    } 
    
    let item_definitions  : IItemDefs = {
        "Widget": {
            code: "!",
            color: Brew.Color.black
        },
        "Spork": {
            code: "!",
            color: Brew.Color.green
        },
        "Gear": {
            code: "%",
            color: Brew.Color.orange
        }    
    }
    
    export function itemFactory(item_type : ItemType, options : ItemDef = {}) : Brew.Item {
        let i : Brew.Item = new Brew.Item(item_type)
        
        // build up definition with 3 layers: default, given def, options
        // 1. default
        let def : ItemDef = clone(item_defaults)
        
        // 2. given definition
        let type_name = ItemType[item_type]
        let type_def = item_definitions[type_name]
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
            i[prop] = def[prop]
        }
        
        return i
    }
    
}