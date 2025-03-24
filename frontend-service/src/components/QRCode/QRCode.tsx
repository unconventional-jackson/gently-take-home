import { toString as QRCodeToString } from 'qrcode';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface QRCodeProps {
  data?: string | null;
  altText?: string;
}

export function QRCode({ data }: QRCodeProps) {
  const [svgXml, setSvgXml] = useState('');
  useEffect(() => {
    if (data) {
      QRCodeToString(data, { type: 'svg', color: { light: '#ffffff00' } })
        .then((svgText) => {
          setSvgXml(svgText);
        })
        .catch((error) => {
          toast.error(`QR Code error: ${String(error)}`);
        });
    }
  }, [data]);
  if (!svgXml) {
    return null;
  }

  return (
    <div
      style={{
        maxWidth: 200,
      }}
      dangerouslySetInnerHTML={{ __html: `<svg width="100%" height="100%">${svgXml}</svg>` }}
    />
  );
}
