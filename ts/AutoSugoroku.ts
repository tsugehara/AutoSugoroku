module AutoSugoroku {
	export class Generator{ 
		width:number;
		height:number;
		maze:number[][];
		change_course_per:number;
		branche_create_per:number;
		start:Pos;
		end:Pos;
		distance:number;

		static fillStyle = {
			0: "#000",
			1: "#ff0",
			2: "#f00",
			3: "#ccc",
			4: "#0f0"
		};

		static rand(s:number, e:number):number {
			return Math.floor(Math.random() * (e - s + 1) + s);
		}

		constructor(width:number, height:number, change_per?:number, branche_per?:number) {
			this.width = width;
			this.height = height;

			this.maze = [];
			for (var x=0; x<this.width; x++) {
				this.maze[x] = [];
				for (var y=0; y<this.height; y++)
					this.maze[x][y] = 0;
			}

			if (change_per === undefined)
				this.change_course_per = 18;
			else 
				this.change_course_per = change_per;

			if (branche_per === undefined)
				this.branche_create_per = 2;
			else
				this.branche_create_per = branche_per;

			this.start = null;
			this.end = null;
			this.distance = -1;
		}

		genCell() {
		}

		mergeMoveInfo(moveInfo:bool[][]):number[][] {
			var ret:number[][] = new number[][];
			for (var x=0; x<this.width; x++) {
				ret[x] = new number[];
				for (var y=0; y<this.height; y++) {
					ret[x][y] = moveInfo[x][y] ? 0 : this.maze[x][y];
				}
			}
			return ret;
		}

		getCell(maze:number[][], x:number, y:number) {
			if (x >= maze.length || x < 0 || y >= maze.length || y < 0)
				return 0;
			return maze[x][y];
		}

		calcAllPaths(maze:number[][], end:Offset, x:number, y:number) {
			var p = new PathManager[];
			var i = 0;
			p.push(new PathManager(x, y));

			while(i < p.length) {
				var last = p[i].last();
				x = last.x;
				y = last.y;
				var ret = this.getDirections(maze, end, x, y, p[i]);
				if (! ret) {
					i++;
				} else if (ret.length == 1) {
					p[i].add(ret[0]);
				} else {
					for (var j=1; j<ret.length; j++) {
						var newPath = new PathManager();
						p[i].copyTo(newPath);
						newPath.add(ret[j]);
						p.push(newPath);
					}
					p[i].add(ret[0]);
				}
			}
			return p;
		}

		getDirections(maze:number[][], end:Offset, x:number, y:number, paths:PathManager):Offset[] {
			//ゴール到達
			if (end.x == x && end.y == y)
				return null;

			//進み
			var directions = [];
			var d = [{x:x+1, y:y},{x:x-1, y:y},{x:x, y:y+1},{x:x, y:y-1}];
			for (var i=0; i<d.length; i++) {
				if (this.getCell(maze, d[i].x, d[i].y) > 0) {
					var pathToGoal = astar.AStar.search(maze, {x:d[i].x, y:d[i].y}, end, paths.buf);
					if (pathToGoal.length > 0 || (d[i].x == end.x && d[i].y == end.y))	//0ならゴールまで到達不可の死に道
						directions.push(d[i]);
				}
			}

			//これは無いはずだけど、行き止まり
			if (directions.length == 0)
				return null;

			return directions;
		}

		isUniquePath(paths, newPath) {
			for (var i=0; i<paths.length; i++) {
				if (paths[i].length != newPath.length)
					continue;
				var different = false;
				for (var j=0; j<newPath.length; j++) {
					if (paths[i][j] != newPath[j]) {
						different = true;
						break;
					}
				}
				if (different == false)
					return false;
			}
			return true;
		}

		calcPointedMaze(maze:number[][], path:PathManager[]) {
			var ret = [];
			for (var x=0; x<maze.length; x++) {
				ret[x] = [];
				for (var y=0; y<maze[x].length; y++)
					ret[x][y] = {
						path: [],
						distance: -1
					};
			}

			for (var i=0; i<path.length; i++) {
				var jm = path[i].count();
				for (var j=0; j<jm; j++) {
					var p = path[i].get(j);
					var x = p.x, y = p.y;
					if (ret[x][y].distance == -1 || ret[x][y].distance > j) {
						//最短距離更新
						ret[x][y].distance = j;
					}
					if (j == 0)
						continue;
					var newPath = path[i].slice(0, j);
					if (this.isUniquePath(ret[x][y].path, newPath))
						ret[x][y].path.push(newPath);
				}
			}
			return ret;
		}

		getPointedMaze(maze?:number[][], start?:Pos, end?:Pos) {
			if (maze === undefined)
				maze = this.maze;
			if (start === undefined)
				start = this.start;
			if (end === undefined)
				end = this.end;

			var p = this.calcAllPaths(maze, end, start.x, start.y);
			return this.calcPointedMaze(maze, p);
		}

		getRoutes(maze:number[][], pos:Pos) {
			var x, y;
			if (maze[x][y] == 0) {

			}
		}

		genFixedPoints() {
			do {
				this.start = new Pos(Generator.rand(0, this.width-1), Generator.rand(0,this.height-1));
				this.end = new Pos(Generator.rand(0, this.width-1), Generator.rand(0,this.height-1));
			} while(Math.max(Math.abs(this.start.x-this.end.x), Math.abs(this.start.y-this.end.y)) < 1);
			this.maze[this.start.x][this.start.y] = 1;
			this.maze[this.end.x][this.end.y] = 2;
		}

		isChangeCourse() {
			return Generator.rand(1,100) <= this.change_course_per;
		}

		isConfluence(p, current_course, maze:number[][]) {
			var plus_ones = this.getEWSNPlusOne(current_course);
			for (var j=0; j<plus_ones.length; j++) {
				var p2 = p.addNew(plus_ones[j]);
				if (p2.x < 0 || p2.x >= this.width || p2.y < 0 || p2.y >= this.height)
					continue;
				if (maze[p2.x][p2.y])
					return true;
			}
			return false;
		}

		_genBranch(p:Pos, maze:number[][], main_distance:number) {
			if ((maze[p.x-1][p.y] && maze[p.x+1][p.y]) || (maze[p.x][p.y-1] && maze[p.x][p.y+1])) {
				maze[p.x][p.y] = 4;
				return maze;
			}

			var current_course;
			if (maze[p.x-1][p.y]) {
				current_course = this.getEWSNPos("east");
			} else if (maze[p.x+1][p.y]) {
				current_course = this.getEWSNPos("west");
			} else if (maze[p.x][p.y-1]) {
				current_course = this.getEWSNPos("south");
			} else if (maze[p.x][p.y+1]) {
				current_course = this.getEWSNPos("north");
			}

			var course, t_maze;
			var is_finish = false;
			var distance = 0;
			var limit_distance = Math.floor(main_distance/4 + 5);
			var try_count = 0;
			do {
				if (++try_count > 1000) {
					return maze;
				}
				t_maze = [];
				for (var x=0; x<this.width; x++) {
					t_maze[x] = [];
					for (var y=0; y<this.height; y++) {
						t_maze[x][y] = maze[x][y] ? 4 : 0;
					}
				}

				t_maze[p.x][p.y] = 3;
				p.add(current_course);
				t_maze[p.x][p.y] = 3;
				do {
					if (this.isConfluence(p, current_course, t_maze)) {
						is_finish = true;
						break;
					}

					var add = p.addNew(current_course);
					if (! this.canCreateRoute(add, t_maze, current_course) || this.isChangeCourse()) {
						var courses = this.getCourses(p, t_maze);
						if (courses.length == 0)
							break;
						current_course = courses[Generator.rand(0, courses.length-1)];
						p.add(current_course);
					} else {
						p.add(current_course);
					}

					if ((++distance) >= limit_distance) {
						return maze;
					}
					t_maze[p.x][p.y] = 3;

				} while (! is_finish);
			} while (! is_finish);

			for (var x=0; x<this.width; x++) {
				for (var y=0; y<this.height; y++) {
					if ((!maze[x][y]) && t_maze[x][y])
						maze[x][y] = 4;//t_maze[x][y];
				}
			}
			return maze;
		}

		genBranch(maze:number[][], main_distance:number) {
			var w1 = this.width - 1;
			var h1 = this.height - 1;
			var b_count = 0;
			for (var x=1; x<w1; x++) {
				for (var y=1; y<h1; y++) {
					if (! maze[x][y]) {
						if (Generator.rand(1, 100) <= this.branche_create_per) {
							if (maze[x-1][y] || maze[x+1][y]) {
								if (!maze[x][y-1] && !maze[x][y+1]) {
									maze = this._genBranch(new Pos(x, y), maze, main_distance);
									b_count++;
								}
							} else if (maze[x][y-1] || maze[x][y+1]) {
								if (!maze[x-1][y] && !maze[x+1][y]) {
									maze = this._genBranch(new Pos(x, y), maze, main_distance);
									b_count++;
								}
							}
						}
					}
				}
			}
			//alert(b_count);

			return maze;
		}

		genRoute() {
			var p, course, maze;
			var try_count = 0;
			do {
				p = new Pos(this.start.x, this.start.y);
				maze = this.cloneMaze();
				if (++try_count > 3000) {
					alert("can not create route");
					return;
				}
				var current_course = this.getNewCourse(p, maze);
				var distance = 0;
				if (! current_course) {
					alert("can not create route");
					return;
				}
				while (! p.is(this.end)) {
					var add = p.addNew(current_course);
					if (! this.canCreateRoute(add, maze, current_course) || this.isChangeCourse()) {
						var courses = this.getCourses(p, maze);
						if (courses.length == 0)
							break;
						current_course = courses[Generator.rand(0, courses.length-1)];
						p.add(current_course);
					} else {
						p.add(current_course);
					}
					if (! p.is(this.end))
						maze[p.x][p.y] = 3;
					distance++;
				}
			} while (! p.is(this.end));

			maze = this.genBranch(maze, distance);
			this.maze = maze;
			this.distance = distance;
		}

		canCreateRoute(p:Pos, maze:number[][], ewsn:any) {
			if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height)
				return false;
			if (maze[p.x][p.y] == 1 || maze[p.x][p.y] == 3)
				return false;

			var plus_ones = this.getEWSNPlusOne(ewsn);
			for (var j=0; j<plus_ones.length; j++) {
				var p2 = p.addNew(plus_ones[j]);
				if (p2.x < 0 || p2.x >= this.width || p2.y < 0 || p2.y >= this.height)
					continue;
				if (maze[p2.x][p2.y] == 1 || maze[p2.x][p2.y] == 3) {
					return false;
				}
			}

			return true;
		}

		_printRow(container:HTMLElement, info:string) {
			var div = document.createElement("div");
			div.innerHTML = info;
			container.appendChild(div);
		}

		printInfo(id:string) {
			if (!id)
				id ="sugoroku_info";
			var container = document.getElementById(id);
			container.innerHTML = "";
			this._printRow(container, "width: "+this.width);
			this._printRow(container, "height: "+this.height);
			this._printRow(container, "distance: "+this.distance);
		}

		getNewCourse(p:Pos, maze:number[][]) {
			var courses = this.getCourses(p, maze);
			if (courses.length == 0)
				return false;
			return courses[Generator.rand(0, courses.length-1)];
		}

		getCourses(base:Pos, maze:number[][]) {
			var ret = [];
			var ewsn = ["east","west","south","north"];
			for (var i=0; i<ewsn.length; i++) {
				var add = this.getEWSNPos(ewsn[i]);
				var p = base.addNew(add);
				if (! this.canCreateRoute(p, maze, ewsn[i]))
					continue;

				ret.push(add);
			}
			return ret;
		}

		getEWSNPlusOne(ewsn:any) {
			var ret = [];
			if (typeof(ewsn) != "string") {
				if (ewsn.x == 1)
					ewsn = "east";
				else if (ewsn.x == -1)
					ewsn = "west";
				else if (ewsn.y == 1)
					ewsn = "south";
				else if (ewsn.y == -1)
					ewsn = "north";
				else
					throw "hen dayo";
			}
			switch (ewsn) {
			case "east":
				ret.push(this.getEWSNPos("east"));
				ret.push(this.getEWSNPos("south"));
				ret.push(this.getEWSNPos("north"));
				return ret;
			case "west":
				ret.push(this.getEWSNPos("west"));
				ret.push(this.getEWSNPos("south"));
				ret.push(this.getEWSNPos("north"));
				return ret;
			case "south":
				ret.push(this.getEWSNPos("east"));
				ret.push(this.getEWSNPos("west"));
				ret.push(this.getEWSNPos("south"));
				return ret;
			case "north":
				ret.push(this.getEWSNPos("east"));
				ret.push(this.getEWSNPos("west"));
				ret.push(this.getEWSNPos("north"));
				return ret;
			}
			throw "hen dayo.";
		}

		getEWSNPos(ewsn:string) {
			switch (ewsn) {
			case "east":
				return new Pos(1, 0);
			case "west":
				return new Pos(-1, 0);
			case "south":
				return new Pos(0, 1);
			case "north":
				return new Pos(0, -1);
			}
			throw "hen dayo.";
		}

		cloneMaze(org_maze?:number[][]) {
			if (!org_maze)
				org_maze = this.maze;
			var maze = [];
			for (var x=0; x<this.width; x++) {
				maze[x] = [];
				for (var y=0 ;y<this.height; y++) {
					maze[x][y] = org_maze[x][y];
				}
			}
			return maze;
		}

		draw(canvas:HTMLCanvasElement) {
			var ctx = canvas.getContext("2d");
			ctx.save();
			var w = Math.floor(canvas.width / this.width);
			var h = Math.floor(canvas.height / this.height);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.strokeStyle = "#4dbdff";
			ctx.lineWidth = 0.5;
			for (var x=0; x<this.width; x++) {
				for (var y=0; y<this.height; y++) {
					ctx.beginPath();
					ctx.fillStyle = Generator.fillStyle[this.maze[x][y]];
					ctx.rect(x*w, y*h, w, h);
					ctx.fill();
					ctx.stroke();
				}
			}
			ctx.restore();
		}

		getCellOffsetByPoint(canvas:HTMLCanvasElement, x:number, y:number, maze?:number[][]):Offset {
			if (maze === undefined)
				maze = this.maze;
			var w = Math.floor(canvas.width / this.width);
			var h = Math.floor(canvas.height / this.height);
			return {
				x: Math.floor(x / w),
				y: Math.floor(y / h)
			};
		}

		drawPoint(canvas:HTMLCanvasElement, pointedMaze) {
			var ctx = canvas.getContext("2d");
			ctx.save();
			var w = Math.floor(canvas.width / this.width);
			var h = Math.floor(canvas.height / this.height);
			var w2 = w / 2;
			var h2 = h / 2;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			for (var x=0; x<this.width; x++) {
				for (var y=0; y<this.height; y++) {
					if (pointedMaze[x][y].distance == -1)
						continue;
					ctx.fillText(
						pointedMaze[x][y].distance,
						x * w + w2,
						y * h + h2,
						w
					);
				}
			}
			ctx.restore();
		}

		drawPaths(container:HTMLElement, path:Offset[][], target_x:number, target_y:number) {
			container.innerHTML = "<div>path count: "+path.length+"</div>";
			var canvas_width = this.width * 12;
			var canvas_height = this.height * 12;
			var w = Math.floor(canvas_width / this.width);
			var h = Math.floor(canvas_height / this.height);
			var w2 = w / 2;
			var h2 = h / 2;

			var bg_canvas = <HTMLCanvasElement>document.createElement("canvas");
			bg_canvas.width = canvas_width;
			bg_canvas.height = canvas_height;
			this.draw(bg_canvas);

			for (var i=0; i<path.length; i++) {
				var canvas = <HTMLCanvasElement>document.createElement("canvas");
				canvas.width = canvas_width;
				canvas.height = canvas_height;
				canvas.style.marginRight = "1ex";
				canvas.style.marginBottom = "1ex";
				var ctx = canvas.getContext("2d");
				ctx.drawImage(bg_canvas, 0, 0);
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = "#000";
				var jm = path[i].length;
				for (var j=0; j<jm; j++) {
					var x = path[i][j].x, y = path[i][j].y;
					ctx.fillText(
						""+j,
						x * w + w2,
						y * h + h2,
						w
					);
				}
				ctx.fillStyle = "#fa0";
				ctx.fillRect(
					target_x * w,
					target_y * h,
					w,
					h
				);
				container.appendChild(canvas);
			}
		}

		drawRoute(canvas:HTMLCanvasElement, path:PathManager) {
			var ctx = canvas.getContext("2d");
			ctx.save();
			var w = Math.floor(canvas.width / this.width);
			var h = Math.floor(canvas.height / this.height);
			var w2 = w / 2;
			var h2 = h / 2;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000";
			for (var i=0; i<path.buf.length; i++) {
				var x = path.buf[i].x, y = path.buf[i].y;
				ctx.fillText(
					""+i,
					x * w + w2,
					y * h + h2,
					w
				);
			}
			ctx.restore();
		}

		drawRouteOne(canvas:HTMLCanvasElement, path:PathManager, i:number) {
			var ctx = canvas.getContext("2d");
			ctx.save();
			var w = Math.floor(canvas.width / this.width);
			var h = Math.floor(canvas.height / this.height);
			var w2 = w / 2;
			var h2 = h / 2;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000";
			var x = path.buf[i].x, y = path.buf[i].y;
			ctx.fillText(
				""+i,
				x * w + w2,
				y * h + h2,
				w
			);
			ctx.restore();
		}
	}

	export class Pos {
		x:number;
		y:number;
		constructor(x:number, y:number) {
			this.x = x;
			this.y = y;
		}

		is(pos:Offset) {
			return this.x == pos.x && this.y == pos.y;
		}

		addNew(pos:Offset) {
			return new Pos(this.x + pos.x, this.y + pos.y);
		}

		add(pos:Offset) {
			this.x += pos.x;
			this.y += pos.y;
		}
	}

	export interface Offset {
		x: number;
		y: number;
	}

	export class PathManager {
		buf: Offset[];
		constructor(x?:any, y?:number) {
			this.buf = new Offset[];
			if (x !== undefined)
				this.add(x, y);
		}

		add(x:any, y?:number) {
			if (typeof x == "number")
				this.buf.push({x: x, y: y});
			else
				this.buf.push(x);

			return this;
		}

		test(x:any, y?:number) {
			var ret = new Array(this.buf.length + 1);
			for (var i=0; i<this.buf.length; i++)
				ret[i] = this.buf[i];
			if (typeof x == "number")
				ret[i] = {x: x, y: y};
			else
				ret[i] = x;
			return ret;
		}

		get(index:number) {
			return this.buf[index];
		}

		last() {
			return this.buf[this.buf.length-1];
		}

		slice(start:number, end?:number) {
			var ret = (end === undefined) ? this.buf.slice(start) : this.buf.slice(start, end);
			ret.reverse();
			return ret;
		}

		has(x:any, y?:number) {
			var pos = (typeof x == "number") ? {x: x, y: y} : x;
			for (var i=this.buf.length-1; i>=0; i--)
				if (this.buf[i].x == pos.x && this.buf[i].y == pos.y)
					return true;

			return false;
		}

		copyTo(p:PathManager, len?:number) {
			if (len === undefined)
				len = this.buf.length;
			for (var i=0; i<len; i++)
				p.add(this.buf[i]);
		}

		count() {
			return this.buf.length;
		}
	}
}