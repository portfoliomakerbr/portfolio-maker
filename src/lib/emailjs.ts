import emailjs from '@emailjs/browser'

export const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined
export const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined
export const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined

export const isContactFormConfigured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY,
)

interface ContactMessage {
  fromName: string
  fromEmail: string
  message: string
  portfolioOwnerName: string
  portfolioOwnerEmail: string
  portfolioUsername: string
}

// EmailJS envia o e-mail inteiramente do navegador do visitante — sem
// backend próprio pra isso. Os nomes dos campos abaixo (title, name, time,
// message, to_email, email) são os mesmos do template configurado no painel
// do EmailJS — precisam bater exatamente com as variáveis {{...}} usadas lá
// dentro, senão chegam em branco no e-mail recebido. `to_email` é dinâmico
// (o e-mail público do dono do portfólio) porque o template foi montado
// assim de propósito — nem todo template EmailJS permite isso.
export async function sendContactMessage(input: ContactMessage) {
  if (!isContactFormConfigured) {
    throw new Error('Formulário de contato não configurado (faltam variáveis VITE_EMAILJS_*).')
  }

  await emailjs.send(
    EMAILJS_SERVICE_ID!,
    EMAILJS_TEMPLATE_ID!,
    {
      title: `Nova mensagem via portfólio (${input.portfolioUsername})`,
      name: input.fromName,
      email: input.fromEmail,
      time: new Date().toLocaleString('pt-BR'),
      message: input.message,
      to_email: input.portfolioOwnerEmail,
      reply_to: input.fromEmail,
    },
    { publicKey: EMAILJS_PUBLIC_KEY! },
  )
}
