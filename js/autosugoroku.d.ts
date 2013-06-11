declare module AutoSugoroku {
    interface CellFactoryData {
        x: number;
        y: number;
        distanceFromStart: number;
        distanceToEnd: number;
        beginRoutes: Offset[][];
        isWall: boolean;
        seq: number;
        activeCount: number;
        activeSeq: number;
        wallCount: number;
        roadCount: number;
    }
    class Generator {
        public width: number;
        public height: number;
        public maze: number[][];
        public change_course_per: number;
        public branche_create_per: number;
        public start: Pos;
        public end: Pos;
        public distance: number;
        public cell_factory: (e: CellFactoryData) => number;
        public cell_factory_owner: any;
        public calc_route_limit: number;
        static fillStyle: any;
        static rand(s: number, e: number): number;
        constructor(width: number, height: number, change_per?: number, branche_per?: number);
        public genCell(): void;
        public getCell(maze: number[][], x: number, y: number): number;
        public calcAllPaths(maze: number[][], end: Offset, x: number, y: number, limit?: number): PathManager[];
        public getDirections(maze: number[][], end: Offset, x: number, y: number, paths: PathManager): Offset[];
        public isUniquePath(paths, newPath): boolean;
        public calcPointedMaze(maze: number[][], path: PathManager[]): any[];
        public _pathSortFunc(a: any, b: any): number;
        public getPointedMaze(limit?: number, maze?: number[][], start?: Pos, end?: Pos): any[];
        public genFixedPoints(): void;
        public isChangeCourse(): boolean;
        public isConfluence(p, current_course, maze: number[][]): boolean;
        public _genBranch(p: Pos, maze: number[][], main_distance: number): number[][];
        public genBranch(maze: number[][], main_distance: number): number[][];
        public genRoute(): void;
        public canCreateRoute(p: Pos, maze: number[][], ewsn: any): boolean;
        public _printRow(container: HTMLElement, info: string): void;
        public printInfo(id: string): void;
        public getNewCourse(p: Pos, maze: number[][]);
        public getCourses(base: Pos, maze: number[][]): any[];
        public getEWSNPlusOne(ewsn: any): any[];
        public getEWSNPos(ewsn: string): Pos;
        public cloneMaze(org_maze?: number[][]): any[];
        public draw(canvas: HTMLCanvasElement): void;
        public getCellOffsetByPoint(canvas: HTMLCanvasElement, x: number, y: number, maze?: number[][]): Offset;
        public drawPoint(canvas: HTMLCanvasElement, pointedMaze): void;
        public drawPaths(container: HTMLElement, path: Offset[][], target_x: number, target_y: number): void;
        public drawRoute(canvas: HTMLCanvasElement, path: PathManager): void;
        public drawRouteOne(canvas: HTMLCanvasElement, path: PathManager, i: number): void;
    }
    class Pos {
        public x: number;
        public y: number;
        constructor(x: number, y: number);
        public is(pos: Offset): boolean;
        public addNew(pos: Offset): Pos;
        public add(pos: Offset): void;
    }
    interface Offset {
        x: number;
        y: number;
    }
    class PathManager {
        public buf: Offset[];
        constructor(x?: any, y?: number);
        public add(x: any, y?: number): PathManager;
        public test(x: any, y?: number): any[];
        public get(index: number): Offset;
        public last(): Offset;
        public slice(start: number, end?: number): Offset[];
        public has(x: any, y?: number): boolean;
        public copyTo(p: PathManager, len?: number): void;
        public count(): number;
    }
}
