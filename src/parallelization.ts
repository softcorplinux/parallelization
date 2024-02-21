interface IProps {
  concurrency: number;
  tasks?: any[];
  method?: keyof PromiseConstructor;
  mapper?: <T>(task: any) => Promise<T>;
}

class Parallelization {
  private _queue: (() => Promise<void>)[] = [];
  private _tasks: (() => Promise<any>)[] = [];
  private _consumers: ((value: () => Promise<any>) => void)[] = [];
  private _method: keyof PromiseConstructor = 'all';
  private _mapper = (task: any) => Promise.resolve(task);

  constructor({ concurrency, tasks, method, mapper }: IProps) {
    for (let i = 0; i < concurrency; i++) {
      this.consumer();
    }

    if (tasks) {
      for (let task of tasks) {
        this.add(task);
      }
    }

    if (method) {
      this.setMethod(method);
    }

    if (mapper) {
      this._mapper = mapper;
    }
  }

  private clear() {
    this._queue = [];
  }

  private async consumer() {
    while (true) {
      try {
        const task: any = await this.next();
        await task();
      } catch (err) {
        throw err;
      }
    }
  }

  private async next() {
    return new Promise((resolve) => {
      if (this._tasks.length !== 0) {
        return resolve(this._tasks.shift());
      }

      this._consumers.push(resolve);
    });
  }

  public setMethod(value: keyof PromiseConstructor) {
    this._method = value;
    return this;
  }

  public add<T>(task: T) {
    this._queue.push(
      () =>
        new Promise((resolve, reject) => {
          const taskWrapper = () =>
            (typeof task === 'function' ? task() : this._mapper(task)).then(
              resolve,
              reject
            );

          if (this._consumers.length !== 0) {
            const consumer = this._consumers.shift();

            if (consumer) {
              consumer(taskWrapper);
            }
          } else {
            this._tasks.push(taskWrapper);
          }
        })
    );
    return this;
  }

  public async then(
    resolve: (value?: any) => Promise<any>,
    reject: (reason?: any) => Promise<any>
  ) {
    if (this._method in Promise) {
      const response = resolve(
        await Promise[this._method as 'all'](
          this._queue.map((task: any) => task())
        )
      );
      this.clear();
      return response;
    }
    reject(`Method "${this._method.toString()}" not found`);
  }
}

export function parallelization(props: IProps) {
  return new Parallelization(props);
}
