import { WorldBuilder } from './builder';

let seed: number;
let layers: { [id: string]: string; };

self.onmessage = async (eventData: any) => {
  if (seed === undefined)
    seed = eventData.data.seed ?? 8;

  if (layers === undefined)
    layers = await new WorldBuilder(seed).getLayers(eventData.data.width ?? 1000, eventData.data.height ?? 500);

  const msg = {
    layers: layers
  }

  self.postMessage(msg);
}