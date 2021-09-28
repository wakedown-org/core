import { Coordinate } from "./_models/coordinate";
import { Layer } from "./_models/layer";
import { Point } from "./_models/point";
import { SkyPoint } from "./_models/sky-point";
import { Vector } from "./_models/vector";
import { WorldInfo } from "./_models/world-info";
import { Converter } from "./_tools/converter";
import { Perlin } from "./_tools/perlin.noise";
import { Progress } from "./_tools/progress";

export class WorldBuilder {
  private noise: { raw: number[], topology: number[], trees: number[], ores: number[] } = { raw: [], topology: [], trees: [], ores: [] };
  constructor(public seed = 8, useDefault = true, public tiltInDegree = 23.43, public oceanLevel = 0.5, public rotationSpeedInHours = 24, public numLatitudes = 12, public radius = 5000, public startDate = new Date()) {
    this.prepareSeed(seed);
    this.noise.raw = useDefault ? Perlin.DefaultP : Perlin.RandomP;
    this.noise.topology = this.generateNoise(this.noise.raw, seed);
    this.noise.trees = this.generateNoise(this.generateNewNoise(), seed);
    this.noise.ores = this.generateNoise(this.generateNewNoise(2), seed);
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
}
