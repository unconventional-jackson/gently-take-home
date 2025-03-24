import { NodeLogger } from '@unconventional-code/observability-sdk';
import { getConfig } from '@unconventional-jackson/gently-common-service';

import { getSendGridClient } from '../utils/clients';

type SendSESEmailArgs = {
  to: string[];
  subject: string;
  body: string;
  correlation?: string;
};

export async function sendSendGridEmail({ to, subject, body, correlation }: SendSESEmailArgs) {
  const log = new NodeLogger({
    correlation,
    name: 'models/SendGrid/sendSendGridEmail',
  });
  try {
    log.info('Sending email with SendGrid');
    const config = await getConfig();
    const sendGridClient = await getSendGridClient();
    await sendGridClient.send({
      to,
      from: config.SENDGRID_SOURCE_EMAIL_ADDRESS,
      subject,
      text: body,
    });
    log.info('Email sent with SendGrid');
  } catch (error) {
    log.error(error, {
      detail: 'Failed to send email with SendGrid',
    });
    throw error;
  }
}
