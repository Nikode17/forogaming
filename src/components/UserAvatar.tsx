'use client'

interface Props {
  username: string
  avatarUrl: string | null
  lastSeen?: string | null  // ISO timestamp — omit to hide indicator
  size?: number             // px, default 40
  ringClass?: string        // e.g. 'ring-4 ring-gray-900'
}

function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 3 * 60 * 1000
}

export default function UserAvatar({ username, avatarUrl, lastSeen, size = 40, ringClass = '' }: Props) {
  const showIndicator = lastSeen !== undefined
  const online = isOnline(lastSeen)
  const dotSize = Math.max(8, Math.round(size * 0.28))
  const fontSize = Math.round(size * 0.38)

  return (
    <div className={`relative shrink-0 rounded-full ${ringClass}`} style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-bold text-white"
          style={{ fontSize }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
      )}

      {showIndicator && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full border-2 border-gray-900 transition-colors ${
            online ? 'bg-green-500' : 'bg-gray-600'
          }`}
          style={{ width: dotSize, height: dotSize }}
        />
      )}
    </div>
  )
}
