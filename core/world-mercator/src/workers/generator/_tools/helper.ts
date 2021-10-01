import { BiomeColor } from "../_models/biome-color";
import { Coordinate } from "../_models/coordinate";
import { Point } from "../_models/point";
import { WorldInfo } from "../_models/world-info";
import { Converter } from "./converter";
import { Diagram, Vertex } from "./voronoi";

export class Helper {
  public static TruncDecimals(num: number, precision = 5): number {
    return Math.trunc(Math.pow(10, precision) * num) / Math.pow(10, precision);
  }

  public static CreatePathElement(svg: SVGElement, path: string, style: { fillOpacity?: string, stroke?: string, strokeWidth?: string } = { fillOpacity: '.5', stroke: '#000', strokeWidth: '1px' }) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    element.setAttribute('d', path);
    // element.style.stroke = style.stroke;
    // element.style.fillOpacity = style.fillOpacity;
    // element.style.strokeWidth = style.strokeWidth;
    svg.appendChild(element);
  }

  public static FindPeaksAndValleys(points: WorldInfo[]): { peaks: WorldInfo[], valleys: WorldInfo[] } {
    const ret: { peaks: WorldInfo[], valleys: WorldInfo[] } = { peaks: [], valleys: [] };

    const altPoints = points.map((p) => {
      const n = Math.max(0.0, Math.min(1.0, p.topology));
      return { coordinate: p.coordinate, info: p, value: Math.floor(n == 1.0 ? 255 : n * 256.0) }
    });

    const checkPeak: { coordinate: Coordinate, info: WorldInfo, value: number }[] = []
    const checkValley: { coordinate: Coordinate, info: WorldInfo, value: number }[] = []
    altPoints.forEach((p) => {
      if (!checkPeak.some((pe) => p.value > pe.value && this.isClose(pe.coordinate, p.coordinate))) {
        const oldPeaks = checkPeak.filter((pe) => this.isClose(pe.coordinate, p.coordinate));
        oldPeaks.forEach((pe) => this.removeItem(checkPeak, pe));
        checkPeak.push(p);
      }
      if (!checkValley.some((va) => p.value < va.value && this.isClose(va.coordinate, p.coordinate))) {
        const oldValleys = checkValley.filter((va) => this.isClose(va.coordinate, p.coordinate));
        oldValleys.forEach((va) => this.removeItem(checkValley, va));
        checkValley.push(p);
      }
    });

    ret.peaks = checkPeak.map((pe) => pe.info);
    ret.valleys = checkValley.map((va) => va.info);
    return ret;
  }

  public static isClose(a: Coordinate, b: Coordinate, margin = 42): boolean {
    return (Math.abs(a.latitude - b.latitude) < margin && Math.abs(a.longitude - b.longitude) < margin);
  }

  public static removeItem(arr: any[], value: any): any[] {
    var index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    }
    return arr;
  }

  public static levenshteinDistance(a: string, b: string): number {
    var tmp;
    if (a.length === 0) { return b.length; }
    if (b.length === 0) { return a.length; }
    if (a.length > b.length) { tmp = a; a = b; b = tmp; }

    var i, j, res, alen = a.length, blen = b.length, row = Array(alen);
    for (i = 0; i <= alen; i++) { row[i] = i; }

    for (i = 1; i <= blen; i++) {
      res = i;
      for (j = 1; j <= alen; j++) {
        tmp = row[j - 1];
        row[j - 1] = res;
        res = b[i - 1] === a[j - 1] ? tmp : Math.min(tmp + 1, Math.min(res + 1, row[j] + 1));
      }
    }
    return res;
  }

  public static BuildImage(context: CanvasRenderingContext2D, points: WorldInfo[], width: number, height: number) {
    const image = context.createImageData(width, height);
    const data = image.data;
    points.forEach((info) => {
      const color = BiomeColor.Get(info.Biome);
      const mercatorPoint = Converter.ToMercator(info.coordinate, width, height);
      const cell = Converter.ToIdxWidth(mercatorPoint, width) * 4;
      data[cell] = color[0];
      data[cell + 1] = color[1];
      data[cell + 2] = color[2];
      data[cell + 3] = color[3];
    });
    context.putImageData(image, 0, 0);
  }

  public static BuildVoronoi(ctx: CanvasRenderingContext2D, width: number, height: number, sites: Vertex[], diagram: Diagram) {
    // background
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.stroke();
    // voronoi
    //if (!diagram) { return; }
    // edges
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    var edges = diagram.edges!,
      iEdge = edges.length,
      edge, v;
    while (iEdge--) {
      edge = edges[iEdge];
      v = edge.va;
      ctx.moveTo(v!.x, v!.y);
      v = edge.vb;
      ctx.lineTo(v!.x, v!.y);
    }
    ctx.stroke();
    // edges
    ctx.beginPath();
    ctx.fillStyle = 'red';
    var vertices = diagram.vertices!,
      iVertex = vertices.length;
    while (iVertex--) {
      v = vertices[iVertex];
      ctx.rect(v.x - 1, v.y - 1, 3, 3);
    }
    ctx.fill();
    // sites
    ctx.beginPath();
    ctx.fillStyle = 'purple';
    var iSite = sites.length;
    while (iSite--) {
      v = sites[iSite];
      ctx.rect(v.x - 2 / 3, v.y - 2 / 3, 2, 2);
    }
    ctx.fill();
  }
}
