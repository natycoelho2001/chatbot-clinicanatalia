const qrcode = require("qrcode-terminal")
const path = require("path")
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js")

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ],
  },
})

client.initialize()

const delay = (ms) => new Promise((res) => setTimeout(res, ms))
function fraseAleatoria(lista) {
  return lista[Math.floor(Math.random() * lista.length)]
}

// ======================================================
// 🔥 MENU ENVIADO HOJE
// ======================================================
const menuEnviadoHoje = new Map()

// ======================================================
// 🔥 AUSÊNCIA ENVIADA (para não mandar 2x)
// ======================================================
const ausenciaEnviada = new Map()

// ======================================================
// 🔥 LIMPEZA DIÁRIA ÀS 7h (menuEnviadoHoje + ausenciaEnviada)
// ======================================================
function rotinaLimpezaDiaria() {
  setInterval(() => {
    const agora = new Date()
    if (agora.getHours() === 7 && agora.getMinutes() === 0) {
      menuEnviadoHoje.clear()
      ausenciaEnviada.clear()
      console.log("🧹 Mapas resetados automaticamente às 7h.")
    }
  }, 60000)
}
rotinaLimpezaDiaria()

// ======================================================
client.on("qr", (qr) => {
  console.log("\n ESCANEIE O QR CODE ABAIXO:\n")
  qrcode.generate(qr, { small: true })
})

client.on("ready", () => {
  console.log("✅ Tudo certo! WhatsApp conectado.")
})

client.on("disconnected", (reason) => {
  console.log("❌ Desconectado. Tentando reconectar...", reason)
  setTimeout(() => client.initialize(), 5000)
})

