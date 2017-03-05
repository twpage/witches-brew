module Brew.Config {
	export const screen_width_tiles = 20
    export const screen_height_tiles = 20
    export const map_width_tiles = screen_width_tiles
    export const map_height_tiles = screen_height_tiles
}

// module Brew.Keys {
// 	export const Movement = [Brew.KeyMap.MoveDown, Brew.KeyMap.MoveL ]
// 	export const Action = [ROT.VK_SPACE]
// }

module Brew.KeyMap {
    export const MoveRight = [ROT.VK_RIGHT, ROT.VK_D]
    export const MoveLeft = [ROT.VK_LEFT, ROT.VK_A]
    export const MoveUp = [ROT.VK_UP, ROT.VK_W]
    export const MoveDown = [ROT.VK_DOWN, ROT.VK_S]
    export const MovementKeys = MoveRight.concat(MoveLeft, MoveUp, MoveDown)
    
    export const Action = [ROT.VK_SPACE, ROT.VK_RETURN]
    export const Examine = [ROT.VK_X]
    export const Inventory = [ROT.VK_I]
    export const DebugFOV = [ROT.VK_SLASH]
    export const DebugPaths = [ROT.VK_Q]
    
    export const Escape = [ROT.VK_ESCAPE]
}

module Brew.Directions {
	export const UP = new Brew.Coordinate(0, -1)
	export const DOWN = new Brew.Coordinate(0, 1)
	export const LEFT = new Brew.Coordinate(-1, 0)
	export const RIGHT = new Brew.Coordinate(1, 0)
}

module Brew.Color {
    // 'system' colors
	export const normal = [150, 150, 150]
	export const black = [10, 10, 10]
    
    // basic colors
    export const white = [255, 255, 255]
	export const blue = [0, 204, 255]
	export const orange = [255, 102, 0]
    export const green = [0, 204, 0]
    export const yellow = [246, 198, 91]
    export const red = [204, 0, 0]
    
    // targeting paths
    export const target_path = Brew.Color.yellow 
    export const target_cursor = Brew.Color.orange
    export const target_error = Brew.Color.red

    // FOV / memory
    export const bg_unexplored = Brew.Color.white
    export const bg_explored = Brew.Color.white
    export const memory = [80, 80, 104]

}

namespace Brew {
    export enum Flag {
        KeepsDistance,
        SeeAll,
        IsInvisible
    }
}
// interface IBrewFlag {
//     // name : string
//     desc_player: string
//     desc_enemy: string
// }
 
// export enum Flags {
//     KeepsDistance,
//     SeeAll,
//     IsInvisible
// }

// module Brew.Flags {
//     export const keeps_distance : IBrewFlag = {
//         // name: "keeps_distance",
//         desc_player: null,
//         desc_enemy: "attacks from a distance"
//     }
//     export const see_all : IBrewFlag = {
//         desc_player: "all-seeing",
//         desc_enemy: "sees everywhere"
//     }
//     export const is_invisible: IBrewFlag = {
//         desc_player: "is invisible",
//         desc_enemy: "is invisible"
//     }
// }