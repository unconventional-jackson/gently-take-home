import { SESClient } from '@aws-sdk/client-ses';
import SendGridClient, { MailService } from '@sendgrid/mail';
import { getConfig } from '@unconventional-jackson/gently-common-service';

export const sesClient = new SESClient({ region: 'us-east-1' });

let sendGridClient: MailService | null = null;
export async function getSendGridClient() {
  if (sendGridClient) {
    return sendGridClient;
  }
  const config = await getConfig();
  sendGridClient = SendGridClient;
  sendGridClient.setApiKey(config.SENDGRID_API_KEY);
  return sendGridClient;
}