// ======================================================
// 🔥 RESPOSTA A MENSAGENS ATRASADAS (chegaram fora do horário)
// Assim que der 7h, Brenda responde automaticamente
// ======================================================
client.on("message", async msg => {
  if (!msg.from.endsWith("@c.us")) return

  const chat = await msg.getChat()

  // ===================== NOME (melhorado) =====================
  let nome = "meu bem"

  try {
    const contact = await msg.getContact()

    if (contact?.name) nome = contact.name.split(" ")[0]
    else if (contact?.pushname) nome = contact.pushname.split(" ")[0]
    else if (contact?.number) nome = contact.number

  } catch (error) {
    nome = "meu bem"
  }

  const texto = msg.body.toLowerCase().trim()
  const hoje = new Date().toISOString().split("T")[0]

  // ===================== HORÁRIO =====================
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()

  const workingDays = [2, 3, 4, 5, 6]
  const workingHours = (hour >= 8 && hour < 10) || (hour >= 13 && hour < 19)

  // ======================================================
  // 🔥 MENSAGEM DE AUSÊNCIA — AGORA SOMENTE 1 VEZ POR DIA
  // ======================================================
if (!(workingDays.includes(day) && workingHours)) {
  if (hour >= 19 || hour < 7) {

    const jaMandouAusencia = ausenciaEnviada.get(msg.from) === hoje

    if (!jaMandouAusencia) {
      await client.sendMessage(
        msg.from,
        `*Brenda:*
Oi, ${nome} 🤍 Agora estamos *fora do nosso horário de atendimento.*

🕒 Terça a sábado  
⏰ 8h às 10h | 13h às 19h  
📌 Atendimento somente com horário agendado  

Assim que retornarmos, te respondo ✨`
      )

      ausenciaEnviada.set(msg.from, hoje)
    }

    return
  }
}

  // ==================================================
  // 🔥 PRIORIDADE — CONFIRMAÇÃO
  // ==================================================
  if (
    texto.includes("confirmar") ||
    texto.includes("confirmar horario") ||
    texto.includes("confirma") ||
    texto.includes("pode confirmar") ||
    texto.includes("confirme")
  ) {
    const frases = [
      "Perfeito! Seu horário está confirmado 🤍",
      "Tudo certo, confirmei na agenda ✨",
      "Ok, horário confirmado. Obrigada! ☺️",
      "Prontinho. Está confirmado 🥰"
    ]
    await delay(1500)
    await chat.sendStateTyping()
    await delay(1500)
    await client.sendMessage(msg.from, fraseAleatoria(frases))
    return
  }

  // ==================================================
  // 🔥 PRIORIDADE — CANCELAMENTO / REAGENDAR
  // ==================================================
  if (
  texto.includes("cancel") ||
  texto.includes("desmarcar") ||
  texto.includes("reagendar") ||
  texto.includes("não vou poder ir") ||
  texto.includes("nao confirmo")
) {
    const frases = [
      "Tudo bem, sem problemas 💖",
      "Tranquilo, vamos ajustar juntas 🤍"
    ]
    await delay(1500)
    await chat.sendStateTyping()
    await delay(1500)
    await client.sendMessage(msg.from,
`${fraseAleatoria(frases)}
Você gostaria de reagendar para outro dia ou horário?`)
    return
  }

  // ==================================================
  // 🔥 PRIORIDADE — QUAL É MEU HORÁRIO
  // ==================================================
  if (
  texto.includes("meu horário") ||
  texto.includes("qual horário ficou agendado") ||
  texto.includes("quando é") ||
  texto.includes("estou agendada") ||
  texto.includes("me diga meu horário")
  ) {
    await delay(1500)
    await chat.sendStateTyping()
    await delay(1500)

    return client.sendMessage(msg.from,
      `Um instante que vou conferir na agenda pra você 🥰`)
     return
  }

  // ==================================================
  // 🔥 PRIORIDADE — PIX
  // ==================================================
  if (
    texto.includes("pix") ||
    texto.includes("chave pix") ||
    texto.includes("me manda o pix") ||
    texto.includes("qual é o pix")
  ) {
    return client.sendMessage(msg.from,
  `*Chave Pix:* 67999715026  
*Nome:* Natália Coelho Reginato`)
    return
  }

  // ==================================================
  // 🔥 PRIORIDADE — ENDEREÇO 
  // ==================================================
  if (
    texto.includes("endereço") ||
    texto.includes("me enviar a localização") ||
    texto.includes("localização") ||
    texto.includes("onde fica") ||
    texto.includes("pode me passar o endereço") ||
    texto.includes("pode me mandar a localização")
  ) {
    const media = MessageMedia.fromFilePath(
      path.join(__dirname, "localizacao_clinica.jpg.jpeg")
    )

    return client.sendMessage(msg.from, media, {
      caption:
        "Nossa clínica fica na *Avenida 27 de Outubro, 2360* – Celestial Clinic, uma quadra acima do Mercado Supersul, em direção ao Cerrado 💕"
    })
      return
  }

  // ======================================================
  // 🔥 MENU AUTOMÁTICO (1x por dia)
  // ======================================================
  const jaRecebeuHoje = menuEnviadoHoje.get(msg.from) === hoje

if (
  (
    texto.includes("oi") ||
    texto.includes("oii") ||
    texto.includes("oie") ||
    texto.includes("olá") ||
    texto.includes("ola") ||
    texto.includes("bom dia") ||
    texto.includes("boa tarde") ||
    texto.includes("boa noite") ||
    texto.includes("agendar") ||
    texto.includes("marcar")
  ) &&
  !jaRecebeuHoje
) {
    await delay(1000)
    await chat.sendStateTyping()
    await delay(1000)

    await client.sendMessage(msg.from,
`Olá, tudo bem? Me chamo Brenda e sou secretária da Natália 💖
*Para facilitar, escolha uma opção:*

1️⃣ Design simples  
2️⃣ Design com henna  
3️⃣ Brow lamination  
4️⃣ Lash lifting  
5️⃣ Micropigmentação Shadow  
6️⃣ Cursos  
7️⃣ Tabela de preços  
8️⃣ Ver trabalhos  
9️⃣ Outras informações`
    )

    menuEnviadoHoje.set(msg.from, hoje)

    return
  }

  // ===================== 1 a 4 =====================
  if (["1","2","3","4","marcar sobrancelha", "marcar um horario","agendar um horario", "lash lifitng","hena","renna","rena","design","henna","brow","lamination","lifting","1️⃣","2️⃣","3️⃣","4️⃣"].includes(texto)) {
const frases = [
    "perfeito! Vou verificar a disponibilidade pra você ✨",
    "ótima escolha 💕 vou conferir os horários disponíveis",
    "maravilha! Vamos ver um horário pra você! 🌸",
    "Tá bem, vou checar a agenda pra você 🥰"
  ]

  await delay(2000)
  await chat.sendStateTyping()
  await delay(2000)

  await client.sendMessage(msg.from,
    `*Brenda:*
${nome}, ${fraseAleatoria(frases)}`
  )

  await delay(1500)
  await chat.sendStateTyping()
  await delay(1500)

  await client.sendMessage(
    msg.from,
    `Me informe, por gentileza:

📅 Dia desejado  
⏰ Horário aproximado`
  )

  return
}
  // ===================== 5 - Micropigmentação =====================
  if (["5","5️⃣","micropigmentação","shadow","micro","shandon","definitiva"].includes(texto)) {
const aberturas = [
    "preparei um material bem completo pra você ✨",
    "separei um PDF explicativo com bastantes detalhes 💕",
  ]

  const explicacoes = [
    "Ele explica como funciona o procedimento, cuidados e contraindicações.",
    "Nesse material você encontra todas as informações importantes antes de realizar a micropigmentação.",
    "Lá explicamos tudo direitinho: procedimento, recuperação e cuidados."
  ]

  await delay(2000)
  await chat.sendStateTyping()
  await delay(2000)

  await client.sendMessage(msg.from,
    `*Brenda:*
${nome}, ${fraseAleatoria(aberturas)}`)

  await delay(1500)
  await chat.sendStateTyping()
  await delay(1500)

  await client.sendMessage(msg.from, `${fraseAleatoria(explicacoes)} 💖`)

  await delay(1500)
  await chat.sendStateTyping()
  await delay(1500)

  await client.sendMessage(
    msg.from,
    `📄 Acesse o material no link abaixo:
👉 https://drive.google.com/file/d/1En1TjbU2J7u-2Vw0rkfUgXGr1n2cIoKo/view?usp=drive_link

Leia com atenção e qualquer dúvida me avise 🥰`
  )

  return
}

  // ===================== 6 - Cursos =====================
  if (["6","6️⃣","curso","cursos"].includes(texto)) {
const frases = [
    "preparei um material completo sobre o curso, ele contém conteúdo, carga horário e valor de investimento. ✨",
    "vou te enviar um PDF com todas as informações do curso, ele contém conteúdo, carga horário e valor de investimento. 🥰",
    "separei um material explicando tudo sobre o curso, ele contém conteúdo, carga horário e valor de investimento. 🌸"
  ]

  await delay(2000)
  await chat.sendStateTyping()
  await delay(2000)

  await client.sendMessage(msg.from,
    `*Brenda:*
${nome}, ${fraseAleatoria(frases)}`)

  await delay(1500)
  await chat.sendStateTyping()
  await delay(1500)

  await client.sendMessage(
    msg.from,
    `📄 Você pode acessar o material do curso aqui:
👉 https://drive.google.com/file/d/1d5Uzk8Q8oJiUo0j8kbVn9tzk4sQCA9oH/view?usp=drive_link

Qualquer dúvida, estou à disposição 🥰`
  )

  return
}

  // ===================== 7 - Tabela de preços =====================
  if (["7","tabela","tabela de preços"].includes(texto)) {
const frases = [
    "vou te enviar nossa tabela de preços, com fotos e explicações dos procedimentos ✨",
    "estou enviando nossa tabela de preços, com todos os valores com fotos e explicações dos procedimentos 💕",
    "Irei lhe enviar a tabela completinha com valores, fotos e explicações 🌸"
  ]

  await delay(2000)
  await chat.sendStateTyping()
  await delay(2000)

  await client.sendMessage(msg.from,
    `*Brenda:*
${nome}, ${fraseAleatoria(frases)}`)

    const pdf = MessageMedia.fromFilePath(
      path.join(__dirname, "tabela de preços (Story).pdf (1).pdf")
    )

    await client.sendMessage(msg.from, pdf)

    await delay(2000)
    await chat.sendStateTyping()
    await delay(2000)

    await client.sendMessage(msg.from,
      `Aqui você encontrará excelência e uma experiência maravilhosa, com atendimento personalizado ✨`
    )

    return
  }

  // ===================== 8 - Ver trabalhos =====================
  if (["8","8️⃣","ver trabalhos"].includes(texto)) {
const frases = [
    "vou te enviar nosso Instagram para você conferir os resultados ✨",
    "lá no Instagram tem vários trabalhos lindos 💕",
    "você pode ver nossos resultados no Instagram 🌸"
  ]

  await delay(1500)
  await chat.sendStateTyping()
  await delay(1500)

  await client.sendMessage(msg.from,
    `*Brenda:*
${nome}, ${fraseAleatoria(frases)}`)

  await delay(1000)
  await chat.sendStateTyping()
  await delay(1000)

  await client.sendMessage(
    msg.from,
    `👉 https://www.instagram.com/natycoelhodesigner`
  )

  return

  }

  // ===================== 9 - Outras informações =====================
  if (["9","outras informações"].includes(texto)) {
const frases = [
    "me conta como posso te ajudar ☺️",
    "Como posso te ajudar? 💖",
    "como posso te auxiliar hoje? 🌸"
  ]

  await delay(1500)
  await chat.sendStateTyping()
  await delay(1500)

  await client.sendMessage(msg.from, `*Brenda:*
${fraseAleatoria(frases)}`)

  return
 
  }

  // 🚫 SE NÃO RECONHECER → NÃO RESPONDE
})