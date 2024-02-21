import { describe, expect, it } from '@jest/globals';
import { parallelization } from '../parallelization';

describe('chunk', () => {
  const props = {
    concurrency: 20,
    method: 'all' as keyof PromiseConstructor,
    mapper: async (props: string) => {
      const data = await fetch(props);
      const response = await data.json();
      return response;
    },
    tasks: [
      'https://dummyjson.com/products/1?select=title,price',
      'https://dummyjson.com/products/2?select=title,price',
      'https://dummyjson.com/recipes/1?select=name,rating',
      'https://dummyjson.com/recipes/2?select=name,rating',
      'https://dummyjson.com/users/1?select=firstName,age',
      'https://dummyjson.com/users/2?select=firstName,age',
    ],
  };
  const test1 = parallelization(props);

  it('should return list of objects', async () => {
    expect(await test1).toEqual([
      { id: 1, title: 'iPhone 9', price: 549 },
      { id: 2, title: 'iPhone X', price: 899 },
      { id: 1, name: 'Classic Margherita Pizza', rating: 4.6 },
      { id: 2, name: 'Vegetarian Stir-Fry', rating: 4.7 },
      { id: 1, firstName: 'Terry', age: 50 },
      { id: 2, firstName: 'Sheldon', age: 28 },
    ]);
  });

  const test2 = parallelization({
    ...props,
    tasks: props.tasks.filter((_, k) => k < 2),
    method: 'race',
  });

  it('should return single object', async () => {
    expect(Object.keys(await test2)).toEqual(['id', 'title', 'price']);
  });
});
