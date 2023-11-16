import * as d3 from "d3";
import * as d3V from 'd3-geo-voronoi';
import { GeoJson, GeoJsonFeature, GeoJsonPolygon } from "../models/geojson";
import WorldBiome from "../models/world-biome";
import Progress from "./progress";
import PseudoRandom from "./pseudo-random";

class Helper {
  public static TruncDecimals(num: number, precision = 5): number {
    return Math.trunc(Math.pow(10, precision) * num) / Math.pow(10, precision);
  }

  public static ToDegrees(angle: number): number {
    return angle * (180 / Math.PI);
  }
  public static ToRadians(angle: number): number {
    return angle * (Math.PI / 180);
  }

  public static RotateLeftPolygon(polygon: number[][]): number[][] {
    const ret: number[][] = [...polygon];
    ret.shift();
    ret.push(ret[0]);
    return ret;
  }

  public static RotateRightPolygon(polygon: number[][]): number[][] {
    const ret: number[][] = [...polygon];
    ret.pop(); // remove duplicated
    const last = ret.pop();
    if (last !== undefined)
      ret.unshift(last);
    return ret;
  }

  public static Elevation(distanceToCenter: number, widthFactor: number): number {
    const amplitude = 0.5;
    const elevationValue = amplitude * Math.exp(-((distanceToCenter ** 2) / (2 * widthFactor ** 2)));

    return elevationValue;
  }

  public static Distance(pointA: number[], pointB: number[]): number {
    const cathetiA = pointA[0] - pointB[0];
    const cathetiB = pointA[1] - pointB[1];
    const cathetiC = pointA.length > 2 && pointB.length > 2 ? pointA[1] - pointB[1] : 0;
    return Math.trunc(Math.sqrt(cathetiA ** 2 + cathetiB ** 2 + cathetiC ** 2));
  }

  public static GetBiome(topology: number): WorldBiome {
    if (topology < 0.35) {
      return WorldBiome.deepWater;
    } else if (topology < 0.50) {
      return WorldBiome.swallowWater;
    } else if (topology === 0.50) {
      return WorldBiome.shoreline;
    } else if (topology < 0.53) {
      return WorldBiome.beach;
    } else if (topology < 0.56) {
      return WorldBiome.sandy;
    } else if (topology < 0.62) {
      return WorldBiome.grass;
    } else if (topology < 0.70) {
      return WorldBiome.woods;
    } else if (topology < 0.75) {
      return WorldBiome.forest;
    } else if (topology < 0.80) {
      return WorldBiome.mountain;
    } else if (topology < 0.90) {
      return WorldBiome.snow;
    }
    return WorldBiome.grass;
  }

  public static ProcessNeighbours(cells: GeoJson, biomesGrouped: { [id: string]: GeoJsonFeature[]; }, borderCells: { [id: string]: GeoJsonFeature[]; }, num_process = 5, alias = 'neighbour', ini_exclude = ['border']) {
    const exclude = ini_exclude;
    for (let c = 1; c <= num_process; c++) {
      borderCells[`${alias}${c}`] = Helper.ProcessNeighbour(alias, c, cells.features, biomesGrouped, <GeoJsonFeature[]>borderCells[exclude[exclude.length - 1]], exclude, num_process, 1 / num_process);
      exclude.push(`${alias}${c}`);
    }
  }

