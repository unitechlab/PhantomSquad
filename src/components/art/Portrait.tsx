import Image from 'next/image';
import type { CharacterId } from '@/types';
import { characterAsset, type CharacterKind } from '@/lib/assets';

interface PortraitProps {
  id: CharacterId;
  name: string;
  kind: CharacterKind;
  /** Rendered width in px; height keeps the sprite's aspect ratio. */
  width: number;
  className?: string;
  priority?: boolean;
}

export function Portrait({ id, name, kind, width, className, priority }: PortraitProps): JSX.Element {
  const a = characterAsset(id, kind);
  const height = Math.round((width * a.height) / a.width);
  return (
    <Image
      src={a.src}
      alt={name}
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ width, height }}
    />
  );
}