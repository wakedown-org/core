import { BiomeColor } from "./_models/biome-color";
import { Coordinate } from "./_models/coordinate";
import { Layer } from "./_models/layer";
import { Point } from "./_models/point";
import { SkyPoint } from "./_models/sky-point";
import { Vector } from "./_models/vector";
import { WorldBiome } from "./_models/world-biome";
import { WorldInfo } from "./_models/world-info";
import { Converter } from "./_tools/converter";
import { Helper } from "./_tools/helper";
import { Perlin } from "./_tools/perlin.noise";
import { Progress } from "./_tools/progress";
import { Cell, Vertex, Voronoi } from './_tools/voronoi';
import { PseudoRandomMachine } from './_tools/pseudo-random-machine';

export class WorldBuilder {
  private noise: { raw: number[], topology: number[], trees: number[], ores: number[] } = { raw: [], topology: [], trees: [], ores: [] };
  constructor(public seed = 8, useDefault = true, public tiltInDegree = 23.43, public oceanLevel = 0.5, public rotationSpeedInHours = 24, public numLatitudes = 12, public radius = 5000, public startDate = new Date()) {
    this.prepareSeed(this.seed);
    this.noise.raw = useDefault ? Perlin.DefaultP : Perlin.RandomP;
    this.noise.topology = this.generateNoise(this.noise.raw, this.seed);
    this.noise.trees = this.generateNoise(this.generateNewNoise(), this.seed);
    this.noise.ores = this.generateNoise(this.generateNewNoise(2), this.seed);
  }

  private crostaVar: { min: number, max: number } = { min: this.radius / 1000, max: this.radius / 100 };
  private topologyVar: { min: number, max: number } = { min: this.crostaVar.min / 20, max: this.crostaVar.max / 10 };

  private prepareSeed(seed: number) {
    if (seed > 0 && seed < 1) {
      seed *= 65536;
    }
    seed = Math.floor(seed);
    if (seed < 256) {
      seed |= seed << 8;
    }
  }

  private generateNoise(array: number[], seed: number) {
    const data = [];
    for (let i = 0; i < 256; i++) {
      if (i & 1) {
        data[i] = data[i + 256] = array[i] ^ (seed & 255);
      }
      else {
        data[i] = data[i + 256] = array[i] ^ ((seed >> 8) & 255);
      }
    }
    return data;
  }

  private generateNewNoise(jump: number = 1): number[] {
    const data: number[] = JSON.parse(JSON.stringify(this.noise.raw));
    const noise: number[] = [];
    while (data.length > 0) {
      if (data.length <= jump)
        noise.push(data.pop()!);
      else
        noise.push(...data.splice(jump, 1));
    }
    return noise;
  }

  public GetInformation(coordinate: Coordinate, zoom = 1, onlyTopology: boolean = false) {
    if (coordinate.radius === null) {
      coordinate.radius = zoom;
    }
    var point = Converter.ToCardian(coordinate);
    const factor = zoom;//this.radius * zoom;
    const topology = Math.trunc((Perlin.Noise(point, factor, this.noise.topology, 0.68) + 0.5) * 100) / 100;
    let trees: number = 0;
    let ores: number = 0;
    if (!onlyTopology) {
      trees = Math.trunc((Perlin.Noise(point, factor * 100, this.noise.trees, 0.68) + 0.5) * 100) / 100;
      ores = Math.trunc((Perlin.Noise(point, factor * 100, this.noise.ores, 0.68) + 0.5) * 100) / 100;
    }
    return new WorldInfo(topology, trees, ores, coordinate, point);
  }

