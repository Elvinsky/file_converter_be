import { StatusController } from '../controllers/status.controller';

describe('StatusController', () => {
  it('returns ok status', () => {
    const controller = new StatusController();

    expect(controller.getStatus()).toEqual({ status: 'ok' });
  });
});
