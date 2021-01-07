import { Instance } from './instance';
import { Value } from './value';

import * as handlers from '../../models';

import { Guid } from './guid';

export class Storage {
  private instances: Instance[] = [];
  private values: Value[] = [];

  constructor(private _key = 'Storage') {
    this.LoadAll();
  }

  private LoadAll() {
    this.instances = this.Instances;
    this.values = this.Values;

    console.debug('[Storage] LoadAll', this.instances, this.values);
  }

  private SaveAll() {
    this.Instances = this.instances;
    this.Values = this.values;
  }

  private set Instances(value: Instance[]) {
    this.setToStorage(`[${this._key}]instances`, JSON.stringify(value));
  }
  private get Instances(): Instance[] {
    return this.getFromStorage<Instance[]>(`[${this._key}]instances`) || [];
  }

  private set Values(value: Value[]) {
    this.setToStorage(`[${this._key}]values`, JSON.stringify(value));
  }
  private get Values(): Value[] {
    return this.getFromStorage<Value[]>(`[${this._key}]values`) || [];
  }

  private getFromStorage<T>(key: string): T | null {
    const value = localStorage.getItem(key);
    if (value !== null)
      return <T>JSON.parse(value);
    else
      return null;
  }
  private setToStorage(key: string, value: any) {
    localStorage.setItem(key, value);
  }

  public Save<T>(data: new () => T, guid: string = ''): string {

    const collection: string = data.name;
    const propertiesList: string[] = Object.keys(data);

    if (guid == '') {
      guid = guid = Guid.newGuid();
      this.instances.push(<Instance>{ collection: collection, id: guid });

      propertiesList.forEach(prop => {
        this.values.push(<Value>{ instance: guid, property: prop, value: (data as any)[prop] });
      });
    } else {
      if (this.instances.filter((i: Instance) => i.id === guid)[0] == null) console.error(`guid not found: '${guid}'`);

      propertiesList.forEach(prop => {
        (<Value>this.values.filter((v: Value) => v.instance === guid && v.property === prop)[0]).value = (data as any)[prop];
      });
    }

    console.debug('[Storage] Save', this.instances, this.values);
    this.SaveAll();
    return guid;
  }

  private static getInstance<T>(context: any, name: string, ...args: any[]): T {
    const instance = Object.create(context[name].prototype);
    instance.constructor.apply(instance, args);
    return <T>instance;
  }

  public Load<T>(guid: string = ''): T {
    if (this.instances.filter((i: Instance) => i.id === guid)[0] == null) console.error(`guid not found: '${guid}'`);
    let instance = this.instances.filter((i: Instance) => i.id === guid)[0];
    const args: any = {};

    this.values.filter((v: Value) => v.instance === guid).forEach((v: Value) => {
      args[v.property] = v.value;
    });

    const obj = Storage.getInstance<T>(handlers, instance.collection, args);
    console.debug(`[Storage] Load`, guid, instance, args, obj);
    return obj;
  }

  public LoadCollection<T>(collection: string): T[] {
    if (this.instances.filter((i: Instance) => i.collection === collection).length == 0) console.error(`collection not found: '${collection}'`);

    let collectionInstances: T[] = [];

    this.instances.filter((i: Instance) => i.collection === collection).forEach((i: Instance) => collectionInstances.push(this.Load<T>(i.id)));

    return collectionInstances;
  }
}