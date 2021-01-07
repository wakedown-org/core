import { Date_Min, Date_Max } from '../tools/defaults';
import { Transaction } from './transaction';
import { TransactionType } from './transaction-type.enum';
import { v4 as uuid } from 'uuid';

export class Wallet {
  getAmount(filter: (t: Transaction) => boolean = this.defaultFilter): number {
    return this.transactions
      .filter(f => filter(f))
      .map(t => t.TransactionType == TransactionType.Credit 
        ? t.amount : -1 * t.amount)
        .reduce((sum, current) => sum + current) || 0;
  }

  get Transactions(): Transaction[] {
    return this.transactions;
  }

  private defaultFilter(t: Transaction): boolean
  {
    return true;
  }

  protected transactions: Transaction[];
  public name: string;
  readonly id: string;

  constructor(values: { id?: string, name?: string, transactions?: Transaction[] } = {}) {
    this.id = values.id || uuid();
    this.name = values.name || '';
    this.transactions = values.transactions || [];
  }

  public WalletBetweenDates(init: Date, end: Date): Wallet {
    if (init !== Date_Min)
      if (end !== Date_Max)
        return new Wallet({
          id: this.id, 
          name: `${this.name}|${init}-${end}`, 
          transactions: this.Transactions.filter((t) => {
              return t.TransactionDate >= init && t.TransactionDate <= end;
            })
          });
      else
        return new Wallet({
          id: this.id, 
          name: `${this.name}|${init}-`, 
          transactions: this.Transactions.filter((t) => {
              return t.TransactionDate >= init;
            })
          });
    else
      if (end !== Date_Max)
        return new Wallet({
          id: this.id, 
          name: `${this.name}|-${end}`, 
          transactions: this.Transactions.filter((t) => {
              return t.TransactionDate <= end;
            })
          });
      else
        return this;
  }

  public get Tags(): string[] {
    const tags: string[] = [];
    this.Transactions.forEach((t: Transaction) => t.Tags.forEach(g => tags.indexOf(g) === -1 ? tags.push(g) : {}));
    return tags;
  }
}