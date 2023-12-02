export class PubSub {
  subscribers: Record<string, Function[]>;
  constructor() {
    this.subscribers = {};
  }

  subscribe(event: string, callback: Function) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    const index = this.subscribers[event].length - 1;

    return () => {
      this.subscribers[event].splice(index, 1);
    };
  }

  publish(event: string, data: any) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach((callback) => {
        callback(data);
      });
    }
  }
}

export default class State {
  pubSub: PubSub;
  constructor() {
    this.pubSub = new PubSub();
  }

  subscribe(event: string, callback: Function) {
    return this.pubSub.subscribe(event, callback);
  }
}
