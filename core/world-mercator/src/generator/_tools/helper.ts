import { BiomeColor } from "../_models/biome-color";
import { WorldInfo } from "../_models/world-info";
import { Converter } from "./converter";

export class Helper {
  public static TruncDecimals(num: number, precision = 4): number {
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
}
