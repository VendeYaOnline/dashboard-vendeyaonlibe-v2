/** Largos máximos (TEXT_LIMITS del backend, modules/marketing/marketing.constants.js). */
export const LIMITS = {
  name: 40,
  subject: 120,
  preheader: 150,
  heading: 120,
  body: 2000,
  button_text: 40,
  discount_code: 40,
  sender_name: 60,
  url: 300,
  whatsapp: 20,
} as const;
