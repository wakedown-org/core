import * as d3 from "d3";

export class GeoJson {
  constructor(
    public features: GeoJsonFeature[],
    public type: string = 'FeatureCollection') {
  }

  static Build(geometry: GeoJsonGeometry, properties: { [id: string]: any; } = {}): GeoJson {
    return new GeoJson([new GeoJsonFeature(geometry, properties)]);
  }

  static GetFeatureIdxThatContainsPoint(geojson: GeoJson, point: number[]): number {
    let retIdx = -1;
    geojson.features.forEach((feature, idx) => {
      if (GeoJsonFeature.IsInside(feature, point)) {
        retIdx = idx;
        return;
      }
    });
    return retIdx;
  }

  static GetFeatureIdxThatContainsPoints(geojson: GeoJson, points: number[][]): number[] {
    let retIdx: number[] = [];
    geojson.features.forEach((feature, idx) => {
      points.forEach((point) => {
        if (GeoJsonFeature.IsInside(feature, point)) {
          if (retIdx.findIndex(p => p === idx) === -1) retIdx.push(idx);
          return;
        }
      })
    });
    return retIdx;
  }
}

export class GeoJsonFeature {
  constructor(
    public geometry: GeoJsonGeometry,
    public properties: { [id: string]: any; } = {},
    public type: string = 'Feature') {

  }

  static IsInside(feature: GeoJsonFeature, point: number[]): boolean {
    const polygon: any = feature;
    const site: any = point;
    return d3.geoContains(polygon, site);;
  }
}

export class GeoJsonGeometry {
  constructor(
    public coordinates: number[] | number[][] | number[][][] | number[][][][],
    public type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' = 'Polygon') {

  }
}

export class GeoJsonPoint extends GeoJsonGeometry {
  constructor(public override coordinates: number[]) {
    super(coordinates, 'Point')
  }
}

export class GeoJsonMultiPoint extends GeoJsonGeometry {
  constructor(public override coordinates: number[][]) {
    super(coordinates, 'MultiPoint')
  }
}

export class GeoJsonLineString extends GeoJsonGeometry {
  constructor(public override coordinates: number[][]) {
    super(coordinates, 'LineString')
  }
}

export class GeoJsonMultiLineString extends GeoJsonGeometry {
  constructor(public override coordinates: number[][][]) {
    super(coordinates, 'MultiLineString')
  }
}

export class GeoJsonPolygon extends GeoJsonGeometry {
  constructor(public override coordinates: number[][][]) {
    super(coordinates, 'Polygon')
  }
}

export class GeoJsonMultiPolygon extends GeoJsonGeometry {
  constructor(public override coordinates: number[][][][]) {
    super(coordinates, 'MultiPolygon')
  }
}
