import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm"

// ======================================
// SUPABASE
// ======================================

const SUPABASE_URL = "https://zeqmqluqccawgawsbcpc.supabase.co"
const SUPABASE_KEY = "sb_publishable_qu5Ut2JmpKFecim5QqIz5g_GBYJLq-N"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

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
// ESTADO GLOBAL
// ======================================

let roomCode = ""
let playerId = ""
let timer
let timeLeft = 120
let isSaving = false
let roomChannel = null
let currentPhase = ""

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
// EXPOR FUNÇÕES
// ======================================

window.createRoom = createRoom
window.joinRoom = joinRoom
window.startGame = startGame
window.saveAnswers = saveAnswers

// ======================================
// REALTIME (TEMPO REAL)
// ======================================

function subscribeRoom(code){

  if(roomChannel){
    supabase.removeChannel(roomChannel)
  }

  roomChannel = supabase
    .channel(`room:${code}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `code=eq.${code}`
      },
      (payload) => {
        const data = payload.new
        if(!data) return
        handleRoomUpdate(data)
      }
    )
    .subscribe()
}

// ======================================
// UPDATE EM TEMPO REAL
// ======================================

function handleRoomUpdate(data){

  if(data.phase !== currentPhase){
    currentPhase = data.phase
    startGame(data)
  }

  if(data.phase === "finished"){
    showResult()
  }
}

// ======================================
// GERAR CÓDIGO
// ======================================

function generateCode(){
  return Math.random().toString(36).substring(2,8).toUpperCase()
}

// ======================================
// CRIAR SALA
// ======================================

async function createRoom(){

  play(clickSound)

  const name = document.getElementById("playerName").value.trim()
  const mode = document.getElementById("gameMode").value

  if(!name){
    alert("Digite seu nome")
    return
  }

  roomCode = generateCode()
  playerId = "player1"

  await supabase.from("rooms").insert([{
    code: roomCode,
    mode,
    phase: "player1_answers",
    current_turn: "player1",
    player1_name: name,
    player2_name: "",
    player1_answers: [],
    player2_answers: [],
    player1_guesses: [],
    player2_guesses: [],
    status: "waiting"
  }])

  show("waiting")
  document.getElementById("roomCode").innerText = roomCode

  subscribeRoom(roomCode)
}

// ======================================
// ENTRAR NA SALA
// ======================================

async function joinRoom(){

  play(clickSound)

  const name = document.getElementById("playerName").value.trim()
  roomCode = document.getElementById("roomInput").value.trim().toUpperCase()

  if(!name){
    alert("Digite seu nome")
    return
  }

  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  if(!data){
    alert("Sala não encontrada")
    return
  }

  if(data.player2_name){
    alert("Sala cheia")
    return
  }

  playerId = "player2"

  await supabase.from("rooms")
    .update({
      player2_name: name,
      phase: "player1_answers",
      current_turn: "player1",
      status: "playing"
    })
    .eq("code", roomCode)

  subscribeRoom(roomCode)
  startGame(data)
}

// ======================================
// INICIAR JOGO
// ======================================

function startGame(data){

  show("questionsScreen")

  renderQuestions(data)
  startTimer(data)
}

// ======================================
// RENDER
// ======================================

function renderQuestions(data){

  const container = document.getElementById("questions")
  container.innerHTML = ""

  let title = ""

  if(data.phase === "player1_answers" || data.phase === "player2_answers"){
    title = "📝 Responda sobre você"
  }

  if(data.phase === "guessing"){
    title = "🎯 Hora de adivinhar!"
  }

  document.getElementById("phaseTitle").innerText = title

  questions.forEach((q,i)=>{
    container.innerHTML += `
      <div class="question">
        <label>${q}</label>
        <input id="q${i}" type="text">
      </div>
    `
  })
}

// ======================================
// TIMER SINCRONIZADO
// ======================================

function startTimer(data){

  clearInterval(timer)
  timeLeft = 120

  timer = setInterval(()=>{

    const el = document.getElementById("timer")

    if(el){
      const m = Math.floor(timeLeft / 60)
      const s = timeLeft % 60
      el.innerText = `⏱️ ${m}:${s < 10 ? "0" : ""}${s}`
    }

    if(timeLeft <= 10){
      play(timerSound)
    }

    if(timeLeft <= 0){
      clearInterval(timer)
      saveAnswers()
    }

    timeLeft--

  },1000)
}

// ======================================
// SALVAR RESPOSTAS
// ======================================

async function saveAnswers(){

  if(isSaving) return
  isSaving = true

  play(successSound)

  const answers = questions.map((_,i)=>
    document.getElementById(`q${i}`)?.value || ""
  )

  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  if(data.current_turn !== playerId){
    isSaving = false
    return
  }

  if(data.phase === "player1_answers"){

    await supabase.from("rooms")
      .update({
        player1_answers: answers,
        phase: "player2_answers",
        current_turn: "player2"
      })
      .eq("code", roomCode)
  }

  if(data.phase === "player2_answers"){

    await supabase.from("rooms")
      .update({
        player2_answers: answers,
        phase: "guessing",
        current_turn: "player1"
      })
      .eq("code", roomCode)
  }

  if(data.phase === "guessing"){

    await supabase.from("rooms")
      .update({
        player1_guesses: answers,
        phase: "finished",
        status: "completed"
      })
      .eq("code", roomCode)

    showResult()
  }

  isSaving = false
}

// ======================================
// RESULTADO
// ======================================

async function showResult(){

  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  show("resultScreen")
  play(winSound)

  let p1 = 0
  let p2 = 0

  const norm = t => (t || "").toLowerCase().trim()

  data.player1_guesses?.forEach((g,i)=>{
    if(norm(g) === norm(data.player2_answers[i])) p1 += 10
  })

  data.player2_guesses?.forEach((g,i)=>{
    if(norm(g) === norm(data.player1_answers[i])) p2 += 10
  })

  document.getElementById("score").innerHTML = `
    <h2>
      ${p1 > p2 ? data.player1_name : p2 > p1 ? data.player2_name : "Empate"}
    </h2>
    <p>${data.player1_name}: ${p1}</p>
    <p>${data.player2_name}: ${p2}</p>
  `
}

// ======================================
// UI
// ======================================

function show(id){

  ["home","waiting","questionsScreen","resultScreen"]
    .forEach(s=>document.getElementById(s).classList.add("hidden"))

  document.getElementById(id).classList.remove("hidden")
}

// ======================================
// INIT
// ======================================

show("home")