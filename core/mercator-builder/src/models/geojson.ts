export class GeoJson {
  constructor (
    public features: GeoJsonFeature[],
    public type: string = 'FeatureCollection') {
  }

  static Build(geometry: GeoJsonGeometry, properties: { [id: string] : any; } = {}): GeoJson {
    return new GeoJson([new GeoJsonFeature(geometry, properties)]);
  }
}

export class GeoJsonFeature {
  constructor (
    public geometry: GeoJsonGeometry,
    public properties: { [id: string] : any; } = {},
    public type: string = 'Feature') {

  }
}

export class GeoJsonGeometry {
  constructor (
    public coordinates: number[] | number[][] | number[][][] | number[][][][],
    public type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' = 'Polygon') {

    }
}

export class GeoJsonPoint extends GeoJsonGeometry {
  constructor (public coordinates: number[]) {
    super(coordinates, 'Point')
  }
}

export class GeoJsonMultiPoint extends GeoJsonGeometry {
  constructor (public coordinates: number[][]) {
    super(coordinates, 'MultiPoint')
  }
}

export class GeoJsonLineString extends GeoJsonGeometry {
  constructor (public coordinates: number[][]) {
    super(coordinates, 'LineString')
  }
}

export class GeoJsonMultiLineString extends GeoJsonGeometry {
  constructor (public coordinates: number[][][]) {
    super(coordinates, 'MultiLineString')
  }
}

export class GeoJsonPolygon extends GeoJsonGeometry {
  constructor (public coordinates: number[][][]) {
    super(coordinates, 'Polygon')
  }
}

export class GeoJsonMultiPolygon extends GeoJsonGeometry {
  constructor (public coordinates: number[][][][]) {
    super(coordinates, 'MultiPolygon')
  }
}
