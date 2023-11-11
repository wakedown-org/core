class Progress {
  private progress: number;
  public step: number = 0;
  private ini: Date = new Date();
  private lastCheck: number = 0;
  constructor(private context: string, private total: number, autoStart = false, stepDiv = 20) {
    this.total = total;
    this.step = this.total / stepDiv;
    this.progress = 0;
    if (autoStart) this.start();
  }

  start(newTotal = -1, newContext = '', newStepDiv = 20) {
    this.lastCheck = 0;
    this.progress = 0;
    if (newTotal !== -1) this.total = newTotal;
    this.step = this.total / newStepDiv;
    if (newContext !== '') this.context = newContext;

    this.ini = new Date();

    console.log(`[${this.context}] start ${this.total}`, this.ini);
  }

  stop() {
    const end = new Date();
    const check = Progress.TruncDecimals(end.getTime() / 1000 - this.ini.getTime() / 1000, 3);
    console.log(`[${this.context}] last: ${Progress.TruncDecimals(check - this.lastCheck, 3)}s duration: ${check}s ${end}`);
  }

  check(msg: string = '') {
    this.progress++;
    if (this.progress % this.step === 0) {
      const partial = new Date();
      if (this.ini !== null) {
        const check = Progress.TruncDecimals(partial.getTime() / 1000 - this.ini.getTime() / 1000, 3);
        console.log(`[${this.context}] ${Math.round((this.progress * 100) / this.total)}% check: ${Progress.TruncDecimals(check - this.lastCheck, 3)}s ${check}s {${msg}}`);
        this.lastCheck = check;
      }
    }
  }

  private static TruncDecimals(num: number, precision = 5): number {
    return Math.trunc(Math.pow(10, precision) * num) / Math.pow(10, precision);
  }
}

export default Progress;