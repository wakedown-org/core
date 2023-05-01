import { WorldBuilder } from './builder';
import { GeoJson } from "../models/geojson";

let seed: number;
let layers: GeoJson;//{ [id: string]: string; };

self.onmessage = async (eventData: any) => {
  if (seed === undefined)
    seed = eventData.data.seed ?? 8;

  if (layers === undefined)
    layers = await new WorldBuilder(seed).getLayers(200);

  const msg = {
    layers: layers
  }

  self.postMessage(msg);
}
