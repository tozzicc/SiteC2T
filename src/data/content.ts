import type { LucideIcon } from 'lucide-react'
import { Bot, BriefcaseBusiness, Code2, Headset, Workflow } from 'lucide-react'

export type Solution = { icon: LucideIcon; title: string; description: string }
export type ProjectStatus = 'placeholder' | 'published'
export type ProjectImageKind = 'screenshot' | 'promotional'
export type ProjectImage = { src: string; alt: string; isPlaceholder: boolean; kind?: ProjectImageKind }
export type Project = {
  id: string
  slug: string
  name: string
  summary: string
  description: string
  problem: string
  category: string
  technologies: string[]
  features: string[]
  images: ProjectImage[]
  demoUrl?: string
  demoCredentials?: { username: string; password: string }
  repoUrl?: string
  status: ProjectStatus
}

export const solutions: Solution[] = [
  { icon: Code2, title: 'Desenvolvimento de Sistemas Web', description: 'Aplicações web sob medida para organizar operações e aproximar sua empresa de seus objetivos.' },
  { icon: BriefcaseBusiness, title: 'Sistemas Empresariais Personalizados', description: 'Soluções alinhadas à rotina do seu negócio, com clareza, segurança e espaço para crescer.' },
  { icon: Workflow, title: 'Automação de Processos', description: 'Menos tarefas repetitivas e mais tempo para o que realmente move a sua operação.' },
  { icon: Headset, title: 'Consultoria em Tecnologia da Informação', description: 'Visão técnica para apoiar decisões e construir uma base digital consistente.' },
]

export type Service = Solution & {
  slug: string
  examples: string[]
  benefits: string[]
  projectSlugs?: string[]
}

export const services: Service[] = [
  {
    slug: 'desenvolvimento-web', icon: Code2, title: 'Desenvolvimento de Sistemas Web',
    description: 'Aplicações digitais responsivas para organizar informações, apoiar decisões e dar mais clareza à operação.',
    examples: ['Aplicações web responsivas', 'Sistemas administrativos', 'Dashboards gerenciais', 'Portais empresariais', 'Integrações entre frontend e backend'],
    benefits: ['Acesso facilitado em diferentes dispositivos', 'Informações organizadas em um só lugar', 'Base preparada para evolução contínua'],
  },
  {
    slug: 'sistemas-personalizados', icon: BriefcaseBusiness, title: 'Sistemas Empresariais Personalizados',
    description: 'Soluções alinhadas aos processos internos da empresa, com espaço para refletir necessidades específicas.',
    examples: ['Gestão de chamados', 'Agendamentos online', 'Gestão de projetos', 'Sistemas para processos internos'],
    benefits: ['Processos mais claros e rastreáveis', 'Experiência adequada à rotina da equipe', 'Visão centralizada das informações'],
    projectSlugs: ['chamado-ti', 'agenda', 'gestao-de-projetos'],
  },
  {
    slug: 'automacao-de-processos', icon: Workflow, title: 'Automação de Processos',
    description: 'Estratégias e soluções para reduzir tarefas repetitivas e tornar os fluxos operacionais mais organizados.',
    examples: ['Automação de tarefas repetitivas', 'Integração entre sistemas', 'Organização de dados', 'Otimização de fluxos operacionais'],
    benefits: ['Mais consistência na execução das rotinas', 'Menos retrabalho manual', 'Melhor visibilidade dos fluxos'],
  },
  {
    slug: 'consultoria-em-ti', icon: Headset, title: 'Consultoria em Tecnologia da Informação',
    description: 'Análise técnica para apoiar decisões de tecnologia e orientar próximos passos com mais segurança.',
    examples: ['Análise de necessidades tecnológicas', 'Infraestrutura e redes', 'Windows Server', 'Suporte a sistemas empresariais', 'Modernização de processos'],
    benefits: ['Decisões mais bem fundamentadas', 'Prioridades técnicas mais claras', 'Visão prática para modernização'],
  },
]

const image = (src: string, alt: string, kind: ProjectImageKind): ProjectImage => ({ src, alt, kind, isPlaceholder: false })

