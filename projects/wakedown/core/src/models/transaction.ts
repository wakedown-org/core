import { TransactionType } from './transaction-type.enum';
import { CurrencyFormat, DateTimeFormat, DefaultCulture } from '../tools/formats';
import * as moment from 'moment';

export class Transaction {
  readonly amount: number;
  readonly TransactionType: TransactionType;
  readonly transactionDate: Date;
  private visibleDate: Date | null = null;

  public get TransactionTypeStr() : string {
    return TransactionType[<number>this.TransactionType];
  }

  public get AmountStr() : string {
    return `${this.amount.toLocaleString(DefaultCulture, CurrencyFormat)}`;
  }

  public get TransactionDateStr() : string {
    return moment(this.TransactionDate).format(DateTimeFormat);
  }

  protected tags: string[] = [];

  constructor(values: {
      amount?: number,
      transactionType?: TransactionType,
      transactionDate?: Date,
      tags?: string[]
    } = {}) {
      this.amount = values.amount || 0;
      this.TransactionType = values.transactionType || TransactionType.Credit;
      this.transactionDate = values.transactionDate || new Date();
      this.Tags = values.tags || [];
  }

  public get Tags(): string[] {
    return this.tags;
  }

  public set Tags(tags: string[]) {
    this.tags = tags;
  }

  get TransactionDate(): Date {
    return this.visibleDate || this.transactionDate;
  }

  set TransactionDate(newDate: Date) {
    this.visibleDate = newDate;
  }
}