  private static ProcessNeighbour(alias: string, alias_idx: number, cells: GeoJsonFeature[], biomesGrouped: { [id: string]: GeoJsonFeature[]; }, border_cells: GeoJsonFeature[], exclude_alias: string[], total: number, percente: number): GeoJsonFeature[] {
    let progress = new Progress(`processNeighbour ${alias} ${alias_idx}`, border_cells.length);
    const ret: GeoJsonFeature[] = [];
    progress.start();
    border_cells.forEach((feature) => {
      const idx = <number>feature.properties['idx'];
      const plateIdx = <number>feature.properties['plate'];
      const neighboursIdxs = <number[]>feature.properties['neighbours'];
      neighboursIdxs.forEach((neighbourIdx) => {
        const neighbour = cells[neighbourIdx];
        const neighbour_plateIdx = <number>neighbour.properties['plate'];
        if (idx !== <number>neighbour.properties['idx']) {
          if (!(exclude_alias.includes(<string>neighbour.properties['cssclass']))) {
            if (plateIdx === neighbour_plateIdx) {
              const ref_elevation = <number>feature.properties['elevation'];
              neighbour.properties['elevation'] = ((<number>neighbour.properties['elevation']) * (alias_idx * percente)) + (ref_elevation * ((total - alias_idx) * percente));

              const old_biome = neighbour.properties['biome'];
              const old_pos = biomesGrouped[old_biome].findIndex((feature) => (<number>feature.properties['idx']) === neighbourIdx);
              biomesGrouped[old_biome].splice(old_pos, 1);
              const new_biome = WorldBiome[Helper.GetBiome(<number>neighbour.properties['elevation'])];
              if (biomesGrouped[new_biome] === undefined) biomesGrouped[new_biome] = [];
              biomesGrouped[new_biome].push(neighbour);

              neighbour.properties['biome'] = new_biome;
              neighbour.properties[alias] = alias_idx;
              neighbour.properties['cssclass'] = alias + alias_idx;
              ret.push(neighbour);
            }
          }
        }
      });
      progress.check(`idx:${idx} `);
    });
    progress.stop();
    return ret;
  }

  public static GetPoints(siteSize: number = 18, pseudo: PseudoRandom): number[][] {
    const points: number[][] = [];
    d3.range(0, siteSize ?? 18).forEach((_: number) => {
      points.push([
        360 * pseudo.random - 180,
        180 * pseudo.random - 90
      ]);
    });
    return points;
  }

  public static GetVoronoi(points: number[][]) {
    const voronoi: GeoJson = d3V.geoVoronoi()
      .x((p: number[]) => +p[0])
      .y((p: number[]) => +p[1])
      (points).polygons();
    return voronoi;
  }

  private static canMergeGeoJsonFeature(g1: GeoJsonFeature, g2: GeoJsonFeature): boolean {
    const g1Coordinates = (g1.geometry.coordinates as number[][][])[0];
    const g2Coordinates = (g2.geometry.coordinates as number[][][])[0];

    return this.canMergePolygons(g1Coordinates, g2Coordinates).found;
  }

  private static mergeGeoJsonFeature(g1: GeoJsonFeature, g2: GeoJsonFeature, newProps: { [id: string]: any; } = {}): GeoJsonFeature {
    const g1Coordinates = (g1.geometry.coordinates as number[][][])[0];
    const g2Coordinates = (g2.geometry.coordinates as number[][][])[0];
    const mergedCoordinates = this.mergePolygons(g1Coordinates, g2Coordinates);
    const newGeometry: GeoJsonPolygon = new GeoJsonPolygon([mergedCoordinates]);
    return new GeoJsonFeature(newGeometry, newProps);
  }

