export function updateMetaDescription(description: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }
  meta.content = description
}

export function setPageSeo(title: string, description: string) {
  document.title = title
  updateMetaDescription(description)
}
