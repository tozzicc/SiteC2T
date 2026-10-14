import { Archive, Check, ImagePlus, LoaderCircle, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listProjects } from '../lib/projects'
import { deleteProjectImage, getPublicProjectImageUrl, listProjectImages, projectImageErrorMessage, replaceProjectImage, setProjectImageAsCover, updateProjectImage, uploadProjectImage } from '../lib/projectImages'
import { validateProjectImageFile } from '../lib/projectImageValidation'
import type { Project } from '../types/project'
import type { ProjectImage, ProjectImageType } from '../types/projectImage'

const typeLabels: Record<ProjectImageType, string> = { cover: 'Capa', gallery: 'Galeria' }

export function AdminImagesPage() {
  const [searchParams] = useSearchParams()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project') ?? '')
  const [images, setImages] = useState<ProjectImage[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingImages, setLoadingImages] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEffect(() => { let active = true; listProjects().then((items) => { if (active) { setProjects(items); if (!selectedProjectId && items[0]) setSelectedProjectId(items[0].id) } }).catch((reason: unknown) => { if (active) setError(projectImageErrorMessage(reason)) }).finally(() => { if (active) setLoadingProjects(false) }); return () => { active = false } }, [selectedProjectId])
  useEffect(() => { if (!selectedProjectId) return; let active = true; listProjectImages(selectedProjectId).then((items) => { if (active) { setImages(items); setError('') } }).catch((reason: unknown) => { if (active) setError(projectImageErrorMessage(reason)) }).finally(() => { if (active) setLoadingImages(false) }); return () => { active = false } }, [selectedProjectId])
  const selectedProject = projects.find((project) => project.id === selectedProjectId)
  const cover = useMemo(() => images.find((image) => image.image_type === 'cover'), [images])
  const gallery = useMemo(() => images.filter((image) => image.image_type === 'gallery'), [images])
  function showSuccess(message: string) { setSuccess(message); setError(''); window.setTimeout(() => setSuccess(''), 3500) }
  function refresh() { if (!selectedProjectId) return; setLoadingImages(true); listProjectImages(selectedProjectId).then(setImages).catch((reason: unknown) => setError(projectImageErrorMessage(reason))).finally(() => setLoadingImages(false)) }
  if (loadingProjects) return <div className="admin-empty"><span className="admin-spinner" />Carregando projetos...</div>
  return <section className="admin-images"><div className="admin-page-heading"><div><span className="eyebrow">Storage administrativo</span><h1>Imagens</h1><p>Gerencie capas e galerias dos projetos. O catálogo público atual não é migrado nesta etapa.</p></div><button className="button button-ghost" type="button" onClick={refresh}><RefreshCw size={16} />Atualizar</button></div><div className="image-project-picker"><label htmlFor="image-project">Projeto</label><select id="image-project" value={selectedProjectId} onChange={(event) => { setLoadingImages(true); setImages([]); setSelectedProjectId(event.target.value) }}><option value="">Selecione um projeto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.title} · {project.status}</option>)}</select>{selectedProject && <Link className="text-link" to={`/admin/projetos/${selectedProject.id}`}>Ver detalhes do projeto</Link>}</div>{error && <div className="admin-alert error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Fechar mensagem"><X size={15} /></button></div>}{success && <div className="admin-alert success" role="status"><Check size={15} />{success}</div>}{selectedProjectId && <><ProjectImageUploader projectId={selectedProjectId} onUploaded={(message) => { showSuccess(message); refresh() }} onError={(message) => setError(message)} /><div className="image-section-heading"><div><span className="eyebrow">Capa</span><h2>{cover ? 'Imagem de capa' : 'Nenhuma capa definida'}</h2></div></div>{loadingImages ? <div className="admin-empty"><span className="admin-spinner" />Carregando imagens...</div> : cover ? <ImageCard image={cover} onChange={refresh} onSuccess={showSuccess} onError={setError} /> : <EmptyImageState text="Escolha uma imagem como capa ao enviar ou na galeria." /> }<div className="image-section-heading"><div><span className="eyebrow">Galeria</span><h2>{gallery.length ? `${gallery.length} imagem(ns)` : 'Galeria vazia'}</h2></div></div>{loadingImages ? <div className="admin-empty"><span className="admin-spinner" />Carregando galeria...</div> : gallery.length ? <div className="image-grid">{gallery.map((image) => <ImageCard key={image.id} image={image} onChange={refresh} onSuccess={showSuccess} onError={setError} />)}</div> : <EmptyImageState text="Adicione imagens de galeria para complementar o projeto." />}</>}</section>
}