  private static canMergePolygons(probe_coordinates: number[][], neighbour_coordinates: number[][]): { idxI: number, idxC: number, found: boolean } {
    let found = false;
    let idxI = -1;
    let idxC = -1;

    for (let i = 0; i < probe_coordinates.length; i++) {
      for (let c = 0; c < neighbour_coordinates.length; c++) {
        if (probe_coordinates[i][0] === neighbour_coordinates[c][0] && probe_coordinates[i][1] === neighbour_coordinates[c][1]) {
          idxI = i;
          idxC = c;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    console.log(`found: ${found}`)
    return { idxI: idxI, idxC: idxC, found: found };
  }

  private static processCells(cells: GeoJson): GeoJson {
    const cells_copy = [...cells.features];
    let circutBreak = cells_copy.length;
    //while (cells_copy.length > 0 || circutBreak > 0) {
    const probe = cells_copy[5415];
    if (probe !== undefined) //break;
    {
      const neighboursIdxs = <number[]>probe?.properties['neighbours'];
      const neighbours = cells_copy.filter((c) => neighboursIdxs.includes(c.properties['idx']) && c.properties['biome'] === probe.properties['biome']);

      const probe_coordinates = <number[][]>probe.geometry.coordinates[0];
      const neighbour_coordinates = <number[][]>neighbours[0].geometry.coordinates[0];

      const mergedCoordinates: number[][] = this.mergePolygons(probe_coordinates, neighbour_coordinates);

      console.log(`merge`, probe_coordinates, neighbour_coordinates, mergedCoordinates);

      //   circutBreak--;
    }

    return new GeoJson([]);
  }

  private static mergePolygons(probe_coordinates: number[][], neighbour_coordinates: number[][]): number[][] {
    let progress = new Progress(`mergePolygons`, probe_coordinates.length * neighbour_coordinates.length, true);
    const ret: number[][] = [];

    const mergeInfo = this.canMergePolygons(probe_coordinates, neighbour_coordinates);

    let nextIdxI = mergeInfo.idxI + 1;
    if (nextIdxI === probe_coordinates.length) {
      nextIdxI = 1;
    }
    let nextIdxC = mergeInfo.idxC - 1;
    if (nextIdxC < 0) {
      nextIdxC = neighbour_coordinates.length - 2;
    }

    console.log(probe_coordinates, neighbour_coordinates)

    if (probe_coordinates[nextIdxI][0] === neighbour_coordinates[nextIdxC][0] && probe_coordinates[nextIdxI][1] === neighbour_coordinates[nextIdxC][1]) {

      let nextnextIdxI = nextIdxI + 1;
      if (nextnextIdxI === probe_coordinates.length) {
        nextnextIdxI = 1;
      }
      let nextnextIdxC = nextIdxC - 1;
      if (nextnextIdxC < 0) {
        nextnextIdxC = neighbour_coordinates.length - 2;
      }

      if (probe_coordinates[nextnextIdxI][0] === neighbour_coordinates[nextnextIdxC][0] && probe_coordinates[nextnextIdxI][1] === neighbour_coordinates[nextnextIdxC][1]) {

        let nextnextnextIdxI = nextnextIdxI + 1;
        if (nextnextnextIdxI === probe_coordinates.length) {
          nextnextnextIdxI = 1;
        }
        let nextnextnextIdxC = nextnextIdxC - 1;
        if (nextnextnextIdxC < 0) {
          nextnextnextIdxC = neighbour_coordinates.length - 2;
        }

        if (probe_coordinates[nextnextnextIdxI][0] === neighbour_coordinates[nextnextnextIdxC][0] && probe_coordinates[nextnextnextIdxI][1] === neighbour_coordinates[nextnextnextIdxC][1]) {
          // console.log(nextnextnextIdxI, nextnextnextIdxC)
          // console.log(probe_coordinates[idxI],neighbour_coordinates[idxC],
          //             probe_coordinates[nextIdxI],neighbour_coordinates[nextIdxC],
          //             probe_coordinates[nextnextnextIdxI],neighbour_coordinates[nextnextnextIdxC]);
          console.log('nextnextnext')
        } else {
          // console.log(nextnextIdxI, nextnextIdxC)
          // console.log(probe_coordinates[idxI],neighbour_coordinates[idxC],
          //             probe_coordinates[nextIdxI],neighbour_coordinates[nextIdxC]);
          console.log('nextnext')
        }
      } else {
        let useRotated = false;
        let probe_coordinates_copy = [...probe_coordinates];

        if (mergeInfo.idxI === 0 || mergeInfo.idxI === probe_coordinates.length - 1 || nextIdxI === 0 || nextIdxI === probe_coordinates.length - 1) {
          useRotated = true;
          while (mergeInfo.idxI === 0 || mergeInfo.idxI === probe_coordinates.length - 1 || nextIdxI === 0 || nextIdxI === probe_coordinates.length - 1) {
            probe_coordinates_copy = Helper.RotateRightPolygon(probe_coordinates_copy);
            if (nextIdxI === probe_coordinates.length - 1) {
              nextIdxI = 1;
            } else {
              nextIdxI++;
            }
            if (mergeInfo.idxI === probe_coordinates.length - 1) {
              mergeInfo.idxI = 1;
            } else {
              mergeInfo.idxI++;
            }
          }
          for (let i = 0; i < mergeInfo.idxI; i++) {
            ret.push([...probe_coordinates_copy[i]]);
          }
        } else {
          for (let i = 0; i < mergeInfo.idxI; i++) {
            ret.push([...probe_coordinates[i]]);
          }
        }

        if (nextIdxC < mergeInfo.idxC) {
          let neighbour_coordinates_copy = [...neighbour_coordinates];
          while (mergeInfo.idxC > 0) {
            neighbour_coordinates_copy = Helper.RotateLeftPolygon(neighbour_coordinates_copy);
            if (nextIdxC === 0) {
              nextIdxC = neighbour_coordinates.length - 2;
              mergeInfo.idxC--;
            } else {
              nextIdxC--;
              mergeInfo.idxC--;
            }
          }
          for (let c = mergeInfo.idxC; c <= nextIdxC; c++) {
            ret.push([...neighbour_coordinates_copy[c]]);
          }
        } else {
          for (let c = mergeInfo.idxC; c <= nextIdxC; c++) {
            ret.push([...neighbour_coordinates[c]]);
          }
        }

        if (useRotated) {
          for (let i = nextIdxI + 1; i < probe_coordinates_copy.length; i++) {
            ret.push([...probe_coordinates_copy[i]]);
          }
        } else {
          for (let i = nextIdxI + 1; i < probe_coordinates.length; i++) {
            ret.push([...probe_coordinates[i]]);
          }
        }
        ret.push(ret[0]);
      }
    }
    console.log(ret)
    progress.stop();
    return ret;
  }

  private static getCoriolisIntensity(latitude: number, omega = 7.2921159e-5): number {
    const phi = (Math.PI / 180) * latitude;
    const intensidade = 2 * omega * Math.sin(phi);

    // Determina a direção do efeito Coriolis (Norte ou Sul)
    //const direcao = intensidade > 0 ? "Norte" : "Sul";
    // a força coriolis eh sempre perpendicular ao vetor velocidade do objetouh
    return intensidade;
  }

  private static getThermalIntensity(latitude: number, semanaDoAno: number, inclinacaoAxial = 23.5, diasNoAno = 365, intensidadeMaximaDoSol = 1361): number {
    // Calcula a declinação solar com base na latitude e na semana do ano.
    const declinacaoSolar = -inclinacaoAxial * Math.cos((2 * Math.PI * (semanaDoAno + 10) / diasNoAno));

    // Calcula a intensidade térmica com base na latitude e declinação solar.
    const intensidade = intensidadeMaximaDoSol * Math.sin((latitude * Math.PI) / 180) * Math.sin(declinacaoSolar);

    return intensidade;
  }

  private static getSunAngle(latitude: number, longitude: number, semanaDoAno: number, horaDoDia: number, inclinacaoAxial = 23.5, diasNoAno = 365): number {
    // Converte a latitude e a longitude de graus para radianos.
    const latitudeRadianos = (latitude * Math.PI) / 180;

    // Calcula a declinação solar com base na semana do ano.
    const declinacaoSolar = -inclinacaoAxial * Math.cos((2 * Math.PI * (semanaDoAno + 10) / diasNoAno));

    // Calcula o ângulo horário com base na hora do dia e na longitude.
    const anguloHorario = (horaDoDia - 12) * 15 + (longitude * 15);

    // Calcula o ângulo de incidência solar.
    const anguloIncidenciaSolar = Math.asin(Math.sin(latitudeRadianos) * Math.sin(declinacaoSolar) + Math.cos(latitudeRadianos) * Math.cos(declinacaoSolar) * Math.cos(anguloHorario * Math.PI / 180));

    // Converte o ângulo de radianos para graus.
    const anguloIncidenciaSolarGraus = (anguloIncidenciaSolar * 180) / Math.PI;

    return anguloIncidenciaSolarGraus;
  }

  private static getUmidityByBiome(biome: string, fator: 'evapotranspiracao' | 'evaporacao' | 'emissoes' | 'precipitacao'): number {
    const matrizEmissaoUmidade: { [id: string]: { evapotranspiracao: number, evaporacao: number, emissoes: number, precipitacao: number }; } = {
      planicie: { //Planícies: Terrenos planos e abertos, geralmente com vegetação rasteira.
        evapotranspiracao: 0.08,
        evaporacao: 0.1,
        emissoes: 0.03,
        precipitacao: -0.05,
      },
      morro: { //Montanhas/Morros: Terrenos mais elevados e acidentados.
        evapotranspiracao: 0.05,
        evaporacao: 0.08,
        emissoes: 0.02,
        precipitacao: -0.04,
      },
      selva: { //Selva/Floresta: Ambientes densamente arborizados e úmidos.
        evapotranspiracao: 0.12,
        evaporacao: 0.15,
        emissoes: 0.05,
        precipitacao: -0.2,
      },
      deserto: { //Deserto: Ambientes áridos e secos.
        evapotranspiracao: 0.03,
        evaporacao: 0.02,
        emissoes: 0.01,
        precipitacao: -0.01,
      },
      tundra: { //Tundra: Regiões frias e com vegetação esparsa.
        evapotranspiracao: 0.02,
        evaporacao: 0.03,
        emissoes: 0.01,
        precipitacao: -0.02,
      },
      urbano: { //Áreas Urbanas: Áreas construídas com edifícios e pavimentos.
        evapotranspiracao: 0.07,
        evaporacao: 0.09,
        emissoes: 0.05,
        precipitacao: -0.06,
      },
      corpoDagua: { //Corpos d'água: Rios, lagos, oceanos e outras massas de água.
        evapotranspiracao: 0.1,
        evaporacao: 0.12,
        emissoes: 0.02,
        precipitacao: -0.1,
      },
      zonaCosteira: { //Zonas costeiras: Áreas onde a terra encontra o mar.
        evapotranspiracao: 0.1,
        evaporacao: 0.12,
        emissoes: 0.03,
        precipitacao: -0.08,
      },
      agricola: { //Áreas agrícolas: Terras usadas para a agricultura.
        evapotranspiracao: 0.1,
        evaporacao: 0.1,
        emissoes: 0.04,
        precipitacao: -0.07,
      },
      polar: { //Regiões polares: Áreas extremamente frias próximas aos polos.
        evapotranspiracao: 0.02,
        evaporacao: 0.01,
        emissoes: 0.01,
        precipitacao: -0.02,
      },
      vulcanico: { //Terrenos vulcânicos: Áreas com atividade vulcânica.
        evapotranspiracao: 0.03,
        evaporacao: 0.02,
        emissoes: 0.01,
        precipitacao: -0.02,
      },
      rochoso: { //Terrenos rochosos: Regiões com solo rochoso e pouca vegetação.
        evapotranspiracao: 0.04,
        evaporacao: 0.03,
        emissoes: 0.02,
        precipitacao: -0.03,
      },
    };
    return matrizEmissaoUmidade[biome][fator];
  }

  private static calcularPressaoAtmosferica(altitude: number, temperatura: number, umidade: number, g = 9.81): number {
    return this.calcularDensidadeAr(temperatura, umidade) * g * altitude;
  }

  private static calcularDensidadeAr(temperatura: number, umidade: number, temperaturaPadrao = 273.15/*Temperatura em Kelvin (0°C)*/, densidadePadrao = 1.225 /* Densidade do ar a 0°C e 1 atm de pressão.*/): number {
    // Suponhamos que a densidade diminui 0,1% para cada 1% de umidade relativa.
    const fatorUmidade = 1 - (umidade / 100) * 0.001;
    // Calcule a densidade do ar com base na temperatura e na umidade.
    const densidadeAr = densidadePadrao * ((temperatura + temperaturaPadrao)/ temperaturaPadrao) * fatorUmidade;

    return densidadeAr;
  }
}

export default Helper;