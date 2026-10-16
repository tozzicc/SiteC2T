import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProjectImage } from '../data/content'

type Props = { images: ProjectImage[]; projectName: string }

export function ProjectGallery({ images, projectName }: Props) {
  const [selected, setSelected] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const hasImages = images.length > 0
  useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowLeft') setSelected((value) => (value - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setSelected((value) => (value + 1) % images.length)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [images.length, lightboxOpen])

  if (!hasImages) return <div className="gallery-empty"><ImageOff size={26} /><span>Imagens do projeto ainda não disponíveis.</span></div>

  const selectedIndex = Math.min(selected, images.length - 1)
  const current = images[selectedIndex]
  const move = (direction: number) => setSelected((value) => (value + direction + images.length) % images.length)

  return <div className="project-gallery">
    <button className="gallery-main" type="button" onClick={() => setLightboxOpen(true)} aria-label={`Ampliar imagem de ${projectName}`}>
      <img src={current.src} alt={current.alt} />
      {current.isPlaceholder && <span className="placeholder-label">Imagem placeholder</span>}
      {!current.isPlaceholder && current.kind && <span className="placeholder-label">{current.kind === 'screenshot' ? 'Captura da aplicação' : 'Arte promocional'}</span>}
    </button>
    {images.length > 1 && <div className="gallery-thumbnails" aria-label="Miniaturas da galeria">{images.map((image, index) => <button key={image.src} type="button" className={index === selected ? 'gallery-thumb selected' : 'gallery-thumb'} onClick={() => setSelected(index)} aria-label={`Ver imagem ${index + 1}`}><img src={image.src} alt="" /></button>)}</div>}
    {lightboxOpen && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Imagem ampliada de ${projectName}`} onClick={() => setLightboxOpen(false)}><div className="lightbox-content" onClick={(event) => event.stopPropagation()}><button className="lightbox-close" type="button" onClick={() => setLightboxOpen(false)} aria-label="Fechar imagem"><X /></button><img src={current.src} alt={current.alt} /><span className="lightbox-caption">{current.isPlaceholder ? 'Imagem placeholder local' : `${current.kind === 'screenshot' ? 'Captura da aplicação' : 'Arte promocional'} — ${current.alt}`}</span>{images.length > 1 && <><button className="lightbox-nav previous" type="button" onClick={() => move(-1)} aria-label="Imagem anterior"><ChevronLeft /></button><button className="lightbox-nav next" type="button" onClick={() => move(1)} aria-label="Próxima imagem"><ChevronRight /></button></>}</div></div>}
  </div>
}