function ProjectImageUploader({ projectId, onUploaded, onError }: { projectId: string; onUploaded: (message: string) => void; onError: (message: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState('')
  const [imageType, setImageType] = useState<ProjectImageType>('gallery')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [uploading, setUploading] = useState(false)
  const preview = useMemo(() => file ? URL.createObjectURL(file) : '', [file])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  function selectFile(next: File | undefined) { if (!next) return; const validationError = validateProjectImageFile(next); if (validationError) { onError(validationError); setFile(null); return } setFile(next); if (!altText) setAltText(next.name.replace(/\.[^.]+$/, '').slice(0, 240)) }
  async function upload() { if (!file) { onError('Selecione uma imagem antes de enviar.'); return } if (!altText.trim()) { onError('Informe o texto alternativo da imagem.'); return } setUploading(true); try { await uploadProjectImage(projectId, file, { alt_text: altText, image_type: imageType, display_order: displayOrder }); setFile(null); setAltText(''); setDisplayOrder(0); onUploaded('Imagem enviada com sucesso.') } catch (reason: unknown) { onError(projectImageErrorMessage(reason)) } finally { setUploading(false) } }
  return <div className="image-uploader"><div><span className="eyebrow">Adicionar imagem</span><h2>Enviar para o projeto</h2><p>JPEG, PNG ou WebP · máximo de 5 MB.</p><div className="image-public-warning">Bucket público: envie somente imagens destinadas à divulgação pública. Arquivos enviados podem ser acessados por URL direta.</div></div><div className="image-upload-fields"><label className="image-file-picker"><Upload size={19} /><span>{file ? file.name : 'Selecionar arquivo'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} /></label>{preview && <img className="image-upload-preview" src={preview} alt="Pré-visualização da imagem selecionada" />}<label>Texto alternativo<input value={altText} maxLength={240} onChange={(event) => setAltText(event.target.value)} placeholder="Descreva a imagem" /></label><label>Tipo<select value={imageType} onChange={(event) => setImageType(event.target.value as ProjectImageType)}><option value="gallery">Galeria</option><option value="cover">Capa</option></select></label><label>Ordem<input type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(Math.max(0, Number(event.target.value) || 0))} /></label><button className="button button-primary" type="button" disabled={uploading} onClick={() => void upload()}>{uploading ? <><LoaderCircle className="spin" size={16} />Enviando...</> : <><Upload size={16} />Enviar imagem</>}</button></div></div>
}

function ImageCard({ image, onChange, onSuccess, onError }: { image: ProjectImage; onChange: () => void; onSuccess: (message: string) => void; onError: (message: string) => void }) {
  const [altText, setAltText] = useState(image.alt_text)
  const [displayOrder, setDisplayOrder] = useState(image.display_order)
  const [busy, setBusy] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const url = getPublicProjectImageUrl(image.storage_path)
  async function saveMetadata() { setBusy(true); try { await updateProjectImage(image.id, { alt_text: altText, display_order: displayOrder }); onSuccess('Dados da imagem atualizados.'); onChange() } catch (reason: unknown) { onError(projectImageErrorMessage(reason)) } finally { setBusy(false) } }
  async function makeCover() { setBusy(true); try { await setProjectImageAsCover(image); onSuccess('Capa do projeto atualizada.'); onChange() } catch (reason: unknown) { onError(projectImageErrorMessage(reason)) } finally { setBusy(false) } }
  async function remove() { if (!window.confirm(`Remover esta imagem? A exclusão do arquivo é permanente.`)) return; setBusy(true); try { await deleteProjectImage(image); onSuccess('Imagem removida.'); onChange() } catch (reason: unknown) { onError(projectImageErrorMessage(reason)); onChange() } finally { setBusy(false) } }
  async function replace(file: File | undefined) { if (!file) return; const validationError = validateProjectImageFile(file); if (validationError) { onError(validationError); return } setReplacing(true); try { await replaceProjectImage(image, file); onSuccess('Imagem substituída.'); onChange() } catch (reason: unknown) { onError(projectImageErrorMessage(reason)) } finally { setReplacing(false) } }
  return <article className="image-card"><div className="image-card-preview"><img src={url} alt={image.alt_text} /><span className={`project-status-badge ${image.image_type}`}>{typeLabels[image.image_type]}</span></div><div className="image-card-body"><label>Texto alternativo<input value={altText} maxLength={240} onChange={(event) => setAltText(event.target.value)} /></label><label>Ordem<input type="number" min="0" value={displayOrder} onChange={(event) => setDisplayOrder(Math.max(0, Number(event.target.value) || 0))} /></label><div className="image-card-actions"><button className="button button-ghost" type="button" disabled={busy} onClick={() => void saveMetadata()}><Save size={14} />Salvar</button>{image.image_type !== 'cover' && <button className="button button-ghost" type="button" disabled={busy} onClick={() => void makeCover()}><ImagePlus size={14} />Definir capa</button>}<label className="button button-ghost image-replace-button"><RefreshCw size={14} />{replacing ? 'Substituindo...' : 'Substituir'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || replacing} onChange={(event) => { void replace(event.target.files?.[0]); event.target.value = '' }} /></label><button className="button button-danger" type="button" disabled={busy || replacing} onClick={() => void remove()}><Trash2 size={14} />Remover</button></div></div></article>
}

function EmptyImageState({ text }: { text: string }) { return <div className="admin-empty image-empty"><Archive size={26} /><p>{text}</p></div> }
