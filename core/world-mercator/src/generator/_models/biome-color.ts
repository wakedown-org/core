import { WorldBiome } from "./world-biome";

export class BiomeColor {
  static swallowWater = [0, 191, 255, 255];
  static deepWater = [65, 105, 225, 255];
  static grass = [50, 205, 50, 255];
  static woods = [34, 139, 34, 255];
  static forest = [0, 100, 0, 255];
  static sandy = [210, 180, 140, 255];
  static beach = [238, 214, 175, 255];
  static mountain = [139, 137, 137, 255];
  static snow = [255, 250, 250, 255];

  public static Get(type: WorldBiome) {
    switch (type) {
      case WorldBiome.deepWater:
        return this.deepWater;
      case WorldBiome.swallowWater:
        return this.swallowWater;
      case WorldBiome.woods:
        return this.woods;
      case WorldBiome.forest:
        return this.forest;
      case WorldBiome.sandy:
        return this.sandy;
      case WorldBiome.beach:
        return this.beach;
      case WorldBiome.mountain:
        return this.mountain;
      case WorldBiome.snow:
        return this.snow;
      default:
      case WorldBiome.grass:
        return this.grass;
    }
  }
}
