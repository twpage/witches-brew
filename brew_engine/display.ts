module Brew {
    export enum DisplayNames {
        Game,
        Layer,
        HUD
    }
    
    export class Display {
        private rot_displays: { [name: string]: ROT.Display }
        private gm: Brew.GameMaster
        public highlights : Brew.GridOfThings<Brew.Terrain>
        
        private my_tile_width : number 
        private my_tile_height : number
        
       
        constructor(gm: Brew.GameMaster, div_container : HTMLDivElement) {
            this.rot_displays = {}
            this.gm = gm
            this.highlights = new Brew.GridOfThings<Brew.Terrain>()
            
            // setup ROTjs canvas(es)
            this.initCanvas(div_container, Brew.Config.screen_width_tiles, Brew.Config.screen_height_tiles)

            // this.my_tile_width = this.getDisplay(DisplayNames.Game).getContainer().width / Config.screen_width_tiles
            // this.my_tile_height = this.getDisplay(DisplayNames.Game).getContainer().height / Config.screen_height_tiles

        }
        
        initCanvas(div_container: HTMLDivElement, width: number, height: number) : void {
            // game - main screen
            let gameDisplay = new ROT.Display({
                width: width,
                height: height,
                border: 0,
                spacing: 1.15,
                bg: ROT.Color.toHex(Brew.Color.bg_unexplored)
            })
            
            // console.log(gameDisplay.getContainer())
            div_container.appendChild(gameDisplay.getContainer())
            let rect : ClientRect = gameDisplay.getContainer().getBoundingClientRect()
            this.addDisplay(DisplayNames.Game, gameDisplay)
            
            // hud - targeting, highlighting, etc
            let hudDisplay = new ROT.Display({
                width: width,
                height: height,
                border: 0,
                spacing: 1.15,
                bg: "transparent"
            })

            div_container.appendChild(hudDisplay.getContainer())
            hudDisplay.getContainer().style.position = "absolute"
            hudDisplay.getContainer().style.top =  rect.top.toString()
            hudDisplay.getContainer().style.left = rect.left.toString()
            this.addDisplay(DisplayNames.HUD, hudDisplay)
        }
        

        // Display management
        addDisplay(name: DisplayNames, disp: ROT.Display) : void {
            this.rot_displays[name] = disp
        }
        
        getDisplay(name: DisplayNames) : ROT.Display {
            // make sure display exists
            if (!(name in this.rot_displays)) {
                throw new RangeError(`cannot find ROT display named ${name}`)
            } 
            
            return this.rot_displays[name];
        }
        
        clearAll() : void {
            for (let name in this.rot_displays) {
                let displayName = DisplayNames[name]
                this.clearDisplay(displayName)
            }
        }
        
        clearDisplay(name: DisplayNames) {
            let display = this.getDisplay(name)
            display._context.clearRect(0, 0, display.getContainer().width, display.getContainer().height)
        }
        
        // Drawing on the grid
        drawAll(display_options: IDisplayOptions) : void {
            for (let x = 0; x < Brew.Config.screen_width_tiles; x++) {
                for (let y = 0; y < Brew.Config.screen_height_tiles; y++) {
                    this.drawAt(new Brew.Coordinate(x, y), display_options)
                }
            }
        }
        
        drawAt(xy: Brew.Coordinate, display_options? : IDisplayOptions) : boolean {
            
            let draw : any[]
                        
            if (Brew.Debug.debug_pathmap) {
                
                let path_value = Brew.Debug.debug_pathmap.field.getAt(xy)
                
                if (path_value < Brew.Debug.debug_pathmap.max_value) {
                    let pc_of_max : number
                    let color_value : number[]
                    if (path_value < 0) {
                        pc_of_max = (path_value / Brew.Debug.debug_pathmap.min_value)  
                        color_value = ROT.Color.interpolate(Brew.Color.blue, Brew.Color.white, 1 - pc_of_max)
                    } else {
                        pc_of_max = (path_value / Brew.Debug.debug_pathmap.max_value)
                        color_value = ROT.Color.interpolate(Brew.Color.blue, Brew.Color.white, pc_of_max)    
                    }
                    
                    this.getDisplay(DisplayNames.Game).draw(xy.x, xy.y, " ", ROT.Color.toHex(Brew.Color.white), ROT.Color.toHex(color_value))
                    
                    return true
                }
            }

            // 0. PLAYER FOV
            let in_fov: boolean
            in_fov = this.gm.getPlayer().fov.hasAt(xy)
            
            if (!(in_fov)) {
                // not in view, check memory
                let mem = this.gm.getPlayer().memory.getAt(xy)
                
                if (mem) {
                    // saw it before
                    draw = [mem.code, Brew.Color.memory, Brew.Color.bg_explored]
                    
                } else {
                    // never seen it
                    draw = [' ', Brew.Color.black, Brew.Color.bg_unexplored]
                }
                
            } else {
                // IN VIEW
                
                // 1. TERRAIN
                let terrain = this.gm.getCurrentLevel().terrain.getAt(xy)
                
                if (terrain == null) {
                    // debugger
                } 
                draw = [terrain.code, Brew.Color.normal, Brew.Color.bg_explored]
                
                // 2. ITEMS
                let item = this.gm.getCurrentLevel().items.getAt(xy)
                if (item) {
                    draw = [item.code, item.color, Brew.Color.bg_explored]
                }
                
                // 3. MONSTERS
                let mob = this.gm.getCurrentLevel().monsters.getAt(xy)
                if (mob) {
                    draw = [mob.code, mob.color, Brew.Color.bg_explored]
                }

                // 4. ABOVE / OVERHEAD
                let ab = this.gm.getCurrentLevel().above.getAt(xy)
                if (ab) {
                    draw[0] = ab.code
                    draw[1] = ab.color
                }
                
            }

            // highlights
            let highlight = this.highlights.getAt(xy)
            if (highlight) {
                // this.getDisplay(DisplayNames.HUD).draw(xy.x, xy.y, " ", ROT.Color.toHex(Color.black), ROT.Color.toHex(highlight.color))
                draw[2] = highlight.color
            } else {
                // this.getDisplay(DisplayNames.HUD)._context.clearRect(xy.x * this.my_tile_width, xy.y * this.my_tile_height, this.my_tile_width, this.my_tile_height)
            }
            
            if ((display_options) && (display_options.blackAndWhiteMode)) {
                draw[1] = Brew.Color.black
                draw[2] = Brew.Color.normal
            }
            
            this.getDisplay(DisplayNames.Game).draw(xy.x, xy.y, draw[0], ROT.Color.toHex(draw[1]), ROT.Color.toHex(draw[2]))            
            
            return true // TODO: make this return false if nothing new to draw (cache?)
        }
		
		convertScreenToMap (screen_xy: Brew.Coordinate) : Brew.Coordinate {
			// TODO: screen offset goes here
			let offset_xy = new Brew.Coordinate(0, 0)
			
			return screen_xy.add(offset_xy)
		}
        
        // inventory
        inventoryDraw(inv: Inventory, selected_item_index: number) : void {
            this.clearDisplay(DisplayNames.HUD)
            this.drawAll({blackAndWhiteMode: true})
            
            let item_text : string
            let keys = inv.getKeys()
            let toggleText: string
            
            for (let i = 0; i < keys.length; i++) {
                let invkey = keys[i]
                let invitem = inv.getInventoryItemByKey(invkey)
                
                if (selected_item_index == i) {
                    toggleText = "+ "
                } else {
                    toggleText = "- "
                }
                
                this.getDisplay(DisplayNames.HUD).draw(0, i, invkey, ROT.Color.toHex(Color.white))
                item_text = toggleText + invitem.item.getDefinition() + invitem.item.getID().toString() + invitem.item.name
                item_text = item_text.slice(0, Config.screen_width_tiles - 2)
                this.getDisplay(DisplayNames.HUD).drawText(2, i, item_text)
                // .draw(0, i, invkey, ROT.Color.toHex(Color.white))

            }
        }
        
        // context menu
        contextMenuDraw(context_list : Array<ContextMenuItem>, selected_item_index: number) : void {
            this.clearDisplay(DisplayNames.HUD)
            this.drawAll({blackAndWhiteMode: true})
            
            let item_text : string
            let toggleText: string
            
            for (let i = 0; i < context_list.length; i++) {
                
                if (selected_item_index == i) {
                    toggleText = "+ "
                } else {
                    toggleText = "- "
                }
                
                item_text = toggleText + ContextMenuItem[context_list[i]]
                item_text = item_text.slice(0, Config.screen_width_tiles - 2)
                this.getDisplay(DisplayNames.HUD).drawText(2, i, item_text)
            }
        }
        
    }
}