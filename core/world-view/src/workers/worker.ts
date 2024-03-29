import { Builder } from "./builder";
import { GeoJson } from "./_models/geojson";

let seed: number;
let builder: Builder;
let layers: GeoJson;

self.onmessage = async (eventData: any) => {
  if (seed === undefined)
    seed = eventData.data.seed ?? 8;

  if (builder === undefined)
    builder = new Builder(seed)

  if (layers === undefined)
    layers = await builder.render(18);

  const msg = {
    layers: layers,
    rejected: builder.rejected
  }

  self.postMessage(msg);
};