const editorialPlaceholders = new Set([
  'A definição do problema atendido ainda não foi fornecida para esta etapa.',
  'Informações sobre funcionalidades ainda não fornecidas.',
  'Tecnologias utilizadas ainda não informadas.',
])

export function publicOptionalText(value: string | null | undefined) {
  const text = value?.trim() ?? ''
  return editorialPlaceholders.has(text) ? '' : text
}

export function publicOptionalList(values: string[]) {
  return values.map(publicOptionalText).filter((value): value is string => Boolean(value))
}
