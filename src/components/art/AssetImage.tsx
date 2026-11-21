import Image from 'next/image';
import { asset } from '@/lib/assets';

interface AssetImageProps {
  assetKey: string;
  width: number;
  /** Empty string marks the image as decorative. */
  alt: string;
  className?: string;
}

export function AssetImage({ assetKey, width, alt, className }: AssetImageProps): JSX.Element {
  const a = asset(assetKey);
  const height = Math.round((width * a.height) / a.width);
  return (
    <Image
      src={a.src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ width, height }}
      aria-hidden={alt === '' ? true : undefined}
    />
  );
}