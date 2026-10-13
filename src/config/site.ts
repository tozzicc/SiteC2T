export const siteConfig = {
  name: 'C2T Tecnologia',
  slogan: 'Tecnologia que simplifica.',
  contact: {
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
    email: import.meta.env.VITE_CONTACT_EMAIL ?? '',
    linkedin: import.meta.env.VITE_LINKEDIN_URL ?? '',
  },
  social: {
    linkedin: import.meta.env.VITE_LINKEDIN_URL ?? '',
    instagram: import.meta.env.VITE_INSTAGRAM_URL ?? '',
  },
  formEndpoint: import.meta.env.VITE_FORM_ENDPOINT ?? '',
}
