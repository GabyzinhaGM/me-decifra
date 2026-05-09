import {
  createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

// ======================================
// SUPABASE
// ======================================

const SUPABASE_URL =
  "https://zeqmqluqccawgawsbcpc.supabase.co"

const SUPABASE_KEY =
  "sb_publishable_qu5Ut2JmpKFecim5QqIz5g_GBYJLq-N"

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  )

// ======================================
// PERGUNTAS
// ======================================

const questions = [

  "Qual é minha comida favorita?",

  "Qual é meu maior sonho?",

  "Qual é minha maior qualidade?",

  "Qual é meu maior defeito?",

  "Qual é meu hobby favorito?",

  "Qual é minha cor favorita?",

  "Qual aplicativo eu mais uso?",

  "Qual é meu maior medo?",

  "Qual é meu filme favorito?",

  "Qual é meu doce favorito?"

]

// ======================================
// FRASES
// ======================================

const couplePhrases = [

  "💘 O amor vai sobreviver?",

  "🔥 Quem conhece melhor o mozão?",

  "😍 Hora da verdade do casal!",

  "💞 Será que vocês têm conexão perfeita?"

]

const friendsPhrases = [

  "😎 Amizade forte ou fake?",

  "🔥 Quem conhece mais o amigo?",

  "👀 Agora ninguém esconde nada!",

  "🤝 Testando amizade verdadeira!"

]

// ======================================
// SONS
// ======================================

const clickSound =
  document.getElementById("clickSound")

const successSound =
  document.getElementById("successSound")

const timerSound =
  document.getElementById("timerSound")

const winSound =
  document.getElementById("winSound")

function play(sound){

  if(!sound) return

  sound.currentTime = 0

  sound.play()
    .catch(()=>{})
}

// ======================================
// VARIÁVEIS
// ======================================

let roomCode = ""

let timeLeft = 20

let timer

// ======================================
// EXPOR FUNÇÕES
// ======================================

window.createRoom = createRoom
window.joinRoom = joinRoom
window.startQuestions = startQuestions
window.saveAnswers = saveAnswers

// ======================================
// GERAR CÓDIGO
// ======================================

function generateCode(){

  return Math.random()
    .toString(36)
    .substring(2,8)
    .toUpperCase()
}

// ======================================
// CRIAR SALA
// ======================================

async function createRoom(){

  play(clickSound)

  const playerName =
    document
      .getElementById("playerName")
      .value
      .trim()

  const mode =
    document
      .getElementById("gameMode")
      .value

  if(!playerName){

    alert("Digite seu nome")

    return
  }

  roomCode = generateCode()

  const { error } =
    await supabase
      .from("rooms")
      .insert([{

        code: roomCode,

        mode: mode,

        phase: "answers",

        player1_name: playerName,

        player2_name: "",

        player1_answers: [],

        player2_answers: [],

        player1_guesses: [],

        player2_guesses: [],

        status: "waiting"

      }])

  if(error){

    console.log(error)

    alert("Erro ao criar sala")

    return
  }

  show("waiting")

  document
    .getElementById("roomCode")
    .innerText = roomCode
}

// ======================================
// ENTRAR SALA
// ======================================

async function joinRoom(){

  play(clickSound)

  const playerName =
    document
      .getElementById("playerName")
      .value
      .trim()

  roomCode =
    document
      .getElementById("roomInput")
      .value
      .trim()
      .toUpperCase()

  if(!playerName){

    alert("Digite seu nome")

    return
  }

  if(!roomCode){

    alert("Digite o código")

    return
  }

  const { data, error } =
    await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  if(error || !data){

    alert("Sala não encontrada")

    return
  }

  await supabase
    .from("rooms")
    .update({

      player2_name: playerName,

      status: "playing"

    })
    .eq("code", roomCode)

  startQuestions()
}

// ======================================
// INICIAR
// ======================================

async function startQuestions(){

  const { data } =
    await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  show("questionsScreen")

  showPhrase(data.mode)

  const container =
    document.getElementById("questions")

  container.innerHTML = ""

  let title = ""

  // ======================================
  // DEFINIR FASE
  // ======================================

  if(
    !data.player1_answers ||
    data.player1_answers.length === 0
  ){

    title =
      "📝 Responda sobre VOCÊ"

  }else if(
    !data.player2_answers ||
    data.player2_answers.length === 0
  ){

    title =
      "📝 Responda sobre VOCÊ"

  }else if(
    !data.player1_guesses ||
    data.player1_guesses.length === 0
  ){

    title =
      `🎯 Tente acertar ${data.player2_name}`

  }else{

    title =
      `🎯 Tente acertar ${data.player1_name}`
  }

  document
    .getElementById("phaseTitle")
    .innerText = title

  questions.forEach((question,index)=>{

    container.innerHTML += `

      <div class="question fade">

        <label for="q${index}">
          ${question}
        </label>

        <input
          id="q${index}"
          type="text"
          aria-label="${question}"
        >

      </div>

    `
  })

  startTimer()
}

// ======================================
// TIMER
// ======================================

function startTimer(){

  clearInterval(timer)

  timeLeft = 20

  timer = setInterval(()=>{

    const timerEl =
      document.getElementById("timer")

    if(timerEl){

      timerEl.innerText =
        `⏱️ ${timeLeft}s`
    }

    if(timeLeft <= 3){

      play(timerSound)

      navigator.vibrate?.(200)
    }

    if(timeLeft <= 0){

      clearInterval(timer)

      saveAnswers()
    }

    timeLeft--

  },1000)
}

