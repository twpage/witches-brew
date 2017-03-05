namespace Brew.Debug {
    export enum Vision {
        Normal,
        ShowMobs,
        ShowAll
    }
    
    export let debug_vision : Vision = Vision.Normal
    export let debug_pathmap : Brew.Path.Pathmap = null
    let debug_pathmap_id : number = 0
    
    export function toggleFOV(gm: Brew.GameMaster) {
        let i : number = debug_vision
        i = (i + 1) % 3
        let dv :string = Vision[i]
        debug_vision = Vision[dv]

        let updatefov = Intel.updateFov(gm, gm.getPlayer())
        console.log("debug view:", dv)
        gm.displayAll()
    }
    
    export function togglePathmap(gm: Brew.GameMaster, pm: Brew.Path.Pathmap) {
        
        debug_pathmap_id = (debug_pathmap_id + 1) % 3
        
        if (debug_pathmap_id == 0) {
            debug_pathmap = null
        } else if (debug_pathmap_id == 1) {
            debug_pathmap = gm.pathmap_to_player
        } else if (debug_pathmap_id == 2) {
            let to_map = Path.createGenericMapToPlayer(gm, gm.getCurrentLevel())
            debug_pathmap = gm.pathmap_from_player
         }
        
        gm.displayAll()
    }
}