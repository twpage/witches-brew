module Brew {
    
    export enum BrewEventType {
        Error,
        Info,
        Wait,
        Move,
        Attack,
        Pickup,
        Drop,
        
        TargetingOn,
        TargetingCancel,
        TargetingFinish,
        TargetingMove,
        
        InventoryOn,
        InventoryMove,
        InventoryOff,
        InventorySelect,
        
        ContextMenuOn,
        ContextMenuMove,
        ContextMenuSelect,
        ContextMenuOff,
        
        Special
    }
    
    export enum ContextMenuItem {
        Drop = 1,
        Use,
        Throw
    }
    
    export enum BrewTargetingMethod {
        PointOnly,
        StraightLine
    }
    
    export enum BrewTargetingAction {
        Examine,
        Teleport,
        ThrowItem,
        RangedAttack
    }
    
    // export interface IContextMenuData {
    //     item?: Brew.Item,
    //     context_list: Array<ContextMenuItem>
    //     selected_index: number
    // }
    
    export interface IBrewTargetingData {
        from_xy: Brew.Coordinate,
        to_xy: Brew.Coordinate,
        method: BrewTargetingMethod,
        action: BrewTargetingAction,
        destinationMustBeWalkable: boolean,
        destinationMustBeVisible: boolean,
        destinationMustHaveMob: boolean,
        pathBlockedByMobs: boolean
        // path?: Array<Brew.Coordinate>
    }
    
    export interface IBrewEventData {
        eventType: BrewEventType,
        actor: Brew.Monster,
        endsTurn?: boolean,
        playerInitiated?: boolean,
        errorMsg?: string,
        eventData?: any,
        targetingData?: IBrewTargetingData
    }

    export interface IBrewTurnData {
        actor: Brew.Monster
    }

    export enum BrewInputSource {
        Keyboard,
        Mouse,
        Touch
    }

    export interface IBrewInputData {
        source: BrewInputSource,
        code?: number,
        button?: number,
        jsevent?: any
    }
    
    export enum InputHandler {
        Main,
        Targeting,
        InventoryList,
        ContextMenu
    }
    
    export interface IDisplayOptions {
        blackAndWhiteMode?: boolean
    }
    
    export class GameMaster {
        
        // main ROT engine
        scheduler : ROT.Scheduler.Speed
        engine : ROT.Engine
        turn_count : number = 0
        
        // ROTjs displays
        public display : Brew.Display
        
        // postal.js channels
        public channel_event : IChannelDefinition<IBrewEventData> // main channel for all game events

        public channel_turn : IChannelDefinition<IBrewTurnData> // handle turn start/end
        
        public channel_input : IChannelDefinition<IBrewInputData> // channel for external user input  

        public channel_display : IChannelDefinition<any> // channel for external user input  

        // channel listeners
        private feed_event : ISubscriptionDefinition<any>
        private feed_turn_start : ISubscriptionDefinition<any>
        private feed_turn_end : ISubscriptionDefinition<any>
        private feed_input : ISubscriptionDefinition<any>
        private feed_display : ISubscriptionDefinition<any>
        
        // private variables
        private player : Brew.Monster
        private current_level : any 
        private block_input : boolean
        private current_turn_actor : any
        public pathmap_to_player : Brew.Path.Pathmap
        public pathmap_from_player : Brew.Path.Pathmap
        
        // outsourced functions
        private event_fn: any
        private input_fn: any
        private ai_fn: any
        private preplayer_fn: any
        private postplayer_fn: any
        
        public input_handler : InputHandler = InputHandler.Main

        private lastEvent : IBrewEventData
        private lastEventIncludeErrors : IBrewEventData
        
        constructor(div_container: HTMLDivElement, input_fn: any, event_fn: any, ai_fn: any, preplayer_fn: any, postplayer_fn: any) {
            
            // instantiate ROTjs engine
            this.scheduler = new ROT.Scheduler.Speed()
            this.engine = new ROT.Engine(this.scheduler)
            this.block_input = true
            
            // display class will handle setting up canvas, etc
            this.display = new Brew.Display(this, div_container)
            
            // setup event/input handlers
            this.initEventListener(div_container)
            
            // instantiate postal.js channels
            this.channel_event = postal.channel("event")
            this.channel_turn = postal.channel("turn")
            this.channel_input = postal.channel("input")
            this.channel_display = postal.channel("display")
            
            // outsourced functions
            this.event_fn = event_fn
            this.input_fn = input_fn
            this.ai_fn = ai_fn
            this.preplayer_fn = preplayer_fn
            this.postplayer_fn = postplayer_fn
            
            // start feed listeners
            this.feed_turn_start = this.channel_turn.subscribe("turn.start", (data: IBrewTurnData, envelope) => {this.handleTurnStart(data, envelope)}) 
            this.feed_turn_end = this.channel_turn.subscribe("turn.end", (data: IBrewTurnData, envelope) => {this.handleTurnEnd(data, envelope)}) 
            
            this.feed_event = this.channel_event.subscribe("event.start", (data: IBrewEventData, envelope) => { this.eventFunctionWrapper(data, envelope) })
            this.feed_event = this.channel_event.subscribe("event.end", (data: IBrewEventData, envelope) => { this.handleEventEnd(data, envelope) })
            
            this.feed_input = this.channel_input.subscribe("input.*", (data: IBrewInputData, envelope) => { this.inputFunctionWrapper(data, envelope) }) 
            
            this.feed_display = this.channel_display.subscribe("display.*", (data, envelope) => { this.handleDisplay(data, envelope) })
            
            // set up first level, start engine, define player, etc
            this.setupGame()
            
        }
        
        setupGame() {
            this.setupPlayer()

            this.setupNewLevel(0)
            this.engine.start()
        }
        
        setupPlayer() {
            let player = Brew.Definitions.monsterFactory(this, Brew.Definitions.MonsterType.Hero)
            player.name = "Hero"
            player.inventory = new Brew.Inventory(4)
            player.inventory.addItem(Definitions.itemFactory(Definitions.ItemType.Widget))
            player.inventory.addItem(Definitions.itemFactory(Definitions.ItemType.Sprocket))
            
            this.player = player 
            this.scheduler.add(this.player, true)
        }
        
        setupNewLevel(depth: number) {
            this.engine.lock()
            
            // todo: make a proper level generator outside of this
            let level = new Brew.Level(Brew.Config.map_width_tiles, Brew.Config.map_height_tiles, depth)
            level.monsters.setAt(level.simple_start_xy, this.player)
            
            for (let i = 0; i < 2; i++) {
                let mob = Brew.Definitions.monsterFactory(this, Brew.Definitions.MonsterType.Guardguy, {monster_status: Brew.MonsterStatus.Wander })
                // mob.monster_status = Brew.MonsterStatus.Wander
                
                let xy : Brew.Coordinate = Brew.randomOf(level.floors)
                level.monsters.setAt(xy, mob)
                this.scheduler.add(mob, true)
            }
            
            this.current_level = level
            this.pathmap_to_player = Brew.Path.createGenericMapToPlayer(this, this.getCurrentLevel())
            this.pathmap_from_player = Brew.Path.createMapFromPlayer(this, this.getCurrentLevel(), this.pathmap_to_player)
            //this.preplayer_fn(this, this.player)
            //this.display.drawAll()
            
            this.engine.unlock()
        }
        
        inputFunctionWrapper(data, envelope) {
            if (this.block_input == true) {
                // console.warn("input blocked")
                ;
            } else {
                this.input_fn(this, data, envelope)
            }
        }
        
        eventFunctionWrapper(data: IBrewEventData, envelope) {
            if (data.eventType != BrewEventType.Error) {
                this.block_input = true
            }

            this.event_fn(this, data, envelope)
        }
        
        handleDisplay(data, envelope: IEnvelope<any>) {
            if (envelope.topic == "display.all") {
                this.display.drawAll(data)
            } else if (envelope.topic == "display.at") {
                this.display.drawAt(data)
            } else if (envelope.topic == "display.list") {
                for (let i = 0; i < data.length; i++) {
                    this.display.drawAt(data[i])
                }
            } else {
                console.error("invalid display data", data)
            }
        }
        
        handleEventEnd(data: IBrewEventData, envelope) {
            this.lastEventIncludeErrors = data // keep track of last events including errors 
            if (data.eventType != BrewEventType.Error) {
                this.lastEvent = data // keep track of the last non-error event
            }
            
            if (data.endsTurn) {
                // console.log("event end: turn end")
                this.channel_turn.publish("turn.end", {actor: data.actor})
            } else {
                // if it doesn't end turn, allow the player to put in input again
                if (data.actor.isType(Brew.Definitions.MonsterType.Hero)) {
                    // console.log("input blocking OFF")
                    this.block_input = false
                }
            }
        }
        
        initEventListener(div_container: HTMLDivElement) {
            // add event listeners to page/canvas
            div_container.ownerDocument.addEventListener("keydown", (e) => {
                
                if (Brew.KeyMap.MovementKeys.concat(Brew.KeyMap.Action).indexOf(e.keyCode) > -1) {
                    e.preventDefault()    
                }
                
                this.channel_input.publish("input.keyboard", {
                    source: Brew.BrewInputSource.Keyboard,
                    code: e.keyCode, 
                    jsevent: e
                })
            })
            
            div_container.addEventListener("mousedown", (e) => {
                this.channel_input.publish("input.mouse", {
                    source: Brew.BrewInputSource.Mouse,
                    button: e.button,
                    jsevent: e
                })
            })
            
            div_container.addEventListener("mousemove", (e) => {
                this.channel_input.publish("input.mouse", {
                    source: Brew.BrewInputSource.Mouse,
                    button: e.button,
                    jsevent: e
                })
            })

        }
        
        getPlayer() : Brew.Monster { 
            return this.player
        }
        
        getCurrentLevel() : Brew.Level {
            return this.current_level
        }
        
        setPlayer(new_player: Brew.Monster) : void {
            this.player = new_player
        }
        
        setLevel(new_level: any) : void {
            this.current_level = new_level
        }
        
        // postal feed handlers
        handleTurnEnd(data: IBrewTurnData, envelope: IEnvelope<any>)  {
            let mob = data.actor
            console.log(`END TURN: ${mob.name}`)
            if (mob.isType(Brew.Definitions.MonsterType.Hero)) {
                // console.log("input blocking OFF")
                this.postplayer_fn(this, mob)
            }
            
            this.engine.unlock()
        }
        
        handleTurnStart(data: IBrewTurnData, envelope: IEnvelope<any>) {
            let mob = data.actor
            console.log(`START TURN: ${mob.name}`)

            this.turn_count += 1
            this.current_turn_actor = mob 
            
            this.engine.lock()
            
            if (mob.isType(Brew.Definitions.MonsterType.Hero)) {
                // console.log("input blocking OFF")
                this.preplayer_fn(this, mob)
                this.block_input = false
                
            } else {
                let ai_event : IBrewEventData
                ai_event = this.ai_fn(this, mob)
                this.channel_event.publish("event.start", ai_event)
            }
        }
        
        endEvent(data: IBrewEventData, nextEventData? : IBrewEventData) {
            this.channel_event.publish("event.end", data)
            
            if (nextEventData) {
                this.channel_event.publish("event.start", nextEventData)
            }
        }
        
        getLastEvent(includeErrors: boolean = false) {
            if (includeErrors) {
                return this.lastEventIncludeErrors
            } else {
                return this.lastEvent
            }
        }
        
        // display shortcuts
        displayAt(xy: Brew.Coordinate) : void {
            this.channel_display.publish("display.at", xy)
        }
        
        displayAll(display_options : IDisplayOptions = {}) : void {
            this.channel_display.publish("display.all", display_options)
        }
        
        displayList(xy_list: Array<Brew.Coordinate>) : void {
            this.channel_display.publish("display.list", xy_list)
        }

        
    }
}