import { avatarHue, getInitials } from '../../utils/format'
import styles from './Avatar.module.scss'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const hue = avatarHue(name)

  return (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      style={{
        background: `linear-gradient(145deg, hsl(${hue} 62% 58%), hsl(${(hue + 40) % 360} 55% 46%))`,
      }}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  )
}
