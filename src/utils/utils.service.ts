import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class UtilsService {
  encryptData(data) {
    const iv = randomBytes(16);
    const key = scryptSync(
      ConfigService.keys.ENCRYPTION_SECRET,
      'salt',
      32,
    ) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, iv);

    const encryptedData = Buffer.concat([cipher.update(data), cipher.final()]);

    return JSON.stringify({
      iv: iv.toString('hex'),
      encryptedData: encryptedData.toString('hex'),
    });
  }

  decryptData(encryptedData) {
    const parsed = JSON.parse(encryptedData);
    const iv = Buffer.from(parsed.iv, 'hex');
    encryptedData = Buffer.from(parsed.encryptedData, 'hex');
    const key = scryptSync(
      ConfigService.keys.ENCRYPTION_SECRET,
      'salt',
      32,
    ) as Buffer;
    const decipher = createDecipheriv('aes-256-ctr', key, iv);

    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
    const str = decryptedData.toString();
    return str;
  }
}