// ======================================
// SALVAR
// ======================================

async function saveAnswers(){

  clearInterval(timer)

  play(successSound)

  const answers = []

  questions.forEach((_,index)=>{

    const value =
      document
        .getElementById(`q${index}`)
        ?.value || ""

    answers.push(value)

  })

  const { data, error } =
    await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  if(error){

    alert("Erro ao salvar")

    return
  }

  let updateData = {}

  // ======================================
  // PLAYER 1 RESPONDE
  // ======================================

  if(
    !data.player1_answers ||
    data.player1_answers.length === 0
  ){

    updateData = {

      player1_answers: answers,

      phase: "player2_answers"

    }

    await supabase
      .from("rooms")
      .update(updateData)
      .eq("code", roomCode)

    alert(
      "✅ Respostas salvas!\nAgora o Jogador 2 responde."
    )

    location.reload()

    return
  }

  // ======================================
  // PLAYER 2 RESPONDE
  // ======================================

  if(
    !data.player2_answers ||
    data.player2_answers.length === 0
  ){

    updateData = {

      player2_answers: answers,

      phase: "guesses"
    }

    await supabase
      .from("rooms")
      .update(updateData)
      .eq("code", roomCode)

    alert(
      "🔥 Agora começa a fase de adivinhação!"
    )

    location.reload()

    return
  }

  // ======================================
  // PLAYER 1 CHUTA
  // ======================================

  if(
    !data.player1_guesses ||
    data.player1_guesses.length === 0
  ){

    updateData = {

      player1_guesses: answers
    }

    await supabase
      .from("rooms")
      .update(updateData)
      .eq("code", roomCode)

    alert(
      "😎 Agora o outro jogador tenta adivinhar!"
    )

    location.reload()

    return
  }

  // ======================================
  // PLAYER 2 CHUTA
  // ======================================

  updateData = {

    player2_guesses: answers,

    status: "completed",

    phase: "completed"
  }

  await supabase
    .from("rooms")
    .update(updateData)
    .eq("code", roomCode)

  showResult()
}

// ======================================
// RESULTADO
// ======================================

async function showResult(){

  const { data, error } =
    await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  if(error){

    alert("Erro ao carregar resultado")

    return
  }

  show("resultScreen")

  play(winSound)

  const p1Answers =
    data.player1_answers || []

  const p2Answers =
    data.player2_answers || []

  const p1Guesses =
    data.player1_guesses || []

  const p2Guesses =
    data.player2_guesses || []

  let player1Score = 0
  let player2Score = 0

  const normalize = (text)=>

    (text || "")
      .toLowerCase()
      .trim()

  p1Guesses.forEach((guess,index)=>{

    if(
      normalize(guess) ===
      normalize(p2Answers[index])
    ){
      player1Score += 10
    }

  })

  p2Guesses.forEach((guess,index)=>{

    if(
      normalize(guess) ===
      normalize(p1Answers[index])
    ){
      player2Score += 10
    }

  })

  let winner = ""

  if(player1Score > player2Score){

    winner =
      `🏆 ${data.player1_name} venceu!`

  }else if(player2Score > player1Score){

    winner =
      `🏆 ${data.player2_name} venceu!`

  }else{

    winner =
      "🤝 EMPATE!"
  }

  document
    .getElementById("score")
    .innerHTML = `

      <h2>${winner}</h2>

      <p>
        ${data.player1_name}:
        ${player1Score} pontos
      </p>

      <p>
        ${data.player2_name}:
        ${player2Score} pontos
      </p>

    `

  const container =
    document.getElementById("answers")

  container.innerHTML = ""

  questions.forEach((question,index)=>{

    const p1Correct =

      normalize(p2Answers[index]) ===
      normalize(p1Guesses[index])

    const p2Correct =

      normalize(p1Answers[index]) ===
      normalize(p2Guesses[index])

    container.innerHTML += `

      <div class="answer-card fade">

        <h3>
          ${question}
        </h3>

        <p>
          ${data.player1_name} respondeu:
          <strong>
            ${p1Answers[index] || "-"}
          </strong>
        </p>

        <p>
          ${data.player2_name} chutou:
          <strong>
            ${p2Guesses[index] || "-"}
          </strong>

          ${p2Correct ? "✅" : "❌"}
        </p>

        <hr>

        <p>
          ${data.player2_name} respondeu:
          <strong>
            ${p2Answers[index] || "-"}
          </strong>
        </p>

        <p>
          ${data.player1_name} chutou:
          <strong>
            ${p1Guesses[index] || "-"}
          </strong>

          ${p1Correct ? "✅" : "❌"}
        </p>

      </div>

    `
  })
}

// ======================================
// TROCAR TELA
// ======================================

function show(id){

  document
    .querySelectorAll(".container > div")
    .forEach(screen=>
      screen.classList.add("hidden")
    )

  document
    .getElementById(id)
    .classList.remove("hidden")
}

// ======================================
// FRASES
// ======================================

function showPhrase(mode){

  const list =

    mode === "casal"

      ? couplePhrases

      : friendsPhrases

  document
    .getElementById("phrase")
    .innerText =

      list[
        Math.floor(
          Math.random() * list.length
        )
      ]
}