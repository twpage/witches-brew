module Brew {

    export function randomOf(some_array: Array<any>) : any {
        if (!(some_array.length)) { return null }
        return some_array[Math.floor(ROT.RNG.getUniform() * some_array.length)]
    }
    
    export function randomize(some_array: Array<any>) : Array<any> {
        let result = []
        while (some_array.length) {
            let index = some_array.indexOf(randomOf(some_array))
            result.push(some_array.splice(index, 1)[0])
        }
        
        return result
    }
    
    export function remove(arr: Array<any>, element: any) : void {
        let index = arr.indexOf(element)
        if (index > -1) {
            arr.splice(index, 1)
        }
    }
    
    export function mod(m: number, n: number) : number {
        return ((m % n) + n) % n
    }
    
    export function clone(obj) {
        // https://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // handle coords
        if (obj instanceof Brew.Coordinate) {
            return obj.clone()
        }
        
        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }
}

module Brew.Utils {
	
    export function getRandomInt(a: number, b: number) : number {
        // return random integer [A, B]
        return Math.floor(ROT.RNG.getUniform() * (b - a + 1)) + a
    }
    
    enum DiffOrUnion {
        Diff,
        Union
    }
    
    function runDiffAndUnion(which: DiffOrUnion, list_a: Array<Brew.Coordinate>, list_b: Array<Brew.Coordinate>) : Array<Brew.Coordinate> {
        let key_fn = (value, index, array) : number => { return xyToKey(value) }
        let keys_a : Array<number> = list_a.map(key_fn)
        let keys_b : Array<number> = list_b.map(key_fn)
        
        let keys_diff : Array<number> = []
        let keys_union : Array<number> = []
        
        keys_a.forEach((value, index, array) => {
            if (keys_b.indexOf(value) > -1) {
                keys_union.push(value)
            } else {
                keys_diff.push(value)
            }
        })
        // console.log(`{0} new keys`, keys_diff.length)
        
        keys_b.forEach((value, index, array) => {
            if (keys_union.indexOf(value) > -1) {
                // skip
                ;
            } else {
                keys_diff.push(value)
            }
        })
        // console.log(`{0} new keys`, keys_diff.length)
        
        if (which == DiffOrUnion.Diff) {
            let xy_diff : Array<Brew.Coordinate> = keys_diff.map((value, index, array) : Brew.Coordinate => {
                return keyToXY(value)
            })

            return xy_diff
            
        } else {
            let xy_union : Array<Brew.Coordinate> = keys_union.map((value, index, array) : Brew.Coordinate => {
                return keyToXY(value)
            })

            return xy_union
        }
        
    }
    
    export function diffOfCoordinateArrays(list_a: Array<Brew.Coordinate>, list_b: Array<Brew.Coordinate>) : Array<Brew.Coordinate> {
        // return elements of A not in B and B not in A
        return runDiffAndUnion(DiffOrUnion.Diff, list_a, list_b)
    }

    export function unionOfCoordinateArrays(list_a: Array<Brew.Coordinate>, list_b: Array<Brew.Coordinate>) : Array<Brew.Coordinate> {
        // return elements of A + B
        return runDiffAndUnion(DiffOrUnion.Union, list_a, list_b)
    }

	export function getDirectionFromKeycode(keycode: number): Brew.Coordinate {
		let direction_xy: Brew.Coordinate
		
        if (Brew.KeyMap.MoveUp.indexOf(keycode) > -1) {
            direction_xy = Brew.Directions.UP
        } else if (Brew.KeyMap.MoveDown.indexOf(keycode) > -1) {
            direction_xy = Brew.Directions.DOWN
        } else if (Brew.KeyMap.MoveRight.indexOf(keycode) > -1) {
            direction_xy = Brew.Directions.RIGHT
        } else if (Brew.KeyMap.MoveLeft.indexOf(keycode) > -1) {
            direction_xy = Brew.Directions.LEFT
        } else {
            return null
        }
        		
		return direction_xy
	}
    
    export function dist2d(from_xy: Coordinate, to_xy: Coordinate) : number {
        let xdiff = (from_xy.x - to_xy.x)
        let ydiff = (from_xy.y - to_xy.y)
        
        return Math.sqrt(xdiff*xdiff + ydiff*ydiff)
    }
    
    export function getLineBetweenPoints (start_xy: Brew.Coordinate, end_xy: Brew.Coordinate) : Array<Brew.Coordinate> { 
		// uses bresenham's line algorithm

		if ((!(start_xy)) || (!(end_xy))) {
			console.error("invalid coords passed to getLineBetweenPoints")
        }
			
		// Bresenham's line algorithm
        let x0 : number = start_xy.x
        let y0 : number = start_xy.y
        let x1 : number = end_xy.x
        let y1 : number = end_xy.y
	
		let dy = y1 - y0
		let dx = x1 - x0
		let t = 0.5
		let points_lst = [new Brew.Coordinate(x0, y0)]
		let m : number
        
		if (start_xy.compare(end_xy)) {
			return points_lst
        }
		
		if (Math.abs(dx) > Math.abs(dy)) {
			m = dy / (1.0 * dx)
			t += y0
            if (dx < 0) {
                dx = -1
            } else {
                dx = 1
            }
            
			m *= dx
	
			while (x0 != x1) {
				x0 += dx
				t += m
				// points_lst.push({x: x0, y: Math.floor(t)}) # Coordinates(x0, int(t)))
                points_lst.push(new Brew.Coordinate(x0, Math.floor(t)))
            }
        } else {
			m = dx / (1.0 * dy)
			t += x0
            
			// dy = if (dy < 0) then -1 else 1
            if (dy < 0) {
                dy = -1 
            } else {
                dy = 1
            }
            
			m *= dy
			
			while (y0 != y1) {
				y0 += dy
				t += m
				// points_lst.push({x: Math.floor(t), y: y0}) # Coordinates(int(t), y0))
                points_lst.push(new Brew.Coordinate(Math.floor(t), y0))
            }
        }
		
		return points_lst
    }
}
    
// /**
//  * @returns {any} Randomly picked item, null when length=0
//  */
// Array.prototype.random = Array.prototype.random || function() {
// 	if (!this.length) { return null; }
// 	return this[Math.floor(ROT.RNG.getUniform() * this.length)];
// }

// /**
//  * @returns {array} New array with randomized items
//  * FIXME destroys this!
//  */
// Array.prototype.randomize = Array.prototype.randomize || function() {
// 	var result = [];
// 	while (this.length) {
// 		var index = this.indexOf(this.random());
// 		result.push(this.splice(index, 1)[0]);
// 	}
// 	return result;
// }