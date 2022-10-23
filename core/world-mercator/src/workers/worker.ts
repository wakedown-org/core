import { WorldBuilder } from './generator/world-builder';
import { Point } from './generator/_models/point';
import { Converter } from './generator/_tools/converter';

let seed: number;
let world: WorldBuilder;
let layers: { [id: string]: string; };
let voronoi: { [id: string]: string; };
let sites: { peaks: Point[], valleys: Point[] };

self.onmessage = async (eventData: any) => {
  if (seed === undefined)
    seed = eventData.data.seed ?? 8;

  if (world === undefined)
    world = new WorldBuilder(seed)

  if (layers === undefined)
    layers = await world.getLayers(eventData.data.width ?? 1000, eventData.data.height ?? 500);

  // if (sites === undefined) {
  //   const peaksValleys = await world.GetPeaksAndValleys(eventData.data.width ?? 1000, eventData.data.height ?? 500);
  //   voronoi = await world.RenderVoronoi(peaksValleys, eventData.data.width ?? 1000, eventData.data.height ?? 500);
  //   sites = {
  //     peaks: peaksValleys.peaks.map((pe) => Converter.ToMercator(pe.coordinate, eventData.data.width ?? 1000, eventData.data.height ?? 500)),
  //     valleys: peaksValleys.valleys.map((va) => Converter.ToMercator(va.coordinate, eventData.data.width ?? 1000, eventData.data.height ?? 500))
  //   };
  // }

  const msg = {
    layers: layers,
    voronoi: voronoi,
    sites: sites
  }

  self.postMessage(msg);
}

// private drawMercator(context: CanvasRenderingContext2D, svg: SVGElement) {

//   const width = 1000;//document.body.clientWidth - 40;
//   const height = 500;//(document.body.clientHeight - 40);

//   // this._world.GetAllMercatorPoints(width, height).then((points) => Helper.BuildImage(context, points, width, height));

//   this._world.getLayer(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath()));

//   // this._world.getLongitudeLines(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#000', strokeWidth: '.5px' }));
//   // this._world.getLatitudeLines(width, height, false).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#000', strokeWidth: '.5px' }));
//   // this._world.getEquatorLines(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#F00', strokeWidth: '1px' }));
//   // this._world.getTropicsAndCirclesLines(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(false), { fillOpacity: '.1', stroke: '#00F', strokeWidth: '1px' }));

//   // this._world.getSunShadow(width, height).then((layer) => Helper.CreatePathElement(svg, layer.AsSvgPath(), { fillOpacity: '.8', stroke: '#000', strokeWidth: '0px' }));
// }