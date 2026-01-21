import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendMail = vi.fn().mockResolvedValue({ messageId: 'x' });
const nodemailerMock = {
  createTransport: vi.fn(() => ({ sendMail })),
};

vi.mock('nodemailer', () => ({ default: nodemailerMock }));

describe('lib/mail', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('sendResetCode: calls transporter.sendMail with expected payload', async () => {
    const { sendResetCode } = await import('@/lib/mail.js');

    await sendResetCode('a@b.com', '123456');

    expect(nodemailerMock.createTransport).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.com',
        subject: 'Kode Reset Password',
        text: expect.stringContaining('123456'),
      }),
    );
  });
});
