var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Brew;
(function (Brew) {
    var DisplayNames;
    (function (DisplayNames) {
        DisplayNames[DisplayNames["Game"] = 0] = "Game";
        DisplayNames[DisplayNames["Layer"] = 1] = "Layer";
        DisplayNames[DisplayNames["HUD"] = 2] = "HUD";
    })(DisplayNames = Brew.DisplayNames || (Brew.DisplayNames = {}));
    var Display = (function () {
        function Display(gm, div_container) {
            this.rot_displays = {};
            this.gm = gm;
            this.highlights = new Brew.GridOfThings();
            // setup ROTjs canvas(es)
            this.initCanvas(div_container, Brew.Config.screen_width_tiles, Brew.Config.screen_height_tiles);
            // this.my_tile_width = this.getDisplay(DisplayNames.Game).getContainer().width / Config.screen_width_tiles
            // this.my_tile_height = this.getDisplay(DisplayNames.Game).getContainer().height / Config.screen_height_tiles
        }
        Display.prototype.initCanvas = function (div_container, width, height) {
            // game - main screen
            var gameDisplay = new ROT.Display({
                width: width,
                height: height,
                border: 0,
                spacing: 1.15,
                bg: ROT.Color.toHex(Brew.Color.bg_unexplored)
            });
            // console.log(gameDisplay.getContainer())
            div_container.appendChild(gameDisplay.getContainer());
            var rect = gameDisplay.getContainer().getBoundingClientRect();
            this.addDisplay(DisplayNames.Game, gameDisplay);
            // hud - targeting, highlighting, etc
            var hudDisplay = new ROT.Display({
                width: width,
                height: height,
                border: 0,
                spacing: 1.15,
                bg: "transparent"
            });
            div_container.appendChild(hudDisplay.getContainer());
            hudDisplay.getContainer().style.position = "absolute";
            hudDisplay.getContainer().style.top = rect.top.toString();
            hudDisplay.getContainer().style.left = rect.left.toString();
            this.addDisplay(DisplayNames.HUD, hudDisplay);
        };
        // Display management
        Display.prototype.addDisplay = function (name, disp) {
            this.rot_displays[name] = disp;
        };
        Display.prototype.getDisplay = function (name) {
            // make sure display exists
            if (!(name in this.rot_displays)) {
                throw new RangeError("cannot find ROT display named " + name);
            }
            return this.rot_displays[name];
        };
        Display.prototype.clearAll = function () {
            for (var name_1 in this.rot_displays) {
                var displayName = DisplayNames[name_1];
                this.clearDisplay(displayName);
            }
        };
        Display.prototype.clearDisplay = function (name) {
            var display = this.getDisplay(name);
            display._context.clearRect(0, 0, display.getContainer().width, display.getContainer().height);
        };
        // Drawing on the grid
        Display.prototype.drawAll = function (display_options) {
            for (var x = 0; x < Brew.Config.screen_width_tiles; x++) {
                for (var y = 0; y < Brew.Config.screen_height_tiles; y++) {
                    this.drawAt(new Brew.Coordinate(x, y), display_options);
                }
            }
        };
        Display.prototype.drawAt = function (xy, display_options) {
            var draw;
            if (Brew.Debug.debug_pathmap) {
                var path_value = Brew.Debug.debug_pathmap.field.getAt(xy);
                if (path_value < Brew.Debug.debug_pathmap.max_value) {
                    var pc_of_max = void 0;
                    var color_value = void 0;
                    if (path_value < 0) {
                        pc_of_max = (path_value / Brew.Debug.debug_pathmap.min_value);
                        color_value = ROT.Color.interpolate(Brew.Color.blue, Brew.Color.white, 1 - pc_of_max);
                    }
                    else {
                        pc_of_max = (path_value / Brew.Debug.debug_pathmap.max_value);
                        color_value = ROT.Color.interpolate(Brew.Color.blue, Brew.Color.white, pc_of_max);
                    }
                    this.getDisplay(DisplayNames.Game).draw(xy.x, xy.y, " ", ROT.Color.toHex(Brew.Color.white), ROT.Color.toHex(color_value));
                    return true;
                }
            }
            // 0. PLAYER FOV
            var in_fov;
            in_fov = this.gm.getPlayer().fov.hasAt(xy);
            if (!(in_fov)) {
                // not in view, check memory
                var mem = this.gm.getPlayer().memory.getAt(xy);
                if (mem) {
                    // saw it before
                    draw = [mem.code, Brew.Color.memory, Brew.Color.bg_explored];
                }
                else {
                    // never seen it
                    draw = [' ', Brew.Color.black, Brew.Color.bg_unexplored];
                }
            }
            else {
                // IN VIEW
                // 1. TERRAIN
                var terrain = this.gm.getCurrentLevel().terrain.getAt(xy);
                if (terrain == null) {
                    // debugger
                }
                draw = [terrain.code, Brew.Color.normal, Brew.Color.bg_explored];
                // 2. ITEMS
                var item = this.gm.getCurrentLevel().items.getAt(xy);
                if (item) {
                    draw = [item.code, item.color, Brew.Color.bg_explored];
                }
                // 3. MONSTERS
                var mob = this.gm.getCurrentLevel().monsters.getAt(xy);
                if (mob) {
                    draw = [mob.code, mob.color, Brew.Color.bg_explored];
                }
                // 4. ABOVE / OVERHEAD
                var ab = this.gm.getCurrentLevel().above.getAt(xy);
                if (ab) {
                    draw[0] = ab.code;
                    draw[1] = ab.color;
                }
            }
            // highlights
            var highlight = this.highlights.getAt(xy);
            if (highlight) {
                // this.getDisplay(DisplayNames.HUD).draw(xy.x, xy.y, " ", ROT.Color.toHex(Color.black), ROT.Color.toHex(highlight.color))
                draw[2] = highlight.color;
            }
            else {
                // this.getDisplay(DisplayNames.HUD)._context.clearRect(xy.x * this.my_tile_width, xy.y * this.my_tile_height, this.my_tile_width, this.my_tile_height)
            }
            if ((display_options) && (display_options.blackAndWhiteMode)) {
                draw[1] = Brew.Color.black;
                draw[2] = Brew.Color.normal;
            }
            this.getDisplay(DisplayNames.Game).draw(xy.x, xy.y, draw[0], ROT.Color.toHex(draw[1]), ROT.Color.toHex(draw[2]));
            return true; // TODO: make this return false if nothing new to draw (cache?)
        };
        Display.prototype.convertScreenToMap = function (screen_xy) {
            // TODO: screen offset goes here
            var offset_xy = new Brew.Coordinate(0, 0);
            return screen_xy.add(offset_xy);
        };
        // inventory
        Display.prototype.inventoryDraw = function (inv, selected_item_index) {
            this.clearDisplay(DisplayNames.HUD);
            this.drawAll({ blackAndWhiteMode: true });
            var item_text;
            var keys = inv.getKeys();
            var toggleText;
            for (var i = 0; i < keys.length; i++) {
                var invkey = keys[i];
                var invitem = inv.getInventoryItemByKey(invkey);
                if (selected_item_index == i) {
                    toggleText = "+ ";
                }
                else {
                    toggleText = "- ";
                }
                this.getDisplay(DisplayNames.HUD).draw(0, i, invkey, ROT.Color.toHex(Brew.Color.white));
                item_text = toggleText + invitem.item.getDefinition() + invitem.item.getID().toString() + invitem.item.name;
                item_text = item_text.slice(0, Brew.Config.screen_width_tiles - 2);
                this.getDisplay(DisplayNames.HUD).drawText(2, i, item_text);
                // .draw(0, i, invkey, ROT.Color.toHex(Color.white))
            }
        };
        // context menu
        Display.prototype.contextMenuDraw = function (context_list, selected_item_index) {
            this.clearDisplay(DisplayNames.HUD);
            this.drawAll({ blackAndWhiteMode: true });
            var item_text;
            var toggleText;
            for (var i = 0; i < context_list.length; i++) {
                if (selected_item_index == i) {
                    toggleText = "+ ";
                }
                else {
                    toggleText = "- ";
                }
                item_text = toggleText + Brew.ContextMenuItem[context_list[i]];
                item_text = item_text.slice(0, Brew.Config.screen_width_tiles - 2);
                this.getDisplay(DisplayNames.HUD).drawText(2, i, item_text);
            }
        };
        return Display;
    }());
    Brew.Display = Display;
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    var MAX_GRID_SIZE = 1024;
    function xyToKey(xy) {
        return (xy.y * MAX_GRID_SIZE) + xy.x;
    }
    Brew.xyToKey = xyToKey;
    function keyToXY(key) {
        return new Coordinate(key % MAX_GRID_SIZE, Math.floor(key / MAX_GRID_SIZE));
    }
    Brew.keyToXY = keyToXY;
    function adjacentKeys(key) {
        // returns keys of 4 adjacent xy coords
        // todo: cache this
        return keyToXY(key).getAdjacent().map(function (xy, index, array) { return xyToKey(xy); });
    }
    Brew.adjacentKeys = adjacentKeys;
    var BrewObjectType;
    (function (BrewObjectType) {
        BrewObjectType[BrewObjectType["Thing"] = 1] = "Thing";
        BrewObjectType[BrewObjectType["Terrain"] = 2] = "Terrain";
        BrewObjectType[BrewObjectType["Item"] = 3] = "Item";
        BrewObjectType[BrewObjectType["Monster"] = 4] = "Monster";
        BrewObjectType[BrewObjectType["Above"] = 5] = "Above";
    })(BrewObjectType || (BrewObjectType = {}));
    var Coordinate = (function () {
        function Coordinate(xx, yy) {
            this.x = xx;
            this.y = yy;
        }
        Coordinate.prototype.toString = function () {
            return "(" + this.x + ", " + this.y + ")";
        };
        Coordinate.prototype.clone = function () {
            return new Brew.Coordinate(this.x, this.y);
        };
        Coordinate.prototype.compare = function (other_xy) {
            return (this.x == other_xy.x) && (this.y == other_xy.y);
        };
        Coordinate.prototype.add = function (other_xy) {
            var xy = new Brew.Coordinate(this.x + other_xy.x, this.y + other_xy.y);
            return xy;
        };
        Coordinate.prototype.subtract = function (other_xy) {
            var xy = new Brew.Coordinate(this.x - other_xy.x, this.y - other_xy.y);
            return xy;
        };
        Coordinate.prototype.toUnit = function () {
            var x_sign = (this.x == 0) ? 0 : (Math.abs(this.x) / this.x);
            var y_sign = (this.y == 0) ? 0 : (Math.abs(this.y) / this.y);
            var xy = new Brew.Coordinate(x_sign, y_sign);
            return xy;
        };
        Coordinate.prototype.getAdjacent = function () {
            return [
                this.add(Brew.Directions.UP),
                this.add(Brew.Directions.DOWN),
                this.add(Brew.Directions.LEFT),
                this.add(Brew.Directions.RIGHT)
            ];
        };
        return Coordinate;
    }());
    Brew.Coordinate = Coordinate;
    var init_id = Math.floor(ROT.RNG.getUniform() * 999) + 1;
    function generateID() {
        init_id += 1;
        return init_id;
    }
    var Thing = (function () {
        function Thing(objtype, definition) {
            // public id: number
            this.objtype = BrewObjectType.Thing;
            this.name = "unnamed_thing";
            this.code = "0";
            this.objtype = objtype;
            this.definition = definition;
            this.id = generateID();
        }
        Thing.prototype.setLocation = function (xyNew) {
            this.location = xyNew;
        };
        Thing.prototype.getDefinition = function () {
            return this.definition;
        };
        Thing.prototype.isType = function (other_definition) {
            return other_definition == this.definition;
        };
        Thing.prototype.getID = function () {
            return this.id;
        };
        Thing.prototype.isSameThing = function (other_thing) {
            return this.getID() === other_thing.getID();
        };
        return Thing;
    }());
    Brew.Thing = Thing;
    var Terrain = (function (_super) {
        __extends(Terrain, _super);
        function Terrain(definition) {
            return _super.call(this, BrewObjectType.Terrain, definition) || this;
        }
        return Terrain;
    }(Thing));
    Brew.Terrain = Terrain;
    var Item = (function (_super) {
        __extends(Item, _super);
        function Item(definition) {
            return _super.call(this, BrewObjectType.Item, definition) || this;
        }
        return Item;
    }(Thing));
    Brew.Item = Item;
    var Above = (function (_super) {
        __extends(Above, _super);
        function Above(definition) {
            return _super.call(this, BrewObjectType.Above, definition) || this;
        }
        return Above;
    }(Thing));
    Brew.Above = Above;
    var MonsterStatus;
    (function (MonsterStatus) {
        MonsterStatus[MonsterStatus["Sleep"] = 0] = "Sleep";
        MonsterStatus[MonsterStatus["Wander"] = 1] = "Wander";
        MonsterStatus[MonsterStatus["Hunt"] = 2] = "Hunt";
        MonsterStatus[MonsterStatus["Escape"] = 3] = "Escape";
    })(MonsterStatus = Brew.MonsterStatus || (Brew.MonsterStatus = {}));
    var default_inv_keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    var Inventory = (function () {
        // assign_key_fn: () => string
        function Inventory(max_items, inv_keys) {
            if (inv_keys === void 0) { inv_keys = default_inv_keys; }
            this.items = {};
            // this.items = {}
            this.num_items = 0;
            this.max_items = max_items;
            this.inv_keys = inv_keys;
            if (inv_keys.length < max_items) {
                throw new Error("Not enough inventory keys given for maximum number of items");
            }
        }
        Inventory.prototype.hasCapacity = function () {
            return this.num_items < this.max_items;
        };
        Inventory.prototype.addItem = function (an_item) {
            // returns false if inv is full
            if (this.num_items == this.max_items) {
                return false;
            }
            var invkey = this.assignInventoryKey(an_item);
            this.items[invkey] = {
                item: an_item,
                num_stacked: 1
            };
            this.num_items += 1;
            return true;
        };
        Inventory.prototype.assignInventoryKey = function (an_item) {
            for (var _i = 0, _a = this.inv_keys; _i < _a.length; _i++) {
                var key_value = _a[_i];
                console.log(key_value, (!(key_value in this.items)));
                if (!(key_value in this.items)) {
                    return key_value;
                }
            }
            throw new Error("Ran out of free inventory keys");
        };
        Inventory.prototype.getItemByKey = function (inv_key) {
            if (!(inv_key in this.items)) {
                throw new Error("No item linked to inventory key: " + inv_key);
            }
            return this.items[inv_key].item;
        };
        Inventory.prototype.getInventoryItemByKey = function (inv_key) {
            if (!(inv_key in this.items)) {
                throw new Error("No item linked to inventory key: " + inv_key);
            }
            return this.items[inv_key];
        };
        Inventory.prototype.removeItemByKey = function (inv_key) {
            if (!(inv_key in this.items)) {
                throw new Error("No item linked to inventory key: " + inv_key);
            }
            delete this.items[inv_key];
            this.num_items -= 1;
        };
        Inventory.prototype.getItems = function () {
            var results = [];
            for (var invkey in this.items) {
                results.push(this.items[invkey].item);
            }
            return results;
        };
        Inventory.prototype.getKeys = function () {
            var results = [];
            for (var invkey in this.items) {
                results.push(invkey);
            }
            return results;
        };
        return Inventory;
    }());
    Brew.Inventory = Inventory;
    var Monster = (function (_super) {
        __extends(Monster, _super);
        function Monster(definition) {
            var _this = _super.call(this, BrewObjectType.Monster, definition) || this;
            _this.attack_range = 1;
            _this.flags = [];
            _this.fov = new GridOfThings();
            _this.knowledge = new GridOfThings();
            _this.memory = new GridOfThings();
            return _this;
            // this.flags = []
        }
        Monster.prototype.getSpeed = function () {
            return this.speed;
        };
        Monster.prototype.act = function () { }; // gets overridden by factory creation 
        Monster.prototype.clearFov = function () {
            this.fov = new Brew.GridOfThings();
        };
        Monster.prototype.clearKnowledge = function () {
            this.knowledge = new Brew.GridOfThings();
        };
        Monster.prototype.inFOV = function (target) {
            return (this.fov.hasAt(target.location));
        };
        Monster.prototype.setFlag = function (flag) {
            Brew.remove(this.flags, flag);
            this.flags.push(flag);
        };
        Monster.prototype.removeFlag = function (flag) {
            Brew.remove(this.flags, flag);
        };
        Monster.prototype.hasFlag = function (flag) {
            return (this.flags.indexOf(flag) > -1);
        };
        return Monster;
    }(Thing));
    Brew.Monster = Monster;
    var GridOfThings = (function () {
        function GridOfThings() {
            // things: Dict<ThingInterface> = {}
            this.things = {};
        }
        GridOfThings.prototype.hasAt = function (xy) {
            var key = xyToKey(xy);
            if (key in this.things) {
                return true;
            }
            else {
                return false;
            }
        };
        GridOfThings.prototype.getAt = function (xy) {
            if (this.hasAt(xy)) {
                var key = xyToKey(xy);
                return this.things[key];
            }
            else {
                return null;
            }
        };
        // setAt (xy: Coordinate, something: Thing) : boolean {
        GridOfThings.prototype.setAt = function (xy, something) {
            if (this.hasAt(xy)) {
                return false;
            }
            else {
                var key = xyToKey(xy);
                this.things[key] = something;
                // if its a Thing, set its location on the object as well 
                if (something instanceof Thing) {
                    something.location = xy;
                }
                // something["location"] = xy
                return true;
            }
        };
        GridOfThings.prototype.removeAt = function (xy) {
            // returns true if we removed something, false if not
            if (this.hasAt(xy)) {
                var key = xyToKey(xy);
                delete this.things[key];
                return true;
            }
            else {
                return false;
            }
        };
        GridOfThings.prototype.getAllCoordinates = function () {
            var xy;
            var numberkey;
            var coords = [];
            for (var key in this.things) {
                numberkey = parseInt(key);
                xy = keyToXY(numberkey);
                coords.push(xy);
            }
            return coords;
        };
        GridOfThings.prototype.getAllThings = function () {
            var values = [];
            for (var key in this.things) {
                values.push(this.things[key]);
            }
            return values;
        };
        return GridOfThings;
    }());
    Brew.GridOfThings = GridOfThings;
    var Level = (function () {
        function Level(width, height, depth) {
            this.width = width;
            this.height = height;
            this.depth = depth || 0;
            this.terrain = new Brew.GridOfThings();
            this.monsters = new Brew.GridOfThings();
            this.items = new Brew.GridOfThings();
            this.above = new Brew.GridOfThings();
            this.constructLevel(); // TODO: export to level builder class
        }
        Level.prototype.constructLevel = function () {
            var _this = this;
            var terrain;
            var floors = [];
            var easyMap = function (x, y, what) {
                var xy = new Brew.Coordinate(x, y);
                if (what == 1) {
                    terrain = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Wall);
                }
                else if (what == 0) {
                    terrain = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Floor);
                    floors.push(xy);
                }
                else {
                    throw new RangeError("Unexpected levelgen return value " + what);
                }
                _this.terrain.setAt(xy, terrain);
            };
            var rotMap = new ROT.Map.Rogue(this.width, this.height);
            rotMap.create(easyMap);
            // unless otherwise specified, pick a random start location
            this.simple_start_xy = Brew.randomOf(floors);
            this.floors = floors;
            // some items
            var it;
            for (var i = 0; i < 4; i++) {
                it = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Widget);
                this.items.setAt(Brew.randomOf(floors), it);
            }
        };
        Level.prototype.isValid = function (xy) {
            return (xy.x >= 0) && (xy.y >= 0) && (xy.x < this.width) && (xy.y < this.height);
        };
        return Level;
    }());
    Brew.Level = Level;
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    var Path;
    (function (Path) {
        var MAX_INT = Number.MAX_VALUE;
        var PathmapType;
        (function (PathmapType) {
            PathmapType[PathmapType["ToTarget"] = 0] = "ToTarget";
            PathmapType[PathmapType["EscapeTarget"] = 1] = "EscapeTarget";
        })(PathmapType = Path.PathmapType || (Path.PathmapType = {}));
        var Pathmap = (function () {
            function Pathmap(level, pathtype) {
                this.field = new Brew.GridOfThings();
                this.pathtype = pathtype;
                this.initBlankPathmap(level);
            }
            Pathmap.prototype.initBlankPathmap = function (level) {
                // fill in entire map with MAX INT
                for (var x = 0; x < level.width; x++) {
                    for (var y = 0; y < level.height; y++) {
                        var xy = new Brew.Coordinate(x, y);
                        this.field.setAt(xy, MAX_INT);
                    }
                }
                // todo: quicker way to fill in entier 2D array with number?
            };
            Pathmap.prototype.setPassableKeysList = function (passable_keys) {
                this.passable_keys_list = passable_keys;
            };
            Pathmap.prototype.solve = function () {
                var _this = this;
                var made_changes = true;
                var num_passes = 0;
                while (made_changes) {
                    made_changes = false;
                    for (var i = 0; i < this.passable_keys_list.length; i++) {
                        var key = this.passable_keys_list[i];
                        var adj_keys = Brew.adjacentKeys(key);
                        var neighbor_val = MAX_INT;
                        for (var n = 0; n < adj_keys.length; n++) {
                            var adj_val = this.field.things[adj_keys[n]];
                            if (adj_val != undefined) {
                                if (adj_val < MAX_INT) {
                                    // console.log(adj_val)
                                }
                                neighbor_val = Math.min(neighbor_val, adj_val);
                            }
                        }
                        if ((this.field.things[key] - neighbor_val) >= 2) {
                            this.field.things[key] = neighbor_val + 1;
                            // console.log("changed", key)
                            made_changes = true;
                        }
                    }
                    num_passes += 1;
                }
                this.max_value = null;
                this.min_value = null;
                this.field.getAllThings().forEach(function (value, index, array) {
                    if (value && (value != MAX_INT)) {
                        if (_this.max_value) {
                            _this.max_value = Math.max(_this.max_value, value);
                        }
                        else {
                            _this.max_value = value;
                        }
                        if (_this.min_value) {
                            _this.min_value = Math.min(_this.min_value, value);
                        }
                        else {
                            _this.min_value = value;
                        }
                    }
                });
            };
            Pathmap.prototype.getDownhillNeighbor = function (from_xy) {
                var _this = this;
                var lowest_xy = from_xy;
                var lowest_val = this.field.getAt(lowest_xy);
                lowest_xy.getAdjacent().forEach(function (xy, index, array) {
                    var temp_val = _this.field.getAt(xy);
                    if (temp_val < lowest_val) {
                        lowest_val = temp_val;
                        lowest_xy = xy;
                    }
                });
                return lowest_xy;
            };
            Pathmap.prototype.getUnblockedDownhillNeighbor = function (from_xy, level, except_mob) {
                var _this = this;
                // return lowest-value cell not blocked by another something
                var lowest_xy = from_xy;
                var lowest_val = this.field.getAt(lowest_xy);
                lowest_xy.getAdjacent().forEach(function (xy, index, array) {
                    var temp_val = _this.field.getAt(xy);
                    var m = level.monsters.getAt(xy);
                    if (m && (!((except_mob != null) && m.isSameThing(except_mob)))) {
                        return;
                    }
                    if (temp_val < lowest_val) {
                        lowest_val = temp_val;
                        lowest_xy = xy;
                    }
                });
                return lowest_xy;
            };
            return Pathmap;
        }()); //end class
        Path.Pathmap = Pathmap;
        function createGenericMapToPlayer(gm, level) {
            var pm = new Pathmap(level, PathmapType.ToTarget);
            var mob;
            var player = gm.getPlayer();
            var passable_keys_list = level.floors.map(function (xy, index, array) {
                return Brew.xyToKey(xy);
            });
            // // remove monsters from passable spots
            // level.monsters.getAllCoordinates().forEach((xy:Brew.Coordinate, index, array) =>{
            //     let m = level.monsters.getAt(xy)
            //     if (m.isSameThing(player)) {
            //         // skip
            //     } else {
            //         Brew.remove(passable_keys_list, xyToKey(xy))
            //     }
            // })
            // set target to 0
            pm.field.removeAt(player.location);
            pm.field.setAt(player.location, 0);
            pm.setPassableKeysList(passable_keys_list);
            pm.solve();
            return pm;
        }
        Path.createGenericMapToPlayer = createGenericMapToPlayer;
        function createMapFromPlayer(gm, level, to_map) {
            var from_map = new Pathmap(level, PathmapType.EscapeTarget);
            var escape_factor = -1.2;
            var player = gm.getPlayer();
            // invert the to-map
            to_map.field.getAllCoordinates().forEach(function (xy, index, array) {
                var path_val = to_map.field.getAt(xy);
                if (path_val != MAX_INT) {
                    from_map.field.removeAt(xy);
                    from_map.field.setAt(xy, path_val * escape_factor);
                }
            });
            var passable_keys_list = level.floors.map(function (xy, index, array) {
                return Brew.xyToKey(xy);
            });
            // // remove monsters from passable spots
            // level.monsters.getAllCoordinates().forEach((xy:Brew.Coordinate, index, array) =>{
            //     let m = level.monsters.getAt(xy)
            //     if (m.isSameThing(player)) {
            //         // skip
            //     } else {
            //         Brew.remove(passable_keys_list, xyToKey(xy))
            //     }
            // })
            // set target to 0
            from_map.field.removeAt(player.location);
            from_map.field.setAt(player.location, MAX_INT);
            from_map.setPassableKeysList(passable_keys_list);
            from_map.solve();
            return from_map;
        }
        Path.createMapFromPlayer = createMapFromPlayer;
    })(Path = Brew.Path || (Brew.Path = {}));
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    var Intel;
    (function (Intel) {
        // called from postal.js channel
        function mainAiHandler(gm, actor) {
            var level = gm.getCurrentLevel();
            var player = gm.getPlayer();
            // update FOV
            // todo: need this every turn for each monster?
            updateFov(gm, actor);
            // change status
            var is_changed;
            is_changed = updateMonsterStatus(gm, actor);
            // find action
            // default event/action
            var ev = {
                actor: actor,
                eventType: Brew.BrewEventType.Wait,
                playerInitiated: false,
                endsTurn: true
            };
            if (actor.monster_status == Brew.MonsterStatus.Sleep) {
                // do nothing
                ;
            }
            else if (actor.monster_status == Brew.MonsterStatus.Wander) {
                // if we dont have a wander destination, get one
                if (!(actor.destination_xy)) {
                    actor.destination_xy = getSafeLocation(gm, actor);
                    actor.giveup = 0;
                }
                if (actor.location.compare(actor.destination_xy)) {
                    // reached our destination, get a new one
                    actor.destination_xy = getSafeLocation(gm, actor);
                    actor.giveup = 0;
                }
                else {
                    // haven't reached our destination yet
                    if (actor.giveup > 4) {
                        // waited too long, get a new one
                        actor.destination_xy = getSafeLocation(gm, actor);
                        actor.giveup = 0;
                        console.log(actor.name + " gives up");
                    }
                    else {
                        // keep our existing destination
                    }
                }
                // go toward destination if possible
                var new_xy = getNextStepFromAStar(gm, actor, actor.destination_xy);
                if (!(new_xy)) {
                    // couldn't pathfind, increase giveup count
                    actor.giveup += 1;
                }
                else {
                    // got a valid path
                    ev.eventType = Brew.BrewEventType.Move;
                    ev.eventData = {
                        from_xy: actor.location.clone(),
                        to_xy: new_xy
                    };
                }
            }
            else if (actor.monster_status == Brew.MonsterStatus.Hunt) {
                var new_xy = void 0;
                // manage keeps distance / ranged mobs
                if (actor.hasFlag(Brew.Flag.KeepsDistance)) {
                    var dist = Math.floor(Brew.Utils.dist2d(actor.location, player.location));
                    if (dist < actor.attack_range) {
                        // keep away 
                        new_xy = gm.pathmap_from_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player);
                    }
                    else if (dist > actor.attack_range) {
                        // move closer
                        new_xy = gm.pathmap_to_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player);
                    }
                    else {
                        // range attack!
                        var attackEvent = {
                            actor: actor,
                            eventType: Brew.BrewEventType.Attack,
                            playerInitiated: false,
                            endsTurn: true,
                            eventData: {
                                from_xy: actor.location.clone(),
                                target: player,
                                to_xy: player.location.clone(),
                                isMelee: false
                            }
                        };
                        attackEvent.targetingData = {
                            action: Brew.BrewTargetingAction.RangedAttack,
                            method: Brew.BrewTargetingMethod.StraightLine,
                            destinationMustBeVisible: true,
                            destinationMustHaveMob: true,
                            destinationMustBeWalkable: true,
                            from_xy: attackEvent.eventData.from_xy,
                            to_xy: attackEvent.eventData.to_xy,
                            pathBlockedByMobs: true
                        };
                        // check this attack first
                        var rangeAttackCheck = Brew.Events.checkTargetingPath(gm, attackEvent);
                        if (rangeAttackCheck.is_valid) {
                            return attackEvent;
                        }
                        else {
                            console.log("shot blocked!");
                            new_xy = gm.pathmap_to_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player);
                        }
                    }
                }
                else {
                    new_xy = gm.pathmap_to_player.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), player);
                }
                if (!(new_xy)) {
                    // couldn't pathfind, increase giveup count
                    actor.giveup += 1;
                }
                else if (new_xy.compare(player.location)) {
                    // attack!
                    ev.eventType = Brew.BrewEventType.Attack;
                    ev.eventData = {
                        from_xy: actor.location.clone(),
                        target: player,
                        to_xy: player.location.clone(),
                        isMelee: true
                    };
                }
                else {
                    // got a valid path
                    ev.eventType = Brew.BrewEventType.Move;
                    ev.eventData = {
                        from_xy: actor.location.clone(),
                        to_xy: new_xy
                    };
                }
            }
            else if (actor.monster_status == Brew.MonsterStatus.Escape) {
                // todo: escape
            }
            else {
                throw new Error("unknown monster status " + actor.monster_status + " for " + actor.getID());
            }
            return ev;
        }
        Intel.mainAiHandler = mainAiHandler;
        function updateMonsterStatus(gm, actor) {
            var init_status = actor.monster_status;
            var new_status;
            if (actor.monster_status == Brew.MonsterStatus.Sleep) {
                new_status = Brew.MonsterStatus.Sleep;
            }
            else if (actor.monster_status == Brew.MonsterStatus.Wander) {
                if (actor.inFOV(gm.getPlayer())) {
                    // see the player for the 'first' time
                    new_status = Brew.MonsterStatus.Hunt;
                    actor.destination_xy = gm.getPlayer().location;
                }
                else {
                    // keep wandering
                    new_status = Brew.MonsterStatus.Wander;
                }
            }
            else if (actor.monster_status == Brew.MonsterStatus.Hunt) {
                if (actor.inFOV(gm.getPlayer())) {
                    // still hunting
                    new_status = Brew.MonsterStatus.Hunt;
                }
                else {
                    // stop hunting
                    new_status = Brew.MonsterStatus.Wander;
                }
            }
            else if (actor.monster_status == Brew.MonsterStatus.Escape) {
                // todo: escape
                new_status = Brew.MonsterStatus.Escape;
            }
            else {
                throw new Error("unknown monster status " + actor.monster_status + " for " + actor.getID());
            }
            actor.monster_status = new_status;
            return init_status == new_status;
        }
        function getNextStepFromAStar(gm, actor, destination_xy) {
            var path = getPathFromAStar(gm, actor, destination_xy);
            if (path.length <= 1) {
                return null;
            }
            else {
                return path[1];
            }
        }
        function getPathFromAStar(gm, actor, destination_xy) {
            var level = gm.getCurrentLevel();
            var fn_passable = function (x, y) {
                var xy = new Brew.Coordinate(x, y);
                if (!(level.isValid(xy))) {
                    return false;
                }
                if (level.monsters.hasAt(xy) && (!(actor.location.compare(xy)))) {
                    return false;
                }
                var t = level.terrain.getAt(xy);
                return (!(t.blocks_walking));
            };
            var path = [];
            var fn_update_path = function (x, y) {
                // let xy = new Brew.Coordinate(x, y)
                path.push(new Brew.Coordinate(x, y));
            };
            var astar = new ROT.Path.AStar(destination_xy.x, destination_xy.y, fn_passable, {});
            astar.compute(actor.location.x, actor.location.y, fn_update_path);
            return path;
        }
        function getSafeLocation(gm, actor) {
            // returns a walkable, monster-free location
            var xy;
            var tries = 0;
            while (tries < 50) {
                xy = Brew.randomOf(gm.getCurrentLevel().floors);
                if (!(gm.getCurrentLevel().monsters.hasAt(xy))) {
                    return xy;
                }
                tries += 1;
            }
            console.error("unable to find safe location");
            return null;
        }
        function runBeforePlayerTurn(gm, actor) {
            var updates = updateFov(gm, actor);
            gm.displayList(updates);
        }
        Intel.runBeforePlayerTurn = runBeforePlayerTurn;
        function runAfterPlayerTurn(gm, actor) {
            gm.pathmap_to_player = Brew.Path.createGenericMapToPlayer(gm, gm.getCurrentLevel());
            gm.pathmap_from_player = Brew.Path.createMapFromPlayer(gm, gm.getCurrentLevel(), gm.pathmap_to_player);
        }
        Intel.runAfterPlayerTurn = runAfterPlayerTurn;
        function isPlayer(actor) {
            return actor.isType(Brew.Definitions.MonsterType.Hero);
        }
        function updateFov(gm, actor) {
            var old_fov = actor.fov.getAllCoordinates();
            var xy;
            var numberkey;
            actor.clearFov();
            actor.clearKnowledge();
            var level = gm.getCurrentLevel();
            var t;
            var fn_allow_vision = function (x, y) {
                xy = new Brew.Coordinate(x, y);
                // can never see outside the level
                if (!(level.isValid(xy))) {
                    return false;
                }
                //  can always see where you are standing
                if (xy.compare(actor.location)) {
                    return true;
                }
                t = level.terrain.getAt(xy);
                return (!(t.blocks_vision));
            };
            var fn_update_fov = function (x, y, r, visibility) {
                // TODO: also update level for lightcasting
                // ye_level.setLightAt(new Coordinate(x, y), 1)
                xy = new Brew.Coordinate(x, y);
                if (level.isValid(xy)) {
                    // todo: add level to fov definition
                    actor.fov.setAt(xy, true);
                    updateMemoryAt(gm, actor, xy);
                }
                return true;
            };
            // debug fov: see all
            if (isPlayer(actor) && (Brew.Debug.debug_vision == Brew.Debug.Vision.ShowAll)) {
                level.terrain.getAllCoordinates().forEach(function (xy, index, array) {
                    actor.fov.setAt(xy, true);
                });
            }
            else {
                // otherwise, run FOV normally
                // let rot_fov = new ROT.FOV.PreciseShadowcasting(fn_allow_vision, {})
                // rot_fov.compute(actor.location.x, actor.location.y, actor.sight_range, fn_update_fov)
                var rot_fov = new ROT.FOV.RecursiveShadowcasting(fn_allow_vision, {});
                rot_fov.compute(actor.location.x, actor.location.y, actor.sight_range, fn_update_fov);
            }
            // debug fov: add other monster view
            // todo: add different types of view for shading/whatever (e.g. not just boolean true/false)
            if (isPlayer(actor) && (Brew.Debug.debug_vision == Brew.Debug.Vision.ShowMobs)) {
                actor.clearFov();
                level.monsters.getAllThings().forEach(function (mob, index, array) {
                    if (mob.getID() == actor.getID()) {
                        return;
                    }
                    mob.fov.getAllCoordinates().forEach(function (xy, index, array) {
                        actor.fov.setAt(xy, true);
                    });
                });
            }
            var return_xy = Brew.Utils.diffOfCoordinateArrays(old_fov, actor.fov.getAllCoordinates());
            return return_xy;
        }
        Intel.updateFov = updateFov;
        function updateMemoryAt(gm, actor, xy) {
            var level = gm.getCurrentLevel();
            if (actor.memory.hasAt(xy)) {
                actor.memory.removeAt(xy);
            }
            actor.memory.setAt(xy, level.terrain.getAt(xy));
            var it = level.items.getAt(xy);
            if (it) {
                // console.log("added item to memoryu", it.location)
                actor.memory.removeAt(xy);
                actor.memory.setAt(xy, it);
            }
        }
        Intel.updateMemoryAt = updateMemoryAt;
    })(Intel = Brew.Intel || (Brew.Intel = {}));
})(Brew || (Brew = {})); // end namespace
var Brew;
(function (Brew) {
    var Events;
    (function (Events) {
        // called from postal.js channel
        function mainEventhandler(gm, data, envelope) {
            if (data.eventType == Brew.BrewEventType.Error) {
                console.log(data.errorMsg);
                return;
            }
            // if (!(data.eventType in event_function_map)) {
            //     console.error("received unknown event type", data)
            //     return
            // }
            // event_function_map[data.eventType](gm, data)
            if (data.eventType == Brew.BrewEventType.Info) {
                displayInfo(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.Move) {
                move(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.Wait) {
                rest(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.Pickup) {
                pickup(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.Drop) {
                dropItemAttempt(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.Special) {
                special(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.Attack) {
                attack(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.TargetingOn) {
                targetingOn(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.TargetingCancel) {
                targetingCancel(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.TargetingFinish) {
                targetingFinish(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.TargetingMove) {
                targetingMove(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.InventoryOn) {
                showInventoryList(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.InventoryOff) {
                stopShowingInventoryList(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.InventoryMove) {
                updateInventoryList(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.InventorySelect) {
                selectInventoryItem(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.ContextMenuOn) {
                showContextMenu(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.ContextMenuOff) {
                stopShowingContextMenu(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.ContextMenuMove) {
                updateContextMenu(gm, data);
            }
            else if (data.eventType == Brew.BrewEventType.ContextMenuSelect) {
                selectContextFromMenu(gm, data);
            }
            else {
                console.error("received unknown event type", data);
            }
        }
        Events.mainEventhandler = mainEventhandler;
        //////////////////// context menu
        function showContextMenu(gm, data) {
            var contextList = data.eventData.context_list;
            gm.input_handler = Brew.InputHandler.ContextMenu;
            gm.display.contextMenuDraw(contextList, 0);
            data.eventData.selected_item_index = 0;
            gm.endEvent(data);
        }
        function stopShowingContextMenu(gm, data) {
            resetHUDToGame(gm);
            gm.endEvent(data);
        }
        function updateContextMenu(gm, data) {
            var cycle_dir = data.eventData.direction;
            var current_index = gm.getLastEvent().eventData.selected_item_index;
            var menu_list = gm.getLastEvent().eventData.context_list;
            var new_index = Brew.mod(current_index + cycle_dir, menu_list.length);
            gm.display.contextMenuDraw(menu_list, new_index);
            // make sure data carries over during the subsequent event
            data.eventData.context_list = menu_list;
            data.eventData.selected_item_index = new_index;
            data.eventData.item = gm.getLastEvent().eventData.item;
            data.eventData.invkey = gm.getLastEvent().eventData.invkey;
            gm.endEvent(data);
        }
        function selectContextFromMenu(gm, data) {
            var current_index = gm.getLastEvent().eventData.selected_item_index;
            var context_list = gm.getLastEvent().eventData.context_list;
            var activeContext = context_list[current_index];
            if (activeContext == Brew.ContextMenuItem.Drop) {
                var item = gm.getLastEvent().eventData.item;
                var invkey = gm.getLastEvent().eventData.invkey;
                // todo: refactor to drop event, then call endevent with 2nd arg
                var dropEvent = {
                    eventType: Brew.BrewEventType.Drop,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: true,
                    eventData: {
                        item: item,
                        invkey: invkey,
                        target_xy: gm.getPlayer().location.clone()
                    }
                };
                resetHUDToGame(gm);
                gm.endEvent(data, dropEvent);
            }
            else if (activeContext == Brew.ContextMenuItem.Throw) {
                var item = gm.getLastEvent().eventData.item;
                var invkey = gm.getLastEvent().eventData.invkey;
                // zzz
                var startThrowEvent = {
                    eventType: Brew.BrewEventType.TargetingOn,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false,
                    eventData: {
                        start_xy: gm.getPlayer().location,
                        target_xy: gm.getPlayer().location,
                        targetingAction: Brew.BrewTargetingAction.ThrowItem,
                        item: item,
                        invkey: invkey
                    }
                };
                resetHUDToGame(gm);
                gm.endEvent(data, startThrowEvent);
            }
            else {
                throw new Error("bad context given");
            }
        }
        //////////////////// inventory
        function showInventoryList(gm, data) {
            var inv = data.eventData.inventory;
            gm.input_handler = Brew.InputHandler.InventoryList;
            gm.display.inventoryDraw(inv, 0);
            data.eventData.selected_item_index = 0;
            gm.endEvent(data);
        }
        function stopShowingInventoryList(gm, data) {
            resetHUDToGame(gm);
            gm.endEvent(data);
        }
        function resetHUDToGame(gm) {
            gm.input_handler = Brew.InputHandler.Main;
            gm.display.clearDisplay(Brew.DisplayNames.HUD);
            gm.displayAll();
        }
        function updateInventoryList(gm, data) {
            var cycle_dir = data.eventData.direction;
            var inv = gm.getLastEvent().eventData.inventory;
            var selected_item_index = gm.getLastEvent().eventData.selected_item_index;
            var new_index = calcNewInventoryItemIndex(inv, selected_item_index, cycle_dir);
            // gm.input_handler = InputHandler.InventoryList
            gm.display.inventoryDraw(inv, new_index);
            // make sure data carries over during the subsequent event
            data.eventData.inventory = inv;
            data.eventData.selected_item_index = new_index;
            gm.endEvent(data);
        }
        function calcNewInventoryItemIndex(inv, current_index, index_offset) {
            var keys = inv.getKeys();
            var new_index;
            new_index = Brew.mod(current_index + index_offset, keys.length);
            return new_index;
        }
        function selectInventoryItem(gm, data) {
            // grab selection from the last event
            var inv = gm.getLastEvent().eventData.inventory;
            var selected_item_index = gm.getLastEvent().eventData.selected_item_index;
            var invkey = inv.getKeys()[selected_item_index];
            var it = inv.getItemByKey(invkey);
            // todo: different actions, throw, drop, etc
            // todo: need a way to generate follow-on events
            // let dropOK = dropItem(gm, invkey, it)
            var itemEvent = {
                eventType: Brew.BrewEventType.ContextMenuOn,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                eventData: {
                    item: it,
                    invkey: invkey,
                    context_list: [Brew.ContextMenuItem.Drop, Brew.ContextMenuItem.Throw, Brew.ContextMenuItem.Use]
                }
            };
            resetHUDToGame(gm);
            gm.endEvent(data, itemEvent);
        }
        function dropItemAttempt(gm, data) {
            var drop_xy = data.eventData.target_xy;
            var it = gm.getCurrentLevel().items.getAt(drop_xy);
            if (it) {
                var dropError = {
                    eventType: Brew.BrewEventType.Error,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false,
                    errorMsg: "something is already here"
                };
                data.endsTurn = false;
                gm.endEvent(data, dropError);
            }
            else {
                var invkey = data.eventData.invkey;
                var item = data.eventData.item;
                gm.getPlayer().inventory.removeItemByKey(invkey);
                gm.getCurrentLevel().items.setAt(drop_xy, item);
                gm.displayAt(drop_xy);
                gm.endEvent(data);
            }
        }
        //////////////////// targeting
        function targetingOn(gm, data) {
            // targeting data
            data.targetingData = {
                action: data.eventData.targetingAction,
                from_xy: gm.getPlayer().location.clone(),
                to_xy: gm.getPlayer().location.clone(),
                method: Brew.BrewTargetingMethod.StraightLine,
                destinationMustBeVisible: true,
                destinationMustBeWalkable: true,
                destinationMustHaveMob: false,
                pathBlockedByMobs: true
            };
            // initial highlights
            var tgtHighlight = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight);
            tgtHighlight.color = Brew.Color.target_cursor;
            gm.display.highlights.setAt(gm.getPlayer().location, tgtHighlight);
            gm.displayAt(gm.getPlayer().location);
            gm.input_handler = Brew.InputHandler.Targeting;
            gm.endEvent(data);
        }
        function targetingCancel(gm, data) {
            console.log("cancelling targeting");
            clearTargetingHighlights(gm);
            gm.input_handler = Brew.InputHandler.Main;
            gm.endEvent(data);
        }
        function targetingFinish(gm, data) {
            console.log("target gotten: ", data.targetingData.action);
            clearTargetingHighlights(gm);
            gm.input_handler = Brew.InputHandler.Main;
            copyAndReplaceEventData(data, gm.getLastEvent());
            console.log("targeting finish data", data);
            gm.endEvent(data); //, nextTargetingEvent)
            // todo: somehow kick off the next event
        }
        var TargetingError;
        (function (TargetingError) {
            TargetingError[TargetingError["TargetNotViewable"] = 1] = "TargetNotViewable";
            TargetingError[TargetingError["PathBlockedByTerrain"] = 2] = "PathBlockedByTerrain";
            TargetingError[TargetingError["PathBlockedByMob"] = 3] = "PathBlockedByMob";
        })(TargetingError || (TargetingError = {}));
        function checkTargetingPath(gm, data) {
            var response = {
                is_valid: false,
                path: []
            };
            if (data.targetingData.method == Brew.BrewTargetingMethod.PointOnly) {
                var target_xy = data.targetingData.to_xy;
                response.path = [target_xy];
                response.is_valid = true;
            }
            else if (data.targetingData.method == Brew.BrewTargetingMethod.StraightLine) {
                // draw new path
                var path_lst = Brew.Utils.getLineBetweenPoints(data.targetingData.from_xy, data.targetingData.to_xy);
                // assume path is true unless we run into something
                response.is_valid = true;
                var real_path_lst = [];
                var level = gm.getCurrentLevel();
                for (var i = 0; i < path_lst.length; i++) {
                    var xy = path_lst[i];
                    var t = level.terrain.getAt(xy);
                    var in_fov = data.actor.inFOV(t);
                    if (data.targetingData.destinationMustBeVisible && (!(in_fov))) {
                        response.is_valid = false;
                        response.error_reason = TargetingError.TargetNotViewable;
                        break;
                    }
                    if (data.targetingData.destinationMustBeWalkable && t.blocks_walking) {
                        response.is_valid = false;
                        response.error_reason = TargetingError.PathBlockedByTerrain;
                        break;
                    }
                    var m = level.monsters.getAt(xy);
                    var last_element = i == (path_lst.length - 1);
                    if (!(last_element)) {
                        // not the last coord, but mob is in the way
                        if (data.targetingData.pathBlockedByMobs && (m) && (!(i == 0))) {
                            real_path_lst.push(xy);
                            response.is_valid = false;
                            response.error_reason = TargetingError.PathBlockedByMob;
                            response.actual_xy = xy.clone();
                            break;
                        }
                    }
                    else {
                        // is the last element, check if we need to have a mob target
                        // todo: maybe some kind of good / bad indicator for the path
                    }
                    real_path_lst.push(xy);
                } // end path for loop
                response.path = real_path_lst;
            } // end if
            return response;
        }
        Events.checkTargetingPath = checkTargetingPath;
        function showTargetingHighlights(gm, data, targetingResponse) {
            // clear the old highlights
            clearTargetingHighlights(gm);
            // setup our highlight colors
            var tHighlight = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight);
            tHighlight.color = Brew.Color.target_path;
            var tCursor = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight);
            // set highlights across the path and show them
            targetingResponse.path.forEach(function (xy, index, array) {
                gm.display.highlights.setAt(xy, tHighlight);
            });
            // change cursor color depending on the outcome
            if (targetingResponse.is_valid) {
                tCursor.color = Brew.Color.target_cursor;
            }
            else {
                tCursor.color = Brew.Color.target_error;
            }
            // set the cursor by itself
            gm.display.highlights.removeAt(data.targetingData.to_xy);
            gm.display.highlights.setAt(data.targetingData.to_xy, tCursor);
            // tell the display to redraw all these new highlighted squares
            gm.displayList(targetingResponse.path.concat(data.targetingData.to_xy));
            // gm.displayAt(data.targetingData.to_xy)
        }
        function clearTargetingHighlights(gm) {
            // actually just clear all highlights
            var copyList = gm.display.highlights.getAllCoordinates();
            copyList.forEach(function (value, index, array) {
                gm.display.highlights.removeAt(value);
            });
            gm.displayList(copyList);
        }
        function targetingMove(gm, data) {
            // modify event, so we can grab last event next time.. keep updating target location as we move
            // move target
            var offset_xy = data.eventData.offset_xy;
            var current_target_xy = data.targetingData.to_xy;
            var new_target_xy = current_target_xy.add(offset_xy);
            // set new target
            data.targetingData.to_xy = new_target_xy;
            // check new targeting and show the results
            var resp = checkTargetingPath(gm, data);
            showTargetingHighlights(gm, data, resp);
            console.log(data); //twp: its not copying.. getting overridden by targeting events and losing throw/item info
            // todo: may instead need a way that builds/replaces eventData over subsequent events, and clears out only after certain types
            // or certain types in the same family just copy everything every time
            copyAndReplaceEventData(data, gm.getLastEvent());
            console.log(data);
            gm.endEvent(data);
        }
        function copyAndReplaceEventData(event_source, event_dest) {
            if (event_source.eventData) {
                event_dest.eventData = {};
                for (var key in event_source.eventData) {
                    if (event_source.eventData.hasOwnProperty(key)) {
                        event_dest.eventData[key] = event_source.eventData[key];
                    }
                }
            }
        }
        function move(gm, data) {
            var level = gm.getCurrentLevel();
            level.monsters.removeAt(data.eventData.from_xy);
            level.monsters.setAt(data.eventData.to_xy, data.actor);
            gm.displayList([data.eventData.from_xy, data.eventData.to_xy]);
            gm.endEvent(data);
        }
        function rest(gm, data) {
            console.log(data.actor.name + " waits");
            gm.endEvent(data);
        }
        function pickup(gm, data) {
            // remove it from the floor
            var it = data.eventData.item;
            gm.getCurrentLevel().items.removeAt(it.location);
            // console.log("removed from level", it.location)
            // Intel.updateMemoryAt(gm, gm.getPlayer(), it.location)
            // add to inventory
            var ok = gm.getPlayer().inventory.addItem(it);
            if (!(ok)) {
                throw new Error("inventory full - we shouldn't be here");
            }
            console.log("Picked up " + it.name);
            gm.endEvent(data);
        }
        function attack(gm, data) {
            var target = data.eventData.target;
            if (data.eventData.isMelee) {
                console.log(data.actor.name + " attacks " + data.eventData.target.name);
                gm.endEvent(data);
            }
            else {
                console.log(data.actor.name + " SHOOTS " + data.eventData.target.name);
                animateShot(gm, data);
            }
        }
        function animateShot(gm, data) {
            var to_xy = data.eventData.to_xy;
            var from_xy = data.eventData.from_xy;
            var path = Brew.Utils.getLineBetweenPoints(from_xy, to_xy);
            path.splice(0, 1);
            var level = gm.getCurrentLevel();
            // console.log(path)
            path.forEach(function (xy, index, array) {
                setTimeout(function () {
                    if (index == path.length - 1) {
                        level.above.removeAt(path[index - 1]);
                        gm.displayAt(path[index - 1]);
                        gm.endEvent(data);
                    }
                    else {
                        if (index > 0) {
                            // remove old one
                            level.above.removeAt(path[index - 1]);
                            gm.displayAt(path[index - 1]);
                        }
                        level.above.removeAt(xy);
                        level.above.setAt(xy, Brew.Definitions.aboveFactory(Brew.Definitions.AboveType.Projectile));
                        gm.displayAt(xy);
                    }
                }, (index * 150));
            });
        }
        function special(gm, data) {
            var level = gm.getCurrentLevel();
            // disappear
            level.monsters.removeAt(data.actor.location);
            gm.displayAt(data.actor.location);
            // reappear
            setTimeout(function () {
                level.monsters.setAt(data.eventData.target_xy, data.actor);
                gm.displayAt(data.eventData.target_xy);
                gm.endEvent(data);
            }, 2500);
        }
        function displayInfo(gm, data) {
            var level = gm.getCurrentLevel();
            // debug show what's there
            var divDebug = (document.getElementById("id_div_debug"));
            divDebug.innerHTML = "<p>" + data.eventData.target_xy.toString() + "</p>";
            gm.endEvent(data);
        }
        function animateThrownItem(gm, data) {
            // todo: remove this duplicate pathfinding
            // todo: add a way to trigger event after animation is done (e.g. damage, drop item)
            var to_xy = data.eventData.to_xy;
            var from_xy = data.eventData.from_xy;
            var path = Brew.Utils.getLineBetweenPoints(from_xy, to_xy);
            path.splice(0, 1);
            var level = gm.getCurrentLevel();
            // console.log(path)
            path.forEach(function (xy, index, array) {
                setTimeout(function () {
                    if (index == path.length - 1) {
                        level.above.removeAt(path[index - 1]);
                        // todo: need a way to block or knock items already there
                        level.items.removeAt(path[index - 1]);
                        level.items.setAt(path[index - 1], data.eventData.item);
                        gm.displayAt(path[index - 1]);
                        gm.endEvent(data);
                    }
                    else {
                        if (index > 0) {
                            // remove old one
                            level.above.removeAt(path[index - 1]);
                            gm.displayAt(path[index - 1]);
                        }
                        level.above.removeAt(xy);
                        level.above.setAt(xy, Brew.Definitions.aboveFactory(Brew.Definitions.AboveType.Projectile));
                        gm.displayAt(xy);
                    }
                }, (index * 150));
            });
        }
    })(Events = Brew.Events || (Brew.Events = {}));
})(Brew || (Brew = {})); // end namespace
var Brew;
(function (Brew) {
    var Input;
    (function (Input) {
        function inputError(errorMsg) {
            return {
                eventType: Brew.BrewEventType.Error,
                actor: null,
                playerInitiated: true,
                endsTurn: false,
                errorMsg: errorMsg
            };
        }
        // called from postal.js channel
        function handleAllInput(gm, data, envelope) {
            var myEvent;
            // default main handler
            if (gm.input_handler == Brew.InputHandler.Main) {
                myEvent = mainInputHandler(gm, data, envelope);
                // targeting handler
            }
            else if (gm.input_handler == Brew.InputHandler.Targeting) {
                myEvent = targetingInputHandler(gm, data, envelope);
                // inventory screen handler
            }
            else if (gm.input_handler == Brew.InputHandler.InventoryList) {
                myEvent = inventoryListInputHandler(gm, data, envelope);
                // context menu handler
            }
            else if (gm.input_handler == Brew.InputHandler.ContextMenu) {
                myEvent = contextMenuHandler(gm, data, envelope);
            }
            else {
                console.error("unknown input handler " + gm.input_handler);
            }
            // post to events channel here ?
            gm.channel_event.publish("event.start", myEvent);
        }
        Input.handleAllInput = handleAllInput;
        function inventoryListInputHandler(gm, data, envelope) {
            var keycode = data.code;
            var invEvent;
            if (Brew.KeyMap.Escape.indexOf(keycode) > -1) {
                invEvent = {
                    eventType: Brew.BrewEventType.InventoryOff,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false
                };
                return invEvent;
            }
            else if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
                var cycle_dir = void 0;
                var offset_xy = Brew.Utils.getDirectionFromKeycode(keycode);
                if ((offset_xy.x < 0) || (offset_xy.y < 0)) {
                    cycle_dir = -1;
                }
                else if ((offset_xy.x > 0) || (offset_xy.y > 0)) {
                    cycle_dir = 1;
                }
                else {
                    throw new Error("Some kind of weird direction thingy happened");
                }
                invEvent = {
                    eventType: Brew.BrewEventType.InventoryMove,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false,
                    eventData: {
                        direction: cycle_dir
                    }
                };
                return invEvent;
            }
            else if (Brew.KeyMap.Action.indexOf(keycode) > -1) {
                invEvent = {
                    eventType: Brew.BrewEventType.InventorySelect,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false
                };
                return invEvent;
            }
            else {
                return inputError("inventory screen - unknown keypress");
            }
        }
        function contextMenuHandler(gm, data, envelope) {
            var keycode = data.code;
            var contextmenuEvent;
            if (Brew.KeyMap.Escape.indexOf(keycode) > -1) {
                contextmenuEvent = {
                    eventType: Brew.BrewEventType.ContextMenuOff,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false
                };
                return contextmenuEvent;
            }
            else if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
                var cycle_dir = void 0;
                var offset_xy = Brew.Utils.getDirectionFromKeycode(keycode);
                if ((offset_xy.x < 0) || (offset_xy.y < 0)) {
                    cycle_dir = -1;
                }
                else if ((offset_xy.x > 0) || (offset_xy.y > 0)) {
                    cycle_dir = 1;
                }
                else {
                    throw new Error("Some kind of weird direction thingy happened");
                }
                contextmenuEvent = {
                    eventType: Brew.BrewEventType.ContextMenuMove,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false,
                    eventData: {
                        direction: cycle_dir
                    }
                };
                return contextmenuEvent;
            }
            else if (Brew.KeyMap.Action.indexOf(keycode) > -1) {
                contextmenuEvent = {
                    eventType: Brew.BrewEventType.ContextMenuSelect,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: false
                };
                return contextmenuEvent;
            }
            else {
                return inputError("context menu - unknown keypress");
            }
        }
        function targetingInputHandler(gm, data, envelope) {
            var tgtEvent;
            var lastEvent = gm.getLastEvent();
            if (data.source == Brew.BrewInputSource.Keyboard) {
                var keycode = data.code;
                if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
                    // move target
                    var offset_xy = Brew.Utils.getDirectionFromKeycode(keycode);
                    var current_target_xy = lastEvent.targetingData.to_xy.clone();
                    var new_target_xy = current_target_xy.add(offset_xy);
                    if (!(gm.getCurrentLevel().isValid(new_target_xy))) {
                        return inputError("can't move target over there");
                    }
                    // new move event
                    tgtEvent = {
                        eventType: Brew.BrewEventType.TargetingMove,
                        actor: gm.getPlayer(),
                        playerInitiated: true,
                        endsTurn: false,
                        eventData: {
                            offset_xy: offset_xy
                        }
                    };
                    // copy targeting data over from last event
                    tgtEvent.targetingData = Brew.clone(lastEvent.targetingData);
                    tgtEvent.targetingData.to_xy = lastEvent.targetingData.to_xy.clone();
                    tgtEvent.targetingData.from_xy = lastEvent.targetingData.from_xy.clone();
                }
                else if ((Brew.KeyMap.Action.indexOf(keycode) > -1) || (Brew.KeyMap.Examine.indexOf(keycode) > -1)) {
                    // todo: make this trigger the actual thing we are targeting for
                    // finish targeting
                    tgtEvent = {
                        eventType: Brew.BrewEventType.TargetingFinish,
                        actor: gm.getPlayer(),
                        playerInitiated: true,
                        endsTurn: false
                    };
                    // copy targeting data over from last event
                    tgtEvent.targetingData = Brew.clone(gm.getLastEvent().targetingData);
                }
                else {
                    // cancel it
                    tgtEvent = {
                        eventType: Brew.BrewEventType.TargetingCancel,
                        actor: gm.getPlayer(),
                        playerInitiated: true,
                        endsTurn: false
                    };
                }
            }
            else if (data.source == Brew.BrewInputSource.Mouse) {
                var screen_xy = getScreenCoordsFromMouseEvent(gm, data);
                if (!(screen_xy)) {
                    return inputError("click outside of screen");
                }
                var map_xy = gm.display.convertScreenToMap(screen_xy);
                if (data.jsevent.type == "mousedown") {
                    // finish targeting
                    tgtEvent = {
                        eventType: Brew.BrewEventType.TargetingFinish,
                        actor: gm.getPlayer(),
                        playerInitiated: true,
                        endsTurn: false
                    };
                    // copy targeting data over from last event
                    tgtEvent.targetingData = Brew.clone(gm.getLastEvent().targetingData);
                }
                else if (data.jsevent.type == "mousemove") {
                    var current_target_xy = lastEvent.targetingData.to_xy.clone();
                    var new_target_xy = map_xy;
                    // new move event
                    tgtEvent = {
                        eventType: Brew.BrewEventType.TargetingMove,
                        actor: gm.getPlayer(),
                        playerInitiated: true,
                        endsTurn: false,
                        eventData: {
                            offset_xy: map_xy.subtract(current_target_xy)
                        }
                    };
                    // copy targeting data over from last event
                    tgtEvent.targetingData = Brew.clone(lastEvent.targetingData);
                    tgtEvent.targetingData.to_xy = lastEvent.targetingData.to_xy.clone();
                    tgtEvent.targetingData.from_xy = lastEvent.targetingData.from_xy.clone();
                }
            }
            return tgtEvent;
        }
        function mainInputHandler(gm, data, envelope) {
            var playerEvent;
            if (data.source == Brew.BrewInputSource.Keyboard) {
                playerEvent = translateKeyboardInputIntoEvent(gm, data, envelope);
            }
            else if (data.source == Brew.BrewInputSource.Mouse) {
                playerEvent = translateMouseInputIntoEvent(gm, data, envelope);
            }
            else {
                console.error("unexpected input type");
            }
            return playerEvent;
        }
        function translateKeyboardInputIntoEvent(gm, data, envelope) {
            var ev;
            ev = {
                eventType: null,
                actor: gm.getPlayer(),
                playerInitiated: true
            };
            var keycode = data.code;
            if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
                return inputMovement(gm, keycode);
            }
            else if (Brew.KeyMap.Action.indexOf(keycode) > -1) {
                return inputAction(gm, keycode);
            }
            else if (Brew.KeyMap.Examine.indexOf(keycode) > -1) {
                return inputExamine(gm, keycode);
            }
            else if (Brew.KeyMap.DebugFOV.indexOf(keycode) > -1) {
                Brew.Debug.toggleFOV(gm);
            }
            else if (Brew.KeyMap.DebugPaths.indexOf(keycode) > -1) {
                Brew.Debug.togglePathmap(gm, Brew.Path.createGenericMapToPlayer(gm, gm.getCurrentLevel()));
            }
            else if (Brew.KeyMap.Inventory.indexOf(keycode) > -1) {
                return inputInventory(gm, keycode);
            }
            return inputError("invalid keyboard input");
        }
        function inputMovement(gm, keycode) {
            var level = gm.getCurrentLevel();
            // determine offset
            var offset_xy = Brew.Utils.getDirectionFromKeycode(keycode);
            if (!(offset_xy)) {
                return inputError("invalid movement key - no direction");
            }
            // check whats over there
            var new_xy = gm.getPlayer().location.add(offset_xy);
            if (!(level.isValid(new_xy))) {
                return inputError("You can't go there");
            }
            var t = level.terrain.getAt(new_xy);
            if (t.blocks_walking) {
                return inputError("You can't WALK there");
            }
            var m = level.monsters.getAt(new_xy);
            if (m) {
                return playerMeleeAttack(gm, m);
            }
            // move event
            var old_xy = gm.getPlayer().location.clone();
            var moveEvent = {
                eventType: Brew.BrewEventType.Move,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: true,
                eventData: {
                    from_xy: old_xy,
                    to_xy: new_xy
                }
            };
            return moveEvent;
        }
        function playerMeleeAttack(gm, target) {
            var attackEvent = {
                eventType: Brew.BrewEventType.Attack,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: true,
                eventData: {
                    from_xy: gm.getPlayer().location,
                    to_xy: target.location,
                    target: target,
                    isMelee: true
                }
            };
            return attackEvent;
        }
        function inputAction(gm, keycode) {
            // pickup / rest
            // lets see whats here
            var level = gm.getCurrentLevel();
            var player = gm.getPlayer();
            var it = level.items.getAt(player.location);
            if (it) {
                // try to  pick it up
                var ok = player.inventory.hasCapacity();
                if (ok) {
                    var pickupEvent = {
                        eventType: Brew.BrewEventType.Pickup,
                        actor: player,
                        playerInitiated: true,
                        endsTurn: true,
                        eventData: {
                            item: it
                        }
                    };
                    return pickupEvent;
                }
                else {
                    return inputError("Your inventory is full");
                }
            }
            else {
                // nothing here, so rest
                var restEvent = {
                    eventType: Brew.BrewEventType.Wait,
                    actor: gm.getPlayer(),
                    playerInitiated: true,
                    endsTurn: true
                };
                return restEvent;
            }
        }
        function inputExamine(gm, keycode) {
            var examineEvent = {
                eventType: Brew.BrewEventType.TargetingOn,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                eventData: {
                    start_xy: gm.getPlayer().location,
                    target_xy: gm.getPlayer().location,
                    targetingAction: Brew.BrewTargetingAction.Examine
                }
            };
            return examineEvent;
        }
        function inputInventory(gm, keycode) {
            var invEvent = {
                eventType: Brew.BrewEventType.InventoryOn,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                eventData: {
                    inventory: gm.getPlayer().inventory
                }
            };
            return invEvent;
        }
        function getScreenCoordsFromMouseEvent(gm, data) {
            // use ROT to translate on screen coords
            var rot_coords;
            rot_coords = gm.display.getDisplay(Brew.DisplayNames.Game).eventToPosition(data.jsevent);
            if (rot_coords[0] == -1) {
                return null;
            }
            var screen_xy = new Brew.Coordinate(rot_coords[0], rot_coords[1]);
            return screen_xy;
        }
        function translateMouseInputIntoEvent(gm, data, envelope) {
            var screen_xy = getScreenCoordsFromMouseEvent(gm, data);
            if (!(screen_xy)) {
                return inputError("click outside of screen");
            }
            var map_xy = gm.display.convertScreenToMap(screen_xy);
            if (data.jsevent.type != "mousedown") {
                return inputHover(gm, map_xy);
            }
            if (data.button == 0) {
                // regular click
                return inputClick(gm, map_xy);
            }
            else {
                // return inputAltClick(gm, data, map_xy)
                return inputError("no alt clicking allowed");
            }
        }
        function inputHover(gm, map_xy) {
            var infoEvent = {
                eventType: Brew.BrewEventType.Info,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                eventData: {
                    target_xy: map_xy
                }
            };
            return infoEvent;
        }
        function inputClick(gm, map_xy) {
            var specialEvent = {
                eventType: Brew.BrewEventType.Special,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: true,
                eventData: {
                    target_xy: map_xy
                }
            };
            return specialEvent;
        }
    })(Input = Brew.Input || (Brew.Input = {}));
})(Brew || (Brew = {})); // end namespace
/// <reference path="./lib/rot.js-TS/rot.d.ts" />
/// <reference path="./lib/postal.d.ts" />
/// <reference path="./brew_engine/display.ts" />
/// <reference path="./brew_engine/grid.ts" />
/// <reference path="./brew_engine/pathmap.ts" />
/// <reference path="./brew_game/intel.ts" />
/// <reference path="./brew_game/events.ts" />
/// <reference path="./brew_game/input.ts" />
var gm;
function startGame() {
    var divGame = (document.getElementById("id_div_game"));
    gm = new Brew.GameMaster(divGame, Brew.Input.handleAllInput, // input
    Brew.Events.mainEventhandler, // event
    Brew.Intel.mainAiHandler, // ai
    Brew.Intel.runBeforePlayerTurn, // pre-player
    Brew.Intel.runAfterPlayerTurn // post-player 
    );
}
window.onload = startGame;
var Brew;
(function (Brew) {
    var Config;
    (function (Config) {
        Config.screen_width_tiles = 20;
        Config.screen_height_tiles = 20;
        Config.map_width_tiles = Config.screen_width_tiles;
        Config.map_height_tiles = Config.screen_height_tiles;
    })(Config = Brew.Config || (Brew.Config = {}));
})(Brew || (Brew = {}));
// module Brew.Keys {
// 	export const Movement = [Brew.KeyMap.MoveDown, Brew.KeyMap.MoveL ]
// 	export const Action = [ROT.VK_SPACE]
// }
(function (Brew) {
    var KeyMap;
    (function (KeyMap) {
        KeyMap.MoveRight = [ROT.VK_RIGHT, ROT.VK_D];
        KeyMap.MoveLeft = [ROT.VK_LEFT, ROT.VK_A];
        KeyMap.MoveUp = [ROT.VK_UP, ROT.VK_W];
        KeyMap.MoveDown = [ROT.VK_DOWN, ROT.VK_S];
        KeyMap.MovementKeys = KeyMap.MoveRight.concat(KeyMap.MoveLeft, KeyMap.MoveUp, KeyMap.MoveDown);
        KeyMap.Action = [ROT.VK_SPACE, ROT.VK_RETURN];
        KeyMap.Examine = [ROT.VK_X];
        KeyMap.Inventory = [ROT.VK_I];
        KeyMap.DebugFOV = [ROT.VK_SLASH];
        KeyMap.DebugPaths = [ROT.VK_Q];
        KeyMap.Escape = [ROT.VK_ESCAPE];
    })(KeyMap = Brew.KeyMap || (Brew.KeyMap = {}));
})(Brew || (Brew = {}));
(function (Brew) {
    var Directions;
    (function (Directions) {
        Directions.UP = new Brew.Coordinate(0, -1);
        Directions.DOWN = new Brew.Coordinate(0, 1);
        Directions.LEFT = new Brew.Coordinate(-1, 0);
        Directions.RIGHT = new Brew.Coordinate(1, 0);
    })(Directions = Brew.Directions || (Brew.Directions = {}));
})(Brew || (Brew = {}));
(function (Brew) {
    var Color;
    (function (Color) {
        // 'system' colors
        Color.normal = [150, 150, 150];
        Color.black = [10, 10, 10];
        // basic colors
        Color.white = [255, 255, 255];
        Color.blue = [0, 204, 255];
        Color.orange = [255, 102, 0];
        Color.green = [0, 204, 0];
        Color.yellow = [246, 198, 91];
        Color.red = [204, 0, 0];
        // targeting paths
        Color.target_path = Brew.Color.yellow;
        Color.target_cursor = Brew.Color.orange;
        Color.target_error = Brew.Color.red;
        // FOV / memory
        Color.bg_unexplored = Brew.Color.white;
        Color.bg_explored = Brew.Color.white;
        Color.memory = [80, 80, 104];
    })(Color = Brew.Color || (Brew.Color = {}));
})(Brew || (Brew = {}));
(function (Brew) {
    var Flag;
    (function (Flag) {
        Flag[Flag["KeepsDistance"] = 0] = "KeepsDistance";
        Flag[Flag["SeeAll"] = 1] = "SeeAll";
        Flag[Flag["IsInvisible"] = 2] = "IsInvisible";
    })(Flag = Brew.Flag || (Brew.Flag = {}));
})(Brew || (Brew = {}));
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
var Brew;
(function (Brew) {
    var BrewEventType;
    (function (BrewEventType) {
        BrewEventType[BrewEventType["Error"] = 0] = "Error";
        BrewEventType[BrewEventType["Info"] = 1] = "Info";
        BrewEventType[BrewEventType["Wait"] = 2] = "Wait";
        BrewEventType[BrewEventType["Move"] = 3] = "Move";
        BrewEventType[BrewEventType["Attack"] = 4] = "Attack";
        BrewEventType[BrewEventType["Pickup"] = 5] = "Pickup";
        BrewEventType[BrewEventType["Drop"] = 6] = "Drop";
        BrewEventType[BrewEventType["TargetingOn"] = 7] = "TargetingOn";
        BrewEventType[BrewEventType["TargetingCancel"] = 8] = "TargetingCancel";
        BrewEventType[BrewEventType["TargetingFinish"] = 9] = "TargetingFinish";
        BrewEventType[BrewEventType["TargetingMove"] = 10] = "TargetingMove";
        BrewEventType[BrewEventType["InventoryOn"] = 11] = "InventoryOn";
        BrewEventType[BrewEventType["InventoryMove"] = 12] = "InventoryMove";
        BrewEventType[BrewEventType["InventoryOff"] = 13] = "InventoryOff";
        BrewEventType[BrewEventType["InventorySelect"] = 14] = "InventorySelect";
        BrewEventType[BrewEventType["ContextMenuOn"] = 15] = "ContextMenuOn";
        BrewEventType[BrewEventType["ContextMenuMove"] = 16] = "ContextMenuMove";
        BrewEventType[BrewEventType["ContextMenuSelect"] = 17] = "ContextMenuSelect";
        BrewEventType[BrewEventType["ContextMenuOff"] = 18] = "ContextMenuOff";
        BrewEventType[BrewEventType["Special"] = 19] = "Special";
    })(BrewEventType = Brew.BrewEventType || (Brew.BrewEventType = {}));
    var ContextMenuItem;
    (function (ContextMenuItem) {
        ContextMenuItem[ContextMenuItem["Drop"] = 1] = "Drop";
        ContextMenuItem[ContextMenuItem["Use"] = 2] = "Use";
        ContextMenuItem[ContextMenuItem["Throw"] = 3] = "Throw";
    })(ContextMenuItem = Brew.ContextMenuItem || (Brew.ContextMenuItem = {}));
    var BrewTargetingMethod;
    (function (BrewTargetingMethod) {
        BrewTargetingMethod[BrewTargetingMethod["PointOnly"] = 0] = "PointOnly";
        BrewTargetingMethod[BrewTargetingMethod["StraightLine"] = 1] = "StraightLine";
    })(BrewTargetingMethod = Brew.BrewTargetingMethod || (Brew.BrewTargetingMethod = {}));
    var BrewTargetingAction;
    (function (BrewTargetingAction) {
        BrewTargetingAction[BrewTargetingAction["Examine"] = 0] = "Examine";
        BrewTargetingAction[BrewTargetingAction["Teleport"] = 1] = "Teleport";
        BrewTargetingAction[BrewTargetingAction["ThrowItem"] = 2] = "ThrowItem";
        BrewTargetingAction[BrewTargetingAction["RangedAttack"] = 3] = "RangedAttack";
    })(BrewTargetingAction = Brew.BrewTargetingAction || (Brew.BrewTargetingAction = {}));
    var BrewInputSource;
    (function (BrewInputSource) {
        BrewInputSource[BrewInputSource["Keyboard"] = 0] = "Keyboard";
        BrewInputSource[BrewInputSource["Mouse"] = 1] = "Mouse";
        BrewInputSource[BrewInputSource["Touch"] = 2] = "Touch";
    })(BrewInputSource = Brew.BrewInputSource || (Brew.BrewInputSource = {}));
    var InputHandler;
    (function (InputHandler) {
        InputHandler[InputHandler["Main"] = 0] = "Main";
        InputHandler[InputHandler["Targeting"] = 1] = "Targeting";
        InputHandler[InputHandler["InventoryList"] = 2] = "InventoryList";
        InputHandler[InputHandler["ContextMenu"] = 3] = "ContextMenu";
    })(InputHandler = Brew.InputHandler || (Brew.InputHandler = {}));
    var GameMaster = (function () {
        function GameMaster(div_container, input_fn, event_fn, ai_fn, preplayer_fn, postplayer_fn) {
            var _this = this;
            this.turn_count = 0;
            this.input_handler = InputHandler.Main;
            // instantiate ROTjs engine
            this.scheduler = new ROT.Scheduler.Speed();
            this.engine = new ROT.Engine(this.scheduler);
            this.block_input = true;
            // display class will handle setting up canvas, etc
            this.display = new Brew.Display(this, div_container);
            // setup event/input handlers
            this.initEventListener(div_container);
            // instantiate postal.js channels
            this.channel_event = postal.channel("event");
            this.channel_turn = postal.channel("turn");
            this.channel_input = postal.channel("input");
            this.channel_display = postal.channel("display");
            // outsourced functions
            this.event_fn = event_fn;
            this.input_fn = input_fn;
            this.ai_fn = ai_fn;
            this.preplayer_fn = preplayer_fn;
            this.postplayer_fn = postplayer_fn;
            // start feed listeners
            this.feed_turn_start = this.channel_turn.subscribe("turn.start", function (data, envelope) { _this.handleTurnStart(data, envelope); });
            this.feed_turn_end = this.channel_turn.subscribe("turn.end", function (data, envelope) { _this.handleTurnEnd(data, envelope); });
            this.feed_event = this.channel_event.subscribe("event.start", function (data, envelope) { _this.eventFunctionWrapper(data, envelope); });
            this.feed_event = this.channel_event.subscribe("event.end", function (data, envelope) { _this.handleEventEnd(data, envelope); });
            this.feed_input = this.channel_input.subscribe("input.*", function (data, envelope) { _this.inputFunctionWrapper(data, envelope); });
            this.feed_display = this.channel_display.subscribe("display.*", function (data, envelope) { _this.handleDisplay(data, envelope); });
            // set up first level, start engine, define player, etc
            this.setupGame();
        }
        GameMaster.prototype.setupGame = function () {
            this.setupPlayer();
            this.setupNewLevel(0);
            this.engine.start();
        };
        GameMaster.prototype.setupPlayer = function () {
            var player = Brew.Definitions.monsterFactory(this, Brew.Definitions.MonsterType.Hero);
            player.name = "Hero";
            player.inventory = new Brew.Inventory(4);
            player.inventory.addItem(Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Widget));
            player.inventory.addItem(Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Sprocket));
            this.player = player;
            this.scheduler.add(this.player, true);
        };
        GameMaster.prototype.setupNewLevel = function (depth) {
            this.engine.lock();
            // todo: make a proper level generator outside of this
            var level = new Brew.Level(Brew.Config.map_width_tiles, Brew.Config.map_height_tiles, depth);
            level.monsters.setAt(level.simple_start_xy, this.player);
            for (var i = 0; i < 2; i++) {
                var mob = Brew.Definitions.monsterFactory(this, Brew.Definitions.MonsterType.Guardguy, { monster_status: Brew.MonsterStatus.Wander });
                // mob.monster_status = Brew.MonsterStatus.Wander
                var xy = Brew.randomOf(level.floors);
                level.monsters.setAt(xy, mob);
                this.scheduler.add(mob, true);
            }
            this.current_level = level;
            this.pathmap_to_player = Brew.Path.createGenericMapToPlayer(this, this.getCurrentLevel());
            this.pathmap_from_player = Brew.Path.createMapFromPlayer(this, this.getCurrentLevel(), this.pathmap_to_player);
            //this.preplayer_fn(this, this.player)
            //this.display.drawAll()
            this.engine.unlock();
        };
        GameMaster.prototype.inputFunctionWrapper = function (data, envelope) {
            if (this.block_input == true) {
                // console.warn("input blocked")
                ;
            }
            else {
                this.input_fn(this, data, envelope);
            }
        };
        GameMaster.prototype.eventFunctionWrapper = function (data, envelope) {
            if (data.eventType != BrewEventType.Error) {
                this.block_input = true;
            }
            this.event_fn(this, data, envelope);
        };
        GameMaster.prototype.handleDisplay = function (data, envelope) {
            if (envelope.topic == "display.all") {
                this.display.drawAll(data);
            }
            else if (envelope.topic == "display.at") {
                this.display.drawAt(data);
            }
            else if (envelope.topic == "display.list") {
                for (var i = 0; i < data.length; i++) {
                    this.display.drawAt(data[i]);
                }
            }
            else {
                console.error("invalid display data", data);
            }
        };
        GameMaster.prototype.handleEventEnd = function (data, envelope) {
            this.lastEventIncludeErrors = data; // keep track of last events including errors 
            if (data.eventType != BrewEventType.Error) {
                this.lastEvent = data; // keep track of the last non-error event
            }
            if (data.endsTurn) {
                // console.log("event end: turn end")
                this.channel_turn.publish("turn.end", { actor: data.actor });
            }
            else {
                // if it doesn't end turn, allow the player to put in input again
                if (data.actor.isType(Brew.Definitions.MonsterType.Hero)) {
                    // console.log("input blocking OFF")
                    this.block_input = false;
                }
            }
        };
        GameMaster.prototype.initEventListener = function (div_container) {
            var _this = this;
            // add event listeners to page/canvas
            div_container.ownerDocument.addEventListener("keydown", function (e) {
                if (Brew.KeyMap.MovementKeys.concat(Brew.KeyMap.Action).indexOf(e.keyCode) > -1) {
                    e.preventDefault();
                }
                _this.channel_input.publish("input.keyboard", {
                    source: Brew.BrewInputSource.Keyboard,
                    code: e.keyCode,
                    jsevent: e
                });
            });
            div_container.addEventListener("mousedown", function (e) {
                _this.channel_input.publish("input.mouse", {
                    source: Brew.BrewInputSource.Mouse,
                    button: e.button,
                    jsevent: e
                });
            });
            div_container.addEventListener("mousemove", function (e) {
                _this.channel_input.publish("input.mouse", {
                    source: Brew.BrewInputSource.Mouse,
                    button: e.button,
                    jsevent: e
                });
            });
        };
        GameMaster.prototype.getPlayer = function () {
            return this.player;
        };
        GameMaster.prototype.getCurrentLevel = function () {
            return this.current_level;
        };
        GameMaster.prototype.setPlayer = function (new_player) {
            this.player = new_player;
        };
        GameMaster.prototype.setLevel = function (new_level) {
            this.current_level = new_level;
        };
        // postal feed handlers
        GameMaster.prototype.handleTurnEnd = function (data, envelope) {
            var mob = data.actor;
            console.log("END TURN: " + mob.name);
            if (mob.isType(Brew.Definitions.MonsterType.Hero)) {
                // console.log("input blocking OFF")
                this.postplayer_fn(this, mob);
            }
            this.engine.unlock();
        };
        GameMaster.prototype.handleTurnStart = function (data, envelope) {
            var mob = data.actor;
            console.log("START TURN: " + mob.name);
            this.turn_count += 1;
            this.current_turn_actor = mob;
            this.engine.lock();
            if (mob.isType(Brew.Definitions.MonsterType.Hero)) {
                // console.log("input blocking OFF")
                this.preplayer_fn(this, mob);
                this.block_input = false;
            }
            else {
                var ai_event = void 0;
                ai_event = this.ai_fn(this, mob);
                this.channel_event.publish("event.start", ai_event);
            }
        };
        GameMaster.prototype.endEvent = function (data, nextEventData) {
            this.channel_event.publish("event.end", data);
            if (nextEventData) {
                this.channel_event.publish("event.start", nextEventData);
            }
        };
        GameMaster.prototype.getLastEvent = function (includeErrors) {
            if (includeErrors === void 0) { includeErrors = false; }
            if (includeErrors) {
                return this.lastEventIncludeErrors;
            }
            else {
                return this.lastEvent;
            }
        };
        // display shortcuts
        GameMaster.prototype.displayAt = function (xy) {
            this.channel_display.publish("display.at", xy);
        };
        GameMaster.prototype.displayAll = function (display_options) {
            if (display_options === void 0) { display_options = {}; }
            this.channel_display.publish("display.all", display_options);
        };
        GameMaster.prototype.displayList = function (xy_list) {
            this.channel_display.publish("display.list", xy_list);
        };
        return GameMaster;
    }());
    Brew.GameMaster = GameMaster;
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    var Definitions;
    (function (Definitions) {
        var ItemType;
        (function (ItemType) {
            ItemType[ItemType["Widget"] = 0] = "Widget";
            ItemType[ItemType["Sprocket"] = 1] = "Sprocket";
            ItemType[ItemType["Gear"] = 2] = "Gear";
        })(ItemType = Definitions.ItemType || (Definitions.ItemType = {}));
        var item_defaults = {
            code: "?",
            color: Brew.Color.black
        };
        var item_definitions = {
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
        };
        function itemFactory(item_type, options) {
            if (options === void 0) { options = {}; }
            var i = new Brew.Item(item_type);
            // build up definition with 3 layers: default, given def, options
            // 1. default
            var def = Brew.clone(item_defaults);
            // 2. given definition
            var type_name = ItemType[item_type];
            var type_def = item_definitions[type_name];
            for (var prop in type_def) {
                // console.log("typedef", prop, type_def[prop])
                def[prop] = type_def[prop];
            }
            // 3. options
            for (var prop in options) {
                // console.log("options", prop, options[prop])
                def[prop] = options[prop];
            }
            // 4. set all properties
            for (var prop in def) {
                i[prop] = def[prop];
            }
            return i;
        }
        Definitions.itemFactory = itemFactory;
    })(Definitions = Brew.Definitions || (Brew.Definitions = {}));
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    var Definitions;
    (function (Definitions) {
        var MonsterType;
        (function (MonsterType) {
            MonsterType[MonsterType["Hero"] = 0] = "Hero";
            MonsterType[MonsterType["Killguy"] = 1] = "Killguy";
            MonsterType[MonsterType["Guardguy"] = 2] = "Guardguy";
        })(MonsterType = Definitions.MonsterType || (Definitions.MonsterType = {}));
        var monster_defaults = {
            code: '1',
            color: Brew.Color.normal,
            attack_range: 1,
            monster_status: Brew.MonsterStatus.Sleep,
            speed: 12,
            sight_range: 5,
            flags: []
        };
        var monster_definitions = {
            "Hero": {
                code: "@",
                color: Brew.Color.blue,
                attack_range: 1
            },
            "Killguy": {
                code: "k",
                color: Brew.Color.orange,
                attack_range: 1
            },
            "Guardguy": {
                code: "g",
                color: Brew.Color.orange,
                attack_range: 5,
                flags: [Brew.Flag.KeepsDistance]
            }
        };
        function monsterFactory(gm, monster_type, options) {
            if (options === void 0) { options = {}; }
            var m = new Brew.Monster(monster_type);
            // build up definition with 3 layers: default, given def, options
            // 1. default
            var def = Brew.clone(monster_defaults);
            // 2. given definition
            var type_name = MonsterType[monster_type];
            var type_def = monster_definitions[type_name];
            for (var prop in type_def) {
                // console.log("typedef", prop, type_def[prop])
                def[prop] = type_def[prop];
            }
            // 3. options
            for (var prop in options) {
                // console.log("options", prop, options[prop])
                def[prop] = options[prop];
            }
            // 4. set all properties
            for (var prop in def) {
                m[prop] = def[prop];
            }
            // act for ROT.js engine
            m.act = function () {
                gm.channel_turn.publish("turn.start", { actor: m });
                // game.monsterAct(m)
            };
            return m;
        }
        Definitions.monsterFactory = monsterFactory;
    })(Definitions = Brew.Definitions || (Brew.Definitions = {}));
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    var Definitions;
    (function (Definitions) {
        var TerrainType;
        (function (TerrainType) {
            TerrainType[TerrainType["Wall"] = 0] = "Wall";
            TerrainType[TerrainType["Floor"] = 1] = "Floor";
            TerrainType[TerrainType["Chasm"] = 2] = "Chasm";
            TerrainType[TerrainType["Grass"] = 3] = "Grass";
            TerrainType[TerrainType["Highlight"] = 4] = "Highlight";
        })(TerrainType = Definitions.TerrainType || (Definitions.TerrainType = {}));
        var terrain_defaults = {
            code: " ",
            color: Brew.Color.normal,
            blocks_walking: false,
            blocks_vision: false
        };
        var terrain_definitions = {
            "Wall": {
                code: "#",
                blocks_walking: true,
                blocks_vision: true
            },
            "Floor": {
                code: ".",
                blocks_walking: false,
                blocks_vision: false
            },
            "Chasm": {
                code: ":",
                blocks_walking: true,
                blocks_vision: false
            },
            "Grass": {
                code: "\"",
                blocks_walking: false,
                blocks_vision: false
            },
            "Highlight": {
                code: " "
            }
        };
        function terrainFactory(terrain_type, options) {
            if (options === void 0) { options = {}; }
            var t = new Brew.Terrain(terrain_type);
            // build up definition with 3 layers: default, given def, options
            // 1. default
            var def = Brew.clone(terrain_defaults);
            // 2. given definition
            var type_name = TerrainType[terrain_type];
            var type_def = terrain_definitions[type_name];
            for (var prop in type_def) {
                // console.log("typedef", prop, type_def[prop])
                def[prop] = type_def[prop];
            }
            // 3. options
            for (var prop in options) {
                // console.log("options", prop, options[prop])
                def[prop] = options[prop];
            }
            // 4. set all properties
            for (var prop in def) {
                t[prop] = def[prop];
            }
            return t;
        }
        Definitions.terrainFactory = terrainFactory;
    })(Definitions = Brew.Definitions || (Brew.Definitions = {}));
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    function randomOf(some_array) {
        if (!(some_array.length)) {
            return null;
        }
        return some_array[Math.floor(ROT.RNG.getUniform() * some_array.length)];
    }
    Brew.randomOf = randomOf;
    function randomize(some_array) {
        var result = [];
        while (some_array.length) {
            var index = some_array.indexOf(randomOf(some_array));
            result.push(some_array.splice(index, 1)[0]);
        }
        return result;
    }
    Brew.randomize = randomize;
    function remove(arr, element) {
        var index = arr.indexOf(element);
        if (index > -1) {
            arr.splice(index, 1);
        }
    }
    Brew.remove = remove;
    function mod(m, n) {
        return ((m % n) + n) % n;
    }
    Brew.mod = mod;
    function clone(obj) {
        // https://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
        var copy;
        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj)
            return obj;
        // handle coords
        if (obj instanceof Brew.Coordinate) {
            return obj.clone();
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
                if (obj.hasOwnProperty(attr))
                    copy[attr] = clone(obj[attr]);
            }
            return copy;
        }
        throw new Error("Unable to copy obj! Its type isn't supported.");
    }
    Brew.clone = clone;
})(Brew || (Brew = {}));
(function (Brew) {
    var Utils;
    (function (Utils) {
        function getRandomInt(a, b) {
            // return random integer [A, B]
            return Math.floor(ROT.RNG.getUniform() * (b - a + 1)) + a;
        }
        Utils.getRandomInt = getRandomInt;
        var DiffOrUnion;
        (function (DiffOrUnion) {
            DiffOrUnion[DiffOrUnion["Diff"] = 0] = "Diff";
            DiffOrUnion[DiffOrUnion["Union"] = 1] = "Union";
        })(DiffOrUnion || (DiffOrUnion = {}));
        function runDiffAndUnion(which, list_a, list_b) {
            var key_fn = function (value, index, array) { return Brew.xyToKey(value); };
            var keys_a = list_a.map(key_fn);
            var keys_b = list_b.map(key_fn);
            var keys_diff = [];
            var keys_union = [];
            keys_a.forEach(function (value, index, array) {
                if (keys_b.indexOf(value) > -1) {
                    keys_union.push(value);
                }
                else {
                    keys_diff.push(value);
                }
            });
            // console.log(`{0} new keys`, keys_diff.length)
            keys_b.forEach(function (value, index, array) {
                if (keys_union.indexOf(value) > -1) {
                    // skip
                    ;
                }
                else {
                    keys_diff.push(value);
                }
            });
            // console.log(`{0} new keys`, keys_diff.length)
            if (which == DiffOrUnion.Diff) {
                var xy_diff = keys_diff.map(function (value, index, array) {
                    return Brew.keyToXY(value);
                });
                return xy_diff;
            }
            else {
                var xy_union = keys_union.map(function (value, index, array) {
                    return Brew.keyToXY(value);
                });
                return xy_union;
            }
        }
        function diffOfCoordinateArrays(list_a, list_b) {
            // return elements of A not in B and B not in A
            return runDiffAndUnion(DiffOrUnion.Diff, list_a, list_b);
        }
        Utils.diffOfCoordinateArrays = diffOfCoordinateArrays;
        function unionOfCoordinateArrays(list_a, list_b) {
            // return elements of A + B
            return runDiffAndUnion(DiffOrUnion.Union, list_a, list_b);
        }
        Utils.unionOfCoordinateArrays = unionOfCoordinateArrays;
        function getDirectionFromKeycode(keycode) {
            var direction_xy;
            if (Brew.KeyMap.MoveUp.indexOf(keycode) > -1) {
                direction_xy = Brew.Directions.UP;
            }
            else if (Brew.KeyMap.MoveDown.indexOf(keycode) > -1) {
                direction_xy = Brew.Directions.DOWN;
            }
            else if (Brew.KeyMap.MoveRight.indexOf(keycode) > -1) {
                direction_xy = Brew.Directions.RIGHT;
            }
            else if (Brew.KeyMap.MoveLeft.indexOf(keycode) > -1) {
                direction_xy = Brew.Directions.LEFT;
            }
            else {
                return null;
            }
            return direction_xy;
        }
        Utils.getDirectionFromKeycode = getDirectionFromKeycode;
        function dist2d(from_xy, to_xy) {
            var xdiff = (from_xy.x - to_xy.x);
            var ydiff = (from_xy.y - to_xy.y);
            return Math.sqrt(xdiff * xdiff + ydiff * ydiff);
        }
        Utils.dist2d = dist2d;
        function getLineBetweenPoints(start_xy, end_xy) {
            // uses bresenham's line algorithm
            if ((!(start_xy)) || (!(end_xy))) {
                console.error("invalid coords passed to getLineBetweenPoints");
            }
            // Bresenham's line algorithm
            var x0 = start_xy.x;
            var y0 = start_xy.y;
            var x1 = end_xy.x;
            var y1 = end_xy.y;
            var dy = y1 - y0;
            var dx = x1 - x0;
            var t = 0.5;
            var points_lst = [new Brew.Coordinate(x0, y0)];
            var m;
            if (start_xy.compare(end_xy)) {
                return points_lst;
            }
            if (Math.abs(dx) > Math.abs(dy)) {
                m = dy / (1.0 * dx);
                t += y0;
                if (dx < 0) {
                    dx = -1;
                }
                else {
                    dx = 1;
                }
                m *= dx;
                while (x0 != x1) {
                    x0 += dx;
                    t += m;
                    // points_lst.push({x: x0, y: Math.floor(t)}) # Coordinates(x0, int(t)))
                    points_lst.push(new Brew.Coordinate(x0, Math.floor(t)));
                }
            }
            else {
                m = dx / (1.0 * dy);
                t += x0;
                // dy = if (dy < 0) then -1 else 1
                if (dy < 0) {
                    dy = -1;
                }
                else {
                    dy = 1;
                }
                m *= dy;
                while (y0 != y1) {
                    y0 += dy;
                    t += m;
                    // points_lst.push({x: Math.floor(t), y: y0}) # Coordinates(int(t), y0))
                    points_lst.push(new Brew.Coordinate(Math.floor(t), y0));
                }
            }
            return points_lst;
        }
        Utils.getLineBetweenPoints = getLineBetweenPoints;
    })(Utils = Brew.Utils || (Brew.Utils = {}));
})(Brew || (Brew = {}));
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
var Brew;
(function (Brew) {
    var Definitions;
    (function (Definitions) {
        var AboveType;
        (function (AboveType) {
            AboveType[AboveType["Smoke"] = 1] = "Smoke";
            AboveType[AboveType["Projectile"] = 2] = "Projectile";
            AboveType[AboveType["Flash"] = 3] = "Flash";
        })(AboveType = Definitions.AboveType || (Definitions.AboveType = {}));
        var above_defaults = {
            code: "?",
            color: Brew.Color.black
        };
        var above_definitions = {
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
        };
        function aboveFactory(above_type, options) {
            if (options === void 0) { options = {}; }
            var a = new Brew.Above(above_type);
            // build up definition with 3 layers: default, given def, options
            // 1. default
            var def = Brew.clone(above_defaults);
            // 2. given definition
            var type_name = AboveType[above_type];
            var type_def = above_definitions[type_name];
            for (var prop in type_def) {
                // console.log("typedef", prop, type_def[prop])
                def[prop] = type_def[prop];
            }
            // 3. options
            for (var prop in options) {
                // console.log("options", prop, options[prop])
                def[prop] = options[prop];
            }
            // 4. set all properties
            for (var prop in def) {
                a[prop] = def[prop];
            }
            return a;
        }
        Definitions.aboveFactory = aboveFactory;
    })(Definitions = Brew.Definitions || (Brew.Definitions = {}));
})(Brew || (Brew = {}));
var Brew;
(function (Brew) {
    var Debug;
    (function (Debug) {
        var Vision;
        (function (Vision) {
            Vision[Vision["Normal"] = 0] = "Normal";
            Vision[Vision["ShowMobs"] = 1] = "ShowMobs";
            Vision[Vision["ShowAll"] = 2] = "ShowAll";
        })(Vision = Debug.Vision || (Debug.Vision = {}));
        Debug.debug_vision = Vision.Normal;
        Debug.debug_pathmap = null;
        var debug_pathmap_id = 0;
        function toggleFOV(gm) {
            var i = Debug.debug_vision;
            i = (i + 1) % 3;
            var dv = Vision[i];
            Debug.debug_vision = Vision[dv];
            var updatefov = Brew.Intel.updateFov(gm, gm.getPlayer());
            console.log("debug view:", dv);
            gm.displayAll();
        }
        Debug.toggleFOV = toggleFOV;
        function togglePathmap(gm, pm) {
            debug_pathmap_id = (debug_pathmap_id + 1) % 3;
            if (debug_pathmap_id == 0) {
                Debug.debug_pathmap = null;
            }
            else if (debug_pathmap_id == 1) {
                Debug.debug_pathmap = gm.pathmap_to_player;
            }
            else if (debug_pathmap_id == 2) {
                var to_map = Brew.Path.createGenericMapToPlayer(gm, gm.getCurrentLevel());
                Debug.debug_pathmap = gm.pathmap_from_player;
            }
            gm.displayAll();
        }
        Debug.togglePathmap = togglePathmap;
    })(Debug = Brew.Debug || (Brew.Debug = {}));
})(Brew || (Brew = {}));
