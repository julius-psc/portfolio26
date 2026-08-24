import { useState } from 'react'
import AlbumCard from './AlbumCard'
import indecisiv from '../assets/images/indecisiv.png'
import twoMan from '../assets/images/2man.png'
import sellout from '../assets/images/sellout.png'

const albums = [
  { id: 'indecisiv', cover: indecisiv, query: 'indecisive kidwild'   },
  { id: '2man',      cover: twoMan,    query: '2 man step crwnmason' },
  { id: 'sellout',   cover: sellout,   query: 'sellout baby panna'   },
]

export default function MusicSection() {
  const [activeId, setActiveId] = useState<string | null>(null)

  function toggle(id: string) {
    setActiveId(prev => (prev === id ? null : id))
  }

  return (
    <div className="w-full flex justify-center pt-16 px-4 sm:px-0">
      <div className="flex gap-8 w-full max-w-[520px]">
        {albums.map(album => (
          <AlbumCard
            key={album.id}
            cover={album.cover}
            query={album.query}
            isOpen={activeId === album.id}
            onToggle={() => toggle(album.id)}
          />
        ))}
      </div>
    </div>
  )
}
