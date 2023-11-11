class Perlin {
  private static perlin(x: number, y: number, z: number, p: number[]) {
    const X = Math.floor(x) & 255,
      Y = Math.floor(y) & 255,
      Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x),
      v = this.fade(y),
      w = this.fade(z);
    const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,
      B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u,
          this.grad(p[AA], x, y, z),
          this.grad(p[BA], x - 1, y, z)),
        this.lerp(u,
          this.grad(p[AB], x, y - 1, z),
          this.grad(p[BB], x - 1, y - 1, z))),
      this.lerp(v,
        this.lerp(u,
          this.grad(p[AA + 1], x, y, z - 1),
          this.grad(p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u,
          this.grad(p[AB + 1], x, y - 1, z - 1),
          this.grad(p[BB + 1], x - 1, y - 1, z - 1))));
  }
  private static fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  private static lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  private static grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y,
      v = h < 4 ? y : h == 12 || h == 14 ? x : z;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
  };

  private static octaves(x: number, y: number, z: number, p: number[], persistence = 0.5, octaves = 6) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.perlin(x * frequency, y * frequency, z * frequency, p) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }

  public static readonly DefaultP = [151, 160, 137, 91, 90, 15,
    131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
    77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
    5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
    223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

  public static get RandomP(): number[] {
    const array = new Uint8Array(256);
    window.crypto.getRandomValues(array);
    const list: number[] = [];
    array.forEach((v) => list.push(v));
    return list;
  }

  public static Noise(point: number[], factor = 1, p: number[], persistence = 0.5, octaves = 6) {
    return this.octaves(point[0] / factor, point[1] / factor, point[2] / factor, p, persistence, octaves);
  }
}

export default Perlin;

// class Perlin4D {
//   private static perlin(x: number, y: number, z: number, t: number, p: number[]) {
//     const X = Math.floor(x) & 255,
//       Y = Math.floor(y) & 255,
//       Z = Math.floor(z) & 255,
//       T = Math.floor(t) & 255;
//     x -= Math.floor(x);
//     y -= Math.floor(y);
//     z -= Math.floor(z);
//     t -= Math.floor(t);
//     const u = this.fade(x),
//       v = this.fade(y),
//       w = this.fade(z),
//       s = this.fade(t);
//     const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z,
//       B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;

//     return this.lerp(s, 
//       this.lerp(w, 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA], x, y, z, t), 
//             this.grad(p[BA], x - 1, y, z, t)), 
//           this.lerp(u, 
//             this.grad(p[AB], x, y - 1, z, t), 
//             this.grad(p[BB], x - 1, y - 1, z, t))), 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA + 1], x, y, z - 1, t), 
//             this.grad(p[BA + 1 + T], x - 1, y, z - 1, t)), 
//           this.lerp(u, 
//             this.grad(p[AB + 1], x, y - 1, z - 1, t), 
//             this.grad(p[BB + 1], x - 1, y - 1, z - 1, t)))),
//       this.lerp(w, 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA + T], x, y, z, t), 
//             this.grad(p[BA + T], x - 1, y, z, t)), 
//           this.lerp(u, 
//             this.grad(p[AB + T], x, y - 1, z, t), 
//             this.grad(p[BB + T], x - 1, y - 1, z, t))), 
//         this.lerp(v, 
//           this.lerp(u, 
//             this.grad(p[AA + 1 + T], x, y, z - 1, t), 
//             this.grad(p[BA + 1 + T], x - 1, y, z - 1, t)), 
//           this.lerp(u, 
//             this.grad(p[AB + 1 + T], x, y - 1, z - 1, t), 
//             this.grad(p[BB + 1 + T], x - 1, y - 1, z - 1, t)))));
//   }

//   private static fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
//   private static lerp(t: number, a: number, b: number) { return a + t * (b - a); }
//   private static grad(hash: number, x: number, y: number, z: number, t: number) {
//     const h = hash & 31;
//     const u = h < 24 ? x : y,
//       v = h < 16 ? y : h < 24 ? z : t;
//     return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
//   }

//   private static octaves(x: number, y: number, z: number, t: number, p: number[], persistence = 0.5, octaves = 6) {
//     let total = 0;
//     let frequency = 1;
//     let amplitude = 1;
//     let maxValue = 0;
//     for (let i = 0; i < octaves; i++) {
//       total += this.perlin(x * frequency, y * frequency, z * frequency, t * frequency, p) * amplitude;
//       maxValue += amplitude;
//       amplitude *= persistence;
//       frequency *= 2;
//     }
//     return total / maxValue;
//   }

//   public static readonly DefaultP = [151, 160, 137, 91, 90, 15,
//     131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
//     190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
//     88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
//     77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
//     102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
//     135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
//     5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
//     223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
//     129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
//     251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
//     49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
//     138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

//   public static get RandomP(): number[] {
//     const array = new Uint8Array(256);
//     window.crypto.getRandomValues(array);
//     const list: number[] = [];
//     array.forEach((v) => list.push(v));
//     return list;
//   }

//   public static Noise(point: [number, number, number, number], factor = 1, p: number[], persistence = 0.5, octaves = 6) {
//     return this.octaves(point[0] / factor, point[1] / factor, point[2] / factor, point[3] / factor, p, persistence, octaves);
//   }
// }