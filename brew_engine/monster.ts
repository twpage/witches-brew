module Brew.Definitions {

    export enum MonsterType {
        Hero,
        Killguy,
        Guardguy
    }
    
    interface MonsterDef  {
        code?: string
		color?: number[]
        attack_range?: number
        monster_status? : MonsterStatus
        speed?: number
        sight_range?: number
        flags?: Array<Brew.Flag>
    }

    let monster_defaults : MonsterDef = {
        code: '1',
        color: Brew.Color.normal,
        attack_range: 1,
        monster_status: MonsterStatus.Sleep,        
        speed: 12,
        sight_range: 5,
        flags: []
    }
    
    // [key: number]: T
    interface IMonsterDefs {
        [def_name: string] : MonsterDef 
    } 
    
    let monster_definitions : IMonsterDefs = {
        "Hero": { 
            code: "@",
			color: Brew.Color.blue,
            attack_range: 1
        },
        "Killguy": {
            code: "k",
            color: Color.orange,
            attack_range: 1
        },
        "Guardguy": {
            code: "g",
            color: Color.orange,
            attack_range: 5, 
            flags: [Flag.KeepsDistance]
        }
    }
    
     
    export function monsterFactory(gm: Brew.GameMaster, monster_type : MonsterType, options : MonsterDef = {}) : Brew.Monster {
        let m : Brew.Monster = new Brew.Monster(monster_type)
        
        // build up definition with 3 layers: default, given def, options
        // 1. default
        let def : MonsterDef = clone(monster_defaults)
        
        // 2. given definition
        let type_name = MonsterType[monster_type]
        let type_def = monster_definitions[type_name]
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
            m[prop] = def[prop]
        }
        
        // act for ROT.js engine
        m.act = () => {
            gm.channel_turn.publish("turn.start", { actor: m })
            // game.monsterAct(m)
        }

        return m
    }
    
}