import { Helper } from "./helper";

export class Progress {
  private progress: number;
  public step: number = 0;
  private ini: Date = new Date();
  private lastCheck: number = 0;
  constructor(private context:string, private total: number, autoStart = false, stepDiv = 10) {
    this.total = total;
    this.step = this.total / stepDiv;
    this.progress = 0;
    if (autoStart) this.start();
  }

  start() {
    this.ini = new Date();
    this.lastCheck = 0;
    console.log(`[${this.context}] start ${this.total}`, this.ini);
  }

  stop() {
    const end = new Date();
    console.log(`[${this.context}] duration ${Helper.TruncDecimals(end.getTime() / 1000 - this.ini.getTime() / 1000, 3)}s ${end}`);
  }

  check() {
    this.progress++;
    if (this.progress % this.step === 0) {
      const partial = new Date();
      if (this.ini !== null) {
      const check = Helper.TruncDecimals(partial.getTime() / 1000 - this.ini.getTime() / 1000, 3);
      console.log(`[${this.context}] ${Math.round((this.progress * 100) / this.total)}% partial-duration: ${Helper.TruncDecimals(check - this.lastCheck, 3)}s ${check}s`);
      this.lastCheck = check;
      }
    }
  }
}
