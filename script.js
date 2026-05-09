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

let timeLeft = 15

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

        player1_name: playerName,

        player1_answers: [],

        player2_name: "",

        player2_answers: [],

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
// ENTRAR NA SALA
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

    alert("Digite o código da sala")

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
// INICIAR PERGUNTAS
// ======================================

async function startQuestions(){

  const { data, error } =
    await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  if(error){

    alert("Erro ao iniciar jogo")

    return
  }

  show("questionsScreen")

  showPhrase(data.mode)

  const container =
    document.getElementById("questions")

  container.innerHTML = ""

  questions.forEach((question,index)=>{

    container.innerHTML += `

      <div class="question">

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

  timeLeft = 15

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

  if(
    !data.player1_answers ||
    data.player1_answers.length === 0
  ){

    updateData = {

      player1_answers: answers
    }

  }else{

    updateData = {

      player2_answers: answers,

      status: "completed"
    }
  }

  const { error:updateError } =
    await supabase
      .from("rooms")
      .update(updateData)
      .eq("code", roomCode)

  if(updateError){

    alert("Erro ao atualizar respostas")

    return
  }

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

  const p1 =
    data.player1_answers || []

  const p2 =
    data.player2_answers || []

  const score1 =
    calculateScore(p1,p2)

  const score2 =
    calculateScore(p2,p1)

  let winner = ""

  if(data.mode === "casal"){

    winner =

      score1 > score2

        ? "💘 Você conhece o mozão melhor!"

        : score2 > score1

        ? "🔥 Seu parceiro decorou sua alma!"

        : "😍 Vocês têm conexão perfeita!"

  }else{

    winner =

      score1 > score2

        ? "😎 Mestre da amizade!"

        : score2 > score1

        ? "🔥 Seu amigo sabe tudo!"

        : "🤝 Amizade equilibrada!"
  }

  document
    .getElementById("score")
    .innerHTML = `

      <h2>${winner}</h2>

      <p>
        ${data.player1_name || "Jogador 1"}:
        ${score1} pts
      </p>

      <p>
        ${data.player2_name || "Jogador 2"}:
        ${score2} pts
      </p>

    `

  const container =
    document.getElementById("answers")

  container.innerHTML = ""

  questions.forEach((question,index)=>{

    container.innerHTML += `

      <div class="answer-card">

        <h3>
          ${question}
        </h3>

        <p>
          ${data.player1_name || "Jogador 1"}:
          <strong>
            ${p1[index] || "-"}
          </strong>
        </p>

        <p>
          ${data.player2_name || "Jogador 2"}:
          <strong>
            ${p2[index] || "-"}
          </strong>
        </p>

      </div>

    `
  })
}

// ======================================
// PONTUAÇÃO
// ======================================

function calculateScore(a,b){

  const normalize = (text)=>

    (text || "")
      .toLowerCase()
      .trim()

  let score = 0

  a.forEach((answer,index)=>{

    if(
      normalize(answer) ===
      normalize(b[index])
    ){
      score += 10
    }
  })

  return score
}

// ======================================
// TROCAR TELAS
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