  public GetSunPosition(coordinate: Coordinate, date: Date): SkyPoint {
    const handle = (num: number, convert2rad = false, value = 360): number => {
      num %= value;
      num += num < 0 ? value : 0;
      if (convert2rad) {
        num *= deg2rad;
      }
      return num;
    }

    const twopi = 2 * Math.PI;
    const deg2rad = Math.PI / 180;
    const jd = (date.getTime() / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5;
    const time = jd - 51545;
    const mnlong = handle(280.460 + .9856474 * time);
    const mnanon = handle(357.528 + .9856003 * time, true);
    const eclong = handle(mnlong + 1.915 * Math.sin(mnanon) + 0.020 * Math.sin(2 * mnanon), true);
    const oblqec = (23.439 - 0.00000004 * time) * deg2rad;
    const num = Math.cos(oblqec) * Math.sin(eclong);
    const den = Math.cos(eclong);
    const dec = Math.asin(Math.sin(oblqec) * Math.sin(eclong));
    const gmst = handle(6.697375 + .0657098242 * time + date.getHours(), false, 24);
    const lat = coordinate.latitude * deg2rad;

    let ra = Math.atan(num / den);
    ra += den < 0 ? Math.PI : 0;
    ra += den >= 0 && num < 0 ? twopi : 0;

    let lmst = handle(gmst + coordinate.longitude / 15, false, 24);
    lmst *= 15 * deg2rad;

    let ha = lmst - ra;
    ha += (ha < - Math.PI) ? twopi : 0;
    ha -= (ha > Math.PI) ? twopi : 0;

    let el = Math.asin(Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha));
    let az = Math.asin(-1 * Math.cos(dec) * Math.sin(ha) / Math.cos(el));

    if (0 <= Math.sin(dec) - Math.sin(el) * Math.sin(lat)) {
      if (Math.sin(az) < 0) az += twopi;
    } else {
      az = Math.PI - az;
    }

    return new SkyPoint(az / deg2rad, el / deg2rad);
  }

