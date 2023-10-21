export class Arena<I> {
  private items = new Map<symbol, I>();

  public get size() {
    return this.items.size;
  }

  public getItem(key: symbol) {
    const item = this.items.get(key);
    if (item == null) {
      throw new Error("item not found");
    }
  }

  public getItems(keys: symbol[]) {
    return Object.fromEntries(keys.map((key) => [key, this.getItem(key)]));
  }

  public addItem(key: symbol, item: I) {
    if (this.items.has(key)) {
      throw new Error("duplicate key");
    }
    this.items.set(key, item);
  }

  public applyTransform(transform: (key: symbol, item: I) => number) {
    let total = 0;
    for (const [key, item] of this.items) {
      const result = transform(key, item);
      if (result < 0) {
        throw new Error("transform result may nog be negative");
      }
      total += result;
    }
    return total;
  }
}
