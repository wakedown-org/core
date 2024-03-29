import { BiomeColor } from "../_models/biome-color";
import { Coordinate } from "../_models/coordinate";
import { Layer } from "../_models/layer";
import { Point } from "../_models/point";
import { Vector } from "../_models/vector";
import { WorldInfo } from "../_models/world-info";
import { Converter } from "./converter";
import { Diagram, Vertex, Voronoi } from "./voronoi";

export async function *handleArray<T>(array: T[]) {
  for (let i = 0; i < array.length; i++) {
      yield array[i];
  }
}

export async function *handleLayers(layers: { [id: string]: string; }) {
  const keys = Object.keys(layers);
  for (let i = 0; i < keys.length; i++) {
      yield { name: keys[i], path: layers[keys[i]] };
  }
}

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

  public static getGaussian(d: number, w: number, a = 0.5, b = 2): number {
    let n = Math.trunc(b*w);
    if (n % 2 !== 0) n += 1;
    return a * Math.exp(-d * Math.exp(1) / w) ** n;
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