  public GetAllMercatorPoints(width: number, height: number): Promise<WorldInfo[]> {
    return new Promise<WorldInfo[]>((resolve) => {
      const progress = new Progress('GetAllMercatorPoints', width * height, true);
      const ret: WorldInfo[] = [];
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const info = this.GetInformation(Converter.FromMercator(new Point(x, y, 0), width, height), 1);
          ret.push(info);
        }
      }
      progress.stop();
      resolve(ret);
    });
  }

  public GetPeaksAndValleys(width: number, height: number, margin: number = 42): Promise<{ peaks: WorldInfo[], valleys: WorldInfo[] }> {
    return new Promise<{ peaks: WorldInfo[], valleys: WorldInfo[] }>((resolve) => {
      const progress = new Progress('GetPeaksAndValleys', width * height, false);
      // const randomMachine = new PseudoRandomMachine(this.seed);
      const altPoints: { coordinate: Coordinate, info: WorldInfo, value: number }[] = [];
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          // const siteRadius = randomMachine.random * margin;
          const info = this.GetInformation(Converter.FromMercator(new Point(x, y, 0), width, height), 1);
          const n = 1 - Math.max(0.0, Math.min(1.0, info.topology));
          altPoints.push({ coordinate: info.coordinate, info: info, value: Math.floor(n == 1.0 ? 255 : n * 256.0) });
        }
      }

      const checkPeak: { coordinate: Coordinate, info: WorldInfo, value: number }[] = []
      const checkValley: { coordinate: Coordinate, info: WorldInfo, value: number }[] = []
      altPoints.forEach((p) => {
        if (!checkPeak.some((pe) => p.value > pe.value && pe.coordinate.isClose(p.coordinate, margin))) {
          const oldPeaks = checkPeak.filter((pe) => pe.coordinate.isClose(p.coordinate, margin));
          oldPeaks.forEach((pe) => Helper.removeItem(checkPeak, pe));
          checkPeak.push(p);
        }
        if (!checkValley.some((va) => p.value < va.value && va.coordinate.isClose(p.coordinate, margin))) {
          const oldValleys = checkValley.filter((va) => va.coordinate.isClose(p.coordinate, margin));
          oldValleys.forEach((va) => Helper.removeItem(checkValley, va));
          checkValley.push(p);
        }
      });

      const ret: { peaks: WorldInfo[], valleys: WorldInfo[] } = { peaks: [], valleys: [] };
      ret.peaks = checkPeak.map((pe) => pe.info);
      ret.valleys = checkValley.map((va) => va.info);

      progress.stop();
      resolve(ret);
    });
  }

  public getLayer(width: number, height: number, checkPoint: (point: WorldInfo) => boolean = (info) => info.topology < this.oceanLevel): Promise<Layer> {
    const progress = new Progress('getLayer', width * height);
    return new Promise<Layer>(resolve => {
      progress.start();
      const allVectors: Vector[] = [];
      for (let x = 0; x < width - 1; x++) {
        for (let y = 0; y < height - 1; y++) {
          progress.check();
          const no = new Point(x, y, 0);
          if (checkPoint(this.GetInformation(Converter.FromMercator(no, width, height), 1))) continue;
          const ne = new Point((1 + x), y, 0);
          if (checkPoint(this.GetInformation(Converter.FromMercator(ne, width, height), 1))) continue;
          const so = new Point(x, (1 + y), 0);
          if (checkPoint(this.GetInformation(Converter.FromMercator(so, width, height), 1))) continue;
          const se = new Point((1 + x), (1 + y), 0);
          if (checkPoint(this.GetInformation(Converter.FromMercator(se, width, height), 1))) continue;
          const vectors = [new Vector(no, ne), new Vector(ne, se), new Vector(se, so), new Vector(so, no)];
          vectors.forEach((vector) => {
            Vector.AddInIfInvertNotExistsAndRemoveItFrom(allVectors, vector);
          });
        }
      }
      const layer = Layer.Transform(allVectors);
      progress.stop();
      resolve(layer);
    });
  }

  public getLayers(width: number, height: number): Promise<{ [id: string]: string; }> {
    const progress = new Progress('getLayers', width * height);
    return new Promise<{ [id: string]: string; }>(resolve => {
      progress.start();
      const allLayers: { [id: string]: Vector[]; } = {};
      for (let x = 0; x < width - 1; x++) {
        for (let y = 0; y < height - 1; y++) {
          progress.check();
          const no = new Point(x, y, 0);
          const noInfo = this.GetInformation(Converter.FromMercator(no, width, height));
          const ne = new Point((1 + x), y, 0);
          const neInfo = this.GetInformation(Converter.FromMercator(ne, width, height));
          const so = new Point(x, (1 + y), 0);
          const soInfo = this.GetInformation(Converter.FromMercator(so, width, height));
          const se = new Point((1 + x), (1 + y), 0);
          const seInfo = this.GetInformation(Converter.FromMercator(se, width, height));

          if (allLayers[WorldBiome[noInfo.Biome]] === undefined || allLayers[WorldBiome[noInfo.Biome]] === null)
            allLayers[WorldBiome[noInfo.Biome]] = [];
          if (allLayers[WorldBiome[neInfo.Biome]] === undefined || allLayers[WorldBiome[neInfo.Biome]] === null)
            allLayers[WorldBiome[neInfo.Biome]] = [];
          if (allLayers[WorldBiome[soInfo.Biome]] === undefined || allLayers[WorldBiome[soInfo.Biome]] === null)
            allLayers[WorldBiome[soInfo.Biome]] = [];
          if (allLayers[WorldBiome[seInfo.Biome]] === undefined || allLayers[WorldBiome[seInfo.Biome]] === null)
            allLayers[WorldBiome[seInfo.Biome]] = [];

          if (noInfo.Biome === neInfo.Biome && soInfo.Biome === seInfo.Biome && noInfo.Biome === seInfo.Biome) {
            [new Vector(no, ne), new Vector(ne, se), new Vector(se, so), new Vector(so, no)].forEach((vector) => Vector.AddInIfInvertNotExistsAndRemoveItFrom(allLayers[WorldBiome[noInfo.Biome]], vector));
          } else {
            [new Vector(no, ne), new Vector(ne, se), new Vector(se, so), new Vector(so, no)].forEach((vector) => Vector.AddInIfInvertNotExistsAndRemoveItFrom(allLayers[this.maxCountBiome(noInfo.Biome, neInfo.Biome, soInfo.Biome, seInfo.Biome)], vector));
          }
        }
      }
      const layers: { [id: string]: string; } = {};
      Object.keys(allLayers).forEach((layerName: string) => {
        layers[layerName] = Layer.Transform(allLayers[layerName]).AsSvgPath();
      });
      resolve(layers);
      progress.stop();
    });
  }

  private maxCountBiome(no: WorldBiome, ne: WorldBiome, so: WorldBiome, se: WorldBiome): string {
    const counter: { [id: string]: number } = {
      'swallowWater': 0,
      'deepWater': 0,
      'grass': 0,
      'woods': 0,
      'forest': 0,
      'sandy': 0,
      'beach': 0,
      'mountain': 0,
      'snow': 0,
      'shoreline': 0
    }
    counter[WorldBiome[no]]++;
    counter[WorldBiome[ne]]++;
    counter[WorldBiome[so]]++;
    counter[WorldBiome[se]]++;
    return Object.keys(counter)[Object.values(counter).indexOf(Math.max(...Object.values(counter)))];
  }

  public getSunShadow(width: number, height: number): Promise<Layer> {
    const progress = new Progress('getSunShadow', width * height);
    return new Promise<Layer>(resolve => {
      progress.start();
      const allVectors: Vector[] = [];
      for (let x = 0; x < width - 1; x++) {
        for (let y = 0; y < height - 1; y++) {
          progress.check();
          const no = new Point(x, y, 0);
          if (this.GetSunPosition(Converter.FromMercator(no, width, height), this.startDate).elevation > 0) continue;
          const ne = new Point((1 + x), y, 0);
          if (this.GetSunPosition(Converter.FromMercator(ne, width, height), this.startDate).elevation > 0) continue;
          const so = new Point(x, (1 + y), 0);
          if (this.GetSunPosition(Converter.FromMercator(so, width, height), this.startDate).elevation > 0) continue;
          const se = new Point((1 + x), (1 + y), 0);
          if (this.GetSunPosition(Converter.FromMercator(se, width, height), this.startDate).elevation > 0) continue;
          const vectors = [new Vector(no, ne), new Vector(ne, se), new Vector(se, so), new Vector(so, no)];
          vectors.forEach((vector) => {
            Vector.AddInIfInvertNotExistsAndRemoveItFrom(allVectors, vector);
          });
        }
      }
      const layer = Layer.Transform(allVectors);
      progress.stop();
      resolve(layer);
    });
  }

  public getLongitudeLines(width: number, height: number): Promise<Layer> {
    const progress = new Progress('getLongitudeLines', width * height);
    return new Promise<Layer>(resolve => {
      progress.start();
      const allLayers: Layer[] = [];
      for (let x = 0; x <= width; x += width / this.rotationSpeedInHours) {
        const layer: Vector[] = [];
        let lastPoint: Point = new Point(x, 0, 0);
        for (let y = 1; y <= height; y++) {
          const mercatorPoint = new Point(x, y, 0);
          layer.push(new Vector(lastPoint.copy(), mercatorPoint.copy()));
          lastPoint = mercatorPoint.copy();
        }
        allLayers.push(new Layer([...layer]));
      }
      const layer = new Layer([], [...allLayers]);
      progress.stop();
      resolve(layer);
    });
  }

  public getEquatorLines(width: number, height: number): Promise<Layer> {
    const progress = new Progress('getEquatorLines', width * height);
    return new Promise<Layer>(resolve => {
      progress.start();
      const vectors: Vector[] = [];
      let lastPoint: Point = new Point(0, height / 2, 0);
      for (let x = 1; x <= width; x++) {
        const mercatorPoint = new Point(x, height / 2, 0);
        vectors.push(new Vector(lastPoint.copy(), mercatorPoint.copy()));
        lastPoint = mercatorPoint.copy();
      }
      const layer = new Layer([...vectors]);
      progress.stop();
      resolve(layer);
    });
  }

  public getLatitudeLines(width: number, height: number, showEquator: boolean = true): Promise<Layer> {
    const progress = new Progress('getLatitudeLines', width * height);
    return new Promise<Layer>(resolve => {
      progress.start();
      const allLayers: Layer[] = [];
      for (let y = 0; y <= height; y += height / this.numLatitudes) {
        const layer: Vector[] = [];
        let lastPoint: Point = new Point(0, y, 0);
        for (let x = 1; x <= width; x++) {
          const mercatorPoint = new Point(x, y, 0);
          layer.push(new Vector(lastPoint.copy(), mercatorPoint.copy()));
          lastPoint = mercatorPoint.copy();
        }
        allLayers.push(new Layer([...layer]));
      }
      const layer = new Layer([], [...allLayers]);
      progress.stop();
      resolve(layer);
    });
  }

  public getTropicsAndCirclesLines(width: number, height: number): Promise<Layer> {
    const progress = new Progress('getTropicsAndCirclesLines', width * height);
    const radius = Math.round(width / (2 * Math.PI));
    return new Promise<Layer>(resolve => {
      progress.start();
      const allLayers: Layer[] = [];
      const tropicsAndCircles = [this.tiltInDegree - 90, -1 * this.tiltInDegree, this.tiltInDegree, 90 - this.tiltInDegree];
      for (let y = 0; y < tropicsAndCircles.length; y++) {
        let x = 1;
        const coordinate = new Coordinate(tropicsAndCircles[y], x, radius);
        const actualY = Converter.ToMercator(coordinate, width, height).Y;
        const layer: Vector[] = [];
        let lastPoint: Point = new Point(0, actualY, 0);
        for (; x < width; x++) {
          const mercatorPoint = new Point(x, actualY, 0);
          layer.push(new Vector(lastPoint.copy(), mercatorPoint.copy()));
          lastPoint = mercatorPoint.copy();
        }
        allLayers.push(new Layer([...layer]));
      }
      const layer = new Layer([], [...allLayers]);
      progress.stop();
      resolve(layer);
    });
  }

  public async RenderVoronoi(points: { peaks: WorldInfo[], valleys: WorldInfo[] }, width: number = 1000, height: number = 500, circular = false): Promise<{ [id: string]: string; }> {
    const sites: Vertex[] = points.peaks.map(p => Converter.ToMercator(p.coordinate, width, height)).map(p => new Vertex(p.X, p.Y));
    sites.push(...points.valleys.map(p => Converter.ToMercator(p.coordinate, width, height)).map(p => new Vertex(p.X, p.Y)));
    const copy_sites = [...sites];
    if (circular) {
      console.log('copy_sites', copy_sites.length);
      sites.push(...(copy_sites.map(s => new Vertex(s.x, (s.y - height)))));
      sites.push(...(copy_sites.map(s => new Vertex((s.x - width), s.y))));
      sites.push(...(copy_sites.map(s => new Vertex(s.x, (s.y + height)))));
      sites.push(...(copy_sites.map(s => new Vertex((s.x + width), s.y))));
      console.log('sites', sites.length);
    }
    const voronoi = new Voronoi();
    const result = voronoi.compute(sites, { xl: 0, xr: width, yt: 0, yb: height });
    let reduced_cells: Cell[] = result.cells!;
    const cells: { [id: string]: Vector[] } = {};
    if (circular) {
      console.log('cells', result.cells);
      reduced_cells = reduced_cells.filter((cell) => copy_sites.some(s => cell.site.x === s.x && cell.site.y === s.y));
      console.log('cells', reduced_cells);
    }
    reduced_cells.forEach((cell, idx) => cells[`cell_${idx}`] = cell.halfedges.map((he) => new Vector(new Point(he.edge.va!.x, he.edge.va!.y, 1), new Point(he.edge.vb!.x, he.edge.vb!.y, 1))));
    const layers: { [id: string]: string; } = {};
    Object.keys(cells).forEach((layername: string) => {
      layers[`cell_${layername}`] = Layer.Transform(cells[layername]).AsSvgPath();
    });

    return layers;
  }
}
