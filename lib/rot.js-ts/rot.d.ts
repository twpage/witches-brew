declare module ROT {

    interface IFOV {
        compute(x: number, y: number, R: number, callback: (x: number, y: number, r: number) => void );
    }

    interface IMap {
        width: number;
        height: number;
        create(callback: (x: number, y: number, value: number) => void ): void;
        create();
    }

    interface INoise {
        get (x: number, y: number): number;
    }

    interface IPath {
        compute(fromX: number, fromY: number, callback: (x: number, y: number) => void);
    }
    
    export class Color {
        static add(color1: number[], color2: number[]): number[];
        static fromString(str: string): number[];
        static hsl2rgb(color: number[]): number[];
        static interpolate(color1: number[], color2: number[], factor: number): number[];
        static interpolateHSL(color1: number, color2: number, factor: number): number[];
        static multiply(color1: number[], color2: number[]): number[];
        static randomize(color: number[], diff: number[]): number[];
        static rgb2hsl(color: number[]): number;
        static toHex(color: number[]): string;
        static toRGB(color: number[]): string;
    }

    export class Display {
        constructor(options: any);
        clear();
        computeFontSize(availWidth: number, availHeight: number);
        computeSize(availWidth: number, availHeight: number);
        DEBUG(x: number, y: number, what: number);
        draw(x: number, y: number, ch: string, fg?: string, bg?: string);
        drawText(x: number, y: number, text: string, maxWidth?: number): number;
        eventToPosition(e: Event): number[];

        getOptions(): any;
        setOptions(options: any);

        getContainer(): HTMLCanvasElement; //experimental, was formerly HTMLElement        
        _context : CanvasRenderingContext2D; // experimental, I dont know how to get access to clearing for transparent canvases without _context.clearRect
    }
    
    export class Engine {
        constructor(scheduler: any);
        lock() : void;
        start(): void;
        unlock(): void;
    }

    export class EventQueue {
        add(event: any, time: number) : void;
        clear() : void;
        get() : any;
        getTime() : number;
        remove(event: any);
    }
    
    export class Lighting {
        constructor(reflectivityCallback: (x: number, y: number) => void, options: any);
        compute(lightingCallback: (x: number, y: number, color: number) => void );
        reset();
        setFOV(fov: IFOV);
        setLight(x: number, y: number, color?: number[]);
        setLight(x: number, y: number, color?: string);
        setOptions(options: any);
    }

    export class RNG {
        static getNormal(mean: number, stddev: number): number;
        static staticgetPercentage(): number;
        static getSeed(): number;
        static getState();
        static getUniform(): number;
        static getWeightedValue(data: any): string;
        static setSeed(seed: number) : void;
        static setState(state) : void;
    }

    export class StringGenerator {
        constructor(options: any);
        clear();
        generate(): string;
        getStats(): any;
        observe(str: string);
    }

    export class Text {
        static measure(str: string, maxWidth: number): number;
        static tokenize(str: string, maxWidth: number): Array<any>;
    }
	
	const VK_ADD: number
	const VK_DECIMAL: number
	const VK_DIVIDE: number
	const VK_MULTIPLY: number
	const VK_NUMPAD0: number
	const VK_NUMPAD1: number
	const VK_NUMPAD2: number
	const VK_NUMPAD3: number
	const VK_NUMPAD4: number
	const VK_NUMPAD5: number
	const VK_NUMPAD6: number
	const VK_NUMPAD7: number
	const VK_NUMPAD8: number
	const VK_NUMPAD9: number
	const VK_SEPARATOR: number
	const VK_SUBTRACT: number
	
	const VK_SPACE: number
	const VK_RETURN: number
	const VK_ESCAPE: number
	
	const VK_LEFT: number
	const VK_RIGHT: number
	const VK_UP: number
	const VK_DOWN: number
	
	const VK_A: number
	const VK_B: number
	const VK_C: number
	const VK_D: number
	const VK_E: number
	const VK_F: number
	const VK_G: number
	const VK_H: number
	const VK_I: number
	const VK_J: number
	const VK_K: number
	const VK_L: number
	const VK_M: number
	const VK_N: number
	const VK_O: number
	const VK_P: number
	const VK_Q: number
	const VK_R: number
	const VK_S: number
	const VK_T: number
	const VK_U: number
	const VK_V: number
	const VK_W: number
	const VK_X: number
	const VK_Y: number
	const VK_Z: number
    
    const VK_SLASH: number

}

declare module ROT.FOV {
    export class DiscreteShadowcasting implements IFOV {
        constructor(lightPassesCallback: Function, options: any);
        compute(x: number, y: number, R: number, callback: (x: number, y: number, r: number) => void );
    }

    export class PreciseShadowcasting implements IFOV {
        constructor(lightPassesCallback: Function, options: any);
        compute(x: number, y: number, R: number, callback: (x: number, y: number, r: number, visibility: number) => void );
    }
    
    export class RecursiveShadowcasting implements IFOV {
        constructor(lightPassesCallback: Function, options: any);
        compute(x: number, y: number, R: number, callback: (x: number, y: number, r: number, visibility: number) => void );
        
        // TODO: interface for ROT.DIRS
        compute180(x: number, y: number, R: number, dir: number[], callback: (x: number, y: number, r: number, visibility: number) => void );
        compute90(x: number, y: number, R: number, dir: number[], callback: (x: number, y: number, r: number, visibility: number) => void );
    }
}

declare module ROT.Map {
    interface IFeature {
        create();
        create(digCallback: Function);
        //static createRandomAt(x: number, y: number, dx: number, dy: number, options: any);
        debug(): void;
        isValid(canBeDugCallback: Function): void;
    }

    export class Dungeon implements IMap {
        width: number;
        height: number;
        constructor();
        constructor(width: number, height: number);
        create();
        create(callback: Function): void;
        getRooms(): ROT.Map.Feature.Room[];
        getCorridors(): ROT.Map.Feature.Corridor[];
    }

    export class Arena extends Dungeon implements IMap {
        constructor(width: number, height: number);
    }

    export class Cellular extends Dungeon implements IMap {
        constructor(width: number, height: number, options?: any);
        randomize(probability: number);
        set(x: number, y: number, value: number);
    }

    export class Digger extends Dungeon implements IMap {
        constructor(width: number, height: number, options: any);
    }

    export class DividedMaze extends Dungeon implements IMap {
        constructor(width: number, height: number);
    }

    export class EllerMaze extends Dungeon implements IMap {
        constructor(width: number, height: number);
    }

    export class IceyMaze extends Dungeon implements IMap {
        constructor(width: number, height: number, regularity: number);
    }

    export class Rogue extends Dungeon implements IMap {
        constructor(width: number, height: number, options?: any);
    }

    export class Uniform extends Dungeon implements IMap {
        constructor(width: number, height: number, options: any);
    }

}

declare module ROT.Map.Feature {
    export class Corridor implements IFeature {
        create();
        create(digCallback: Function);
        debug(): void;
        isValid(canBeDugCallback: Function): void;
        static createRandomAt(x: number, y: number, dx: number, dy: number, options: any);
        constructor(startX: number, startY: number, endX: number, endY: number);
        createPriorityWalls(priorityWallCallback: Function);
    }

    export class Room implements IFeature {
        create();
        create(digCallback: Function);
        debug(): void;
        isValid(canBeDugCallback: Function): void;
        static createRandomAt(x: number, y: number, dx: number, dy: number, options: any);
        constructor(x1: number, y1: number, x2: number, y2: number, doorX: number, doorY: number);
        addDoor(x: number, y: number);
        clearDoors();
        static createRandom(availWidth: number, availHeight: number, options: any);
        static createRandomCenter(cx: number, cy: number, options: any);
        getBottom();
        getCenter();
        getDoors();
        getLeft();
        getRight();
        getTop();
        isValid(isWallCallback: Function, canBeDugCallback: Function);
    }
}

declare module ROT.Noise {
    export class Simplex {
        constructor(gradients?: number);
        get (xin: number, yin: number): number;
    }
}

declare module ROT.Path {
    export class AStar implements IPath {
        constructor(toX: number, toY: number, passableCallback: (x: number, y: number) => boolean , options?: any);
        compute(fromX: number, fromY: number, callback: (x: number, y: number) => void);
    }

    export class Dijkstra implements IPath {
        constructor(toX: number, toY: number, passableCallback: (x: number, y: number) => boolean , options?: any);
        compute(fromX: number, fromY: number, callback: (x: number, y: number) => void );
    }
}

    
declare module ROT.Scheduler {
    export class Scheduler {
        add(item: any, repeat: boolean);
        clear() : void;
        getTime() : number;
        next(): any;
        remove(item: any) : void;
    }
    
    export class Simple extends Scheduler {}
        
    export class Action extends Scheduler {
        add(item: any, repeat: boolean, time?: number) : void;
        setDuration(time: number) : void;
    }
    
    interface IHasGetSpeed { getSpeed: () => number }
    
    export class Speed extends Scheduler {
        add(item: IHasGetSpeed, repeat: boolean) : void;
        next() : any;
    }
}