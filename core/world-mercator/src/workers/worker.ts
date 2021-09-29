import { WorldBuilder } from './generator/world-builder';
import { Layer } from './generator/_models/layer';

let seed: number;
let world: WorldBuilder;
let layers: { [id: string]: string; };

self.onmessage = async (eventData: any) => {
  if (seed === undefined)
    seed = eventData.data.seed ?? 8;

  if (world === undefined)
    world = new WorldBuilder(seed)

  if (layers === undefined)
    layers = await world.getLayers(eventData.data.width ?? 1000, eventData.data.height ?? 500);
  self.postMessage(layers)
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