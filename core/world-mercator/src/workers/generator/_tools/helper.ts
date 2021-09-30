import { BiomeColor } from "../_models/biome-color";
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
    ctx.fillStyle = 'grey';
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
    ctx.fillStyle = '#44f';
    var iSite = sites.length;
    while (iSite--) {
      v = sites[iSite];
      ctx.rect(v.x - 2 / 3, v.y - 2 / 3, 2, 2);
    }
    ctx.fill();
  }
}
