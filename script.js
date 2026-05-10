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
  createClient(SUPABASE_URL, SUPABASE_KEY)

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

const clickSound = document.getElementById("clickSound")
const successSound = document.getElementById("successSound")
const timerSound = document.getElementById("timerSound")
const winSound = document.getElementById("winSound")

function play(sound){
  if(!sound) return
  sound.currentTime = 0
  sound.play().catch(()=>{})
}

// ======================================
// VARIÁVEIS
// ======================================

let roomCode = ""
let timeLeft = 120
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
    document.getElementById("playerName").value.trim()

  const mode =
    document.getElementById("gameMode").value

  if(!playerName){
    alert("Digite seu nome")
    return
  }

  roomCode = generateCode()

  const { error } =
    await supabase.from("rooms").insert([{
      code: roomCode,
      mode,
      phase: "waiting",
      player1_name: playerName,
      player2_name: "",
      player1_answers: [],
      player2_answers: [],
      player1_guesses: [],
      player2_guesses: [],
      status: "waiting"
    }])

  if(error){
    alert("Erro ao criar sala")
    return
  }

  show("waiting")

  document.getElementById("roomCode").innerText = roomCode
}

// ======================================
// ENTRAR NA SALA
// ======================================

async function joinRoom(){

  play(clickSound)

  const playerName =
    document.getElementById("playerName").value.trim()

  roomCode =
    document.getElementById("roomInput").value.trim().toUpperCase()

  if(!playerName){
    alert("Digite seu nome")
    return
  }

  if(!roomCode){
    alert("Digite o código")
    return
  }

  const { data, error } =
    await supabase.from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  if(error || !data){
    alert("Sala não encontrada")
    return
  }

  await supabase.from("rooms")
    .update({
      player2_name: playerName,
      status: "playing",
      phase: "player1_answers"
    })
    .eq("code", roomCode)

  startQuestions()
}

// ======================================
// INICIAR JOGO
// ======================================

async function startQuestions(){

  const { data, error } =
    await supabase.from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  if(error){
    alert("Erro ao iniciar")
    return
  }

  show("questionsScreen")

  showPhrase(data.mode)

  const container =
    document.getElementById("questions")

  container.innerHTML = ""

  let title = ""

  switch(data.phase){

    case "player1_answers":
    case "player2_answers":
      title = "📝 Responda sobre VOCÊ"
      break

    case "guessing":
      title = "🎯 Hora de adivinhar!"
      break

    case "finished":
      title = "🏆 Jogo finalizado"
      break
  }

  document.getElementById("phaseTitle").innerText = title

  questions.forEach((q,i)=>{
    container.innerHTML += `
      <div class="question">
        <label for="q${i}">${q}</label>
        <input id="q${i}" type="text">
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

  timeLeft = 120

  timer = setInterval(()=>{

    const timerEl =
      document.getElementById("timer")

    if(timerEl){

      const m = Math.floor(timeLeft / 60)
      const s = timeLeft % 60

      timerEl.innerText =
        `⏱️ ${m}:${s < 10 ? "0" : ""}${s}`
    }

    if(timeLeft <= 10){
      play(timerSound)
      navigator.vibrate?.(150)
    }

    if(timeLeft <= 0){
      clearInterval(timer)
      saveAnswers()
    }

    timeLeft--

  },1000)
}

// ======================================
// SALVAR RESPOSTAS (FLUXO CORRETO)
// ======================================

async function saveAnswers(){

  clearInterval(timer)
  play(successSound)

  const answers = []

  questions.forEach((_,i)=>{
    answers.push(
      document.getElementById(`q${i}`)?.value || ""
    )
  })

  const { data } =
    await supabase.from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  let updateData = {}

  if(data.phase === "player1_answers"){

    updateData = {
      player1_answers: answers,
      phase: "player2_answers"
    }

    await supabase.from("rooms")
      .update(updateData)
      .eq("code", roomCode)

    location.reload()
    return
  }

  if(data.phase === "player2_answers"){

    updateData = {
      player2_answers: answers,
      phase: "guessing"
    }

    await supabase.from("rooms")
      .update(updateData)
      .eq("code", roomCode)

    location.reload()
    return
  }

  if(data.phase === "guessing"){

    updateData = {
      player1_guesses: answers,
      phase: "finished",
      status: "completed"
    }

    await supabase.from("rooms")
      .update(updateData)
      .eq("code", roomCode)

    showResult()
  }
}

// ======================================
// RESULTADO
// ======================================

async function showResult(){

  const { data } =
    await supabase.from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

  show("resultScreen")

  play(winSound)

  let p1 = 0
  let p2 = 0

  const norm = t =>
    (t || "").toLowerCase().trim()

  data.player1_guesses?.forEach((g,i)=>{
    if(norm(g) === norm(data.player2_answers[i])){
      p1 += 10
    }
  })

  data.player2_guesses?.forEach((g,i)=>{
    if(norm(g) === norm(data.player1_answers[i])){
      p2 += 10
    }
  })

  document.getElementById("score").innerHTML = `
    <h2>${p1 > p2 ? data.player1_name : p2 > p1 ? data.player2_name : "Empate!"}</h2>
    <p>${data.player1_name}: ${p1}</p>
    <p>${data.player2_name}: ${p2}</p>
  `
}

// ======================================
// UI
// ======================================

function show(id){
  ["home","waiting","questionsScreen","resultScreen"]
    .forEach(s=>{
      document.getElementById(s).classList.add("hidden")
    })

  document.getElementById(id).classList.remove("hidden")
}

// ======================================
// FRASES
// ======================================

function showPhrase(mode){

  const list =
    mode === "casal"
      ? couplePhrases
      : friendsPhrases

  document.getElementById("phrase").innerText =
    list[Math.floor(Math.random()*list.length)]
}

// ======================================
// START
// ======================================

show("home")