export const projects: Project[] = [
  {
    id: 'project-chamado-ti', slug: 'chamado-ti', name: 'Chamado TI',
    summary: 'Projeto de catálogo para uma solução de atendimento em tecnologia da informação.',
    description: 'O Chamado TI está catalogado como um projeto da C2T Tecnologia. As informações comerciais e técnicas detalhadas serão adicionadas quando forem disponibilizadas.',
    problem: '', category: 'Sistemas', technologies: [], features: [],
    images: [
      image('/projects/chamado-ti/0.png', 'Dashboard do Chamado TI — captura da aplicação', 'screenshot'),
      image('/projects/chamado-ti/1.png', 'Chamado TI — arte promocional', 'promotional'),
      image('/projects/chamado-ti/2.png', 'Chamado TI — captura da aplicação', 'screenshot'),
      image('/projects/chamado-ti/3.png', 'Chamado TI — captura da aplicação', 'screenshot'),
      image('/projects/chamado-ti/4.png', 'Chamado TI — captura da aplicação', 'screenshot'),
      image('/projects/chamado-ti/5.png', 'Chamado TI — captura da aplicação', 'screenshot'),
      image('/projects/chamado-ti/6.png', 'Chamado TI — arte promocional', 'promotional'),
    ], status: 'published',
  },
  {
    id: 'project-agenda', slug: 'agenda', name: 'Agenda',
    summary: 'Projeto de catálogo para uma solução de organização e agendamento.',
    description: 'O projeto Agenda está catalogado como uma solução da C2T Tecnologia. A descrição completa será complementada com informações oficiais nas próximas etapas.',
    problem: '', category: 'Produtividade', technologies: [], features: [],
    images: [
      image('/projects/agenda/Agenda Online para Bem-Estar - ANUNCIO.png', 'Agenda Online — arte de apresentação', 'promotional'),
      image('/projects/agenda/01 - Escolha de horários no sistema de agendamento.png', 'Agenda Online — escolha de horários, captura da aplicação', 'screenshot'),
      image('/projects/agenda/02 - Confirmação de Agendamento Online.png', 'Agenda Online — confirmação de agendamento, captura da aplicação', 'screenshot'),
      image('/projects/agenda/03 - Mockup de Controle Financeiro.png', 'Agenda Online — mockup de controle financeiro', 'promotional'),
      image('/projects/agenda/Agenda Online Espaço Bem-Estar.png', 'Agenda Online — apresentação comercial', 'promotional'),
      image('/projects/agenda/Agenda Online_ Organização e Bem-Estar.png', 'Agenda Online — organização e bem-estar, arte promocional', 'promotional'),
      image('/projects/agenda/Demonstração Completa do Espaço Bem-Estar.png', 'Agenda Online — demonstração completa, arte promocional', 'promotional'),
      image('/projects/agenda/agenda_anuncio_01.png', 'Agenda Online — anúncio 01', 'promotional'),
      image('/projects/agenda/agenda_anuncio_04.png', 'Agenda Online — anúncio 04', 'promotional'),
      image('/projects/agenda/agenda_anuncio_07.png', 'Agenda Online — anúncio 07', 'promotional'),
      image('/projects/agenda/agenda_anuncio_10.png', 'Agenda Online — anúncio 10', 'promotional'),
      image('/projects/agenda/agenda_anuncio_12.png', 'Agenda Online — anúncio 12', 'promotional'),
      image('/projects/agenda/agenda_anuncio_13.png', 'Agenda Online — anúncio 13', 'promotional'),
      image('/projects/agenda/agenda_anuncio_14.png', 'Agenda Online — anúncio 14', 'promotional'),
      image('/projects/agenda/agenda_anuncio_15.png', 'Agenda Online — anúncio 15', 'promotional'),
      image('/projects/agenda/agenda_anuncio_16.png', 'Agenda Online — anúncio 16', 'promotional'),
    ], status: 'published',
  },
  {
    id: 'project-gestao-projetos', slug: 'gestao-de-projetos', name: 'Gestão de Projetos',
    summary: 'Projeto de catálogo para uma solução voltada à organização de projetos.',
    description: 'O projeto Gestão de Projetos está catalogado como uma solução da C2T Tecnologia. Os detalhes funcionais e técnicos serão adicionados após validação das informações oficiais.',
    problem: '', category: 'Gestão', technologies: [], features: [],
    images: [
      image('/projects/gestao-de-projetos/capa 1.png', 'Gestão de Projetos — capa de apresentação', 'promotional'),
      image('/projects/gestao-de-projetos/capa 2.png', 'Gestão de Projetos — capa de apresentação alternativa', 'promotional'),
      image('/projects/gestao-de-projetos/capa 2_5.png', 'Gestão de Projetos — arte de apresentação', 'promotional'),
      image('/projects/gestao-de-projetos/2.png', 'Gestão de Projetos — dashboard gerencial', 'screenshot'),
      image('/projects/gestao-de-projetos/3.png', 'Gestão de Projetos — captura da aplicação', 'screenshot'),
      image('/projects/gestao-de-projetos/4.png', 'Gestão de Projetos — captura da aplicação', 'screenshot'),
      image('/projects/gestao-de-projetos/5.png', 'Gestão de Projetos — captura da aplicação', 'screenshot'),
      image('/projects/gestao-de-projetos/6.png', 'Gestão de Projetos — captura da aplicação', 'screenshot'),
      image('/projects/gestao-de-projetos/7.png', 'Gestão de Projetos — captura da aplicação', 'screenshot'),
    ], demoUrl: 'https://gestaoprojetos-ten.vercel.app/', status: 'published',
  },
]

export const heroPoints = [
  { icon: Bot, text: 'Tecnologia que simplifica' },
  { icon: Code2, text: 'Soluções pensadas para o seu negócio' },
]
