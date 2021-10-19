export class PseudoRandom {
  constructor (public seed: number, private _divergent = 0) { }
  public get random(): number {
    let copy = (this.seed + this._divergent++).valueOf();
    copy = ((copy + 0x7ED55D16) + (copy << 12)) & 0xFFFFFFFF;
    copy = ((copy ^ 0xC761C23C) ^ (copy >>> 19)) & 0xFFFFFFFF;
    copy = ((copy + 0x165667B1) + (copy << 5)) & 0xFFFFFFFF;
    copy = ((copy + 0xD3A2646C) ^ (copy << 9)) & 0xFFFFFFFF;
    copy = ((copy + 0xFD7046C5) + (copy << 3)) & 0xFFFFFFFF;
    copy = ((copy ^ 0xB55A4F09) ^ (copy >>> 16)) & 0xFFFFFFFF;
    return (copy & 0xFFFFFFF) / 0x10000000;
  }
}