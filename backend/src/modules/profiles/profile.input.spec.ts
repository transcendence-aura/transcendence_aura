import 'reflect-metadata';
import { validate } from 'class-validator';
import { UpdateProfileInput } from './profile.input';

async function getHandleErrors(handle: string) {
  const input = Object.assign(new UpdateProfileInput(), { handle });
  const errors = await validate(input);
  return errors.filter((error) => error.property === 'handle');
}

describe('UpdateProfileInput handle', () => {
  it.each(['john', 'john-doe', 'john_doe', 'user-1a2b3c4d', 'a'])('accepts %s', async (handle) => {
    expect(await getHandleErrors(handle)).toHaveLength(0);
  });

  it.each(['john doe', 'a/b', 'John', 'jöhn', 'john.doe', '@john', ''])(
    'rejects "%s"',
    async (handle) => {
      expect(await getHandleErrors(handle)).not.toHaveLength(0);
    },
  );

  it('rejects a handle longer than 30 characters', async () => {
    expect(await getHandleErrors('a'.repeat(31))).not.toHaveLength(0);
  });
});
