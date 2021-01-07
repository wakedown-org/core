import { Date_Min, Date_Max } from '../tools/defaults';
import { Wallet } from './wallet';
import { Transaction } from './transaction';
import { v4 as uuid } from 'uuid';

export class Account {
  getAmount(filter: (w: Wallet) => boolean = this.defaultFilter): number {
    return this.wallets
      .filter(w => filter(w))
      .map(w => w.getAmount())
        .reduce((sum, current) => sum + current);
  }

  private defaultFilter(wallet: Wallet): boolean {
    return true;
  }

  get Wallets(): Wallet[] {
    return this.wallets;
  }

  private wallets: Wallet[];
  public name: string;
  readonly id: string;

  constructor(values: { id?: string, name?: string, wallets?: Wallet[] } = {}) {
    this.id = values.id || uuid();
    this.name = values.name || '';
    this.wallets = values.wallets || [];
  }

  getWalletByName(walletName: string, init: Date = Date_Min, end: Date = Date_Max): Wallet {
    return (this.Wallets
      .filter((w) => w.name === walletName)[0] as Wallet).WalletBetweenDates(init, end);
  }

  getWalletByGuid(guid: string, init: Date = Date_Min, end: Date = Date_Max): Wallet {
    return (this.Wallets
      .filter((w) => w.id === guid)[0] as Wallet).WalletBetweenDates(init, end);
  }

  public get Tags(): string[] {
    const tags: string[] = [];
    this.Wallets.forEach((w: Wallet) => w.Transactions.forEach((t: Transaction) => t.Tags.forEach(g => tags.indexOf(g) === -1 ? tags.push(g) : {})));
    return tags;
  }
}