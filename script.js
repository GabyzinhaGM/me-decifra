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
// ESTADO
// ======================================

let roomCode = ""
let playerId = ""
let roomChannel = null

let timer = null
let timeLeft = 120

let currentPhase = ""
let canSave = true
let isResultShown = false

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
// EXPOSE
// ======================================

window.createRoom = createRoom
window.joinRoom = joinRoom
window.saveAnswers = saveAnswers

// ======================================
// CREATE ROOM
// ======================================

async function createRoom(){

  play(clickSound)

  const name = document.getElementById("playerName").value.trim()
  const mode = document.getElementById("gameMode").value

  if(!name){
    alert("Digite seu nome")
    return
  }

  roomCode = generateCode().toUpperCase()
  playerId = "player1"

  const { data, error } = await supabase
    .from("rooms")
    .insert([{
      code: roomCode,
      mode,
      phase: "waiting_player2",
      current_turn: "player1",
      player1_name: name,
      player2_name: "",
      player1_answers: [],
      player2_answers: [],
      player1_guesses: [],
      player2_guesses: [],
      status: "waiting"
    }])
    .select()
    .single()

  if(error){
    console.log(error)
    alert("Erro ao criar sala")
    return
  }

  subscribeRoom(roomCode)

  show("waiting")
  document.getElementById("roomCode").innerText = roomCode
}

// ======================================
// JOIN ROOM
// ======================================

async function joinRoom(){

  play(clickSound)

  const name = document.getElementById("playerName").value.trim()
  roomCode = document.getElementById("roomInput").value.trim().toUpperCase()

  if(!name){
    alert("Digite seu nome")
    return
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  if(error || !data){
    alert("Sala não encontrada")
    return
  }

  if(data.player2_name){
    alert("Sala cheia")
    return
  }

  playerId = "player2"

  await supabase
    .from("rooms")
    .update({
      player2_name: name,
      phase: "player1_answers",
      current_turn: "player1",
      status: "playing"
    })
    .eq("code", roomCode)

  subscribeRoom(roomCode)
}

// ======================================
// REALTIME
// ======================================

function subscribeRoom(code){

  if(roomChannel){
    supabase.removeChannel(roomChannel)
  }

  roomChannel = supabase
    .channel(`room:${code}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "rooms",
      filter: `code=eq.${code}`
    }, (payload) => {

      const data = payload.new
      if(!data) return

      if(data.phase !== currentPhase){
        currentPhase = data.phase
        handleRoomUpdate(data)
      }
    })
    .subscribe()
}

// ======================================
// UI FLOW
// ======================================

function handleRoomUpdate(data){

  if(data.phase === "waiting_player2"){
    show("waiting")
    return
  }

  if(data.phase === "player1_answers" || data.phase === "player2_answers" || data.phase === "guessing"){
    show("questionsScreen")
    renderQuestions(data)
    startTimer()
    return
  }

  if(data.phase === "finished"){
    showResult(data)
  }
}

// ======================================
// RENDER
// ======================================

function renderQuestions(data){

  const container = document.getElementById("questions")
  container.innerHTML = ""

  document.getElementById("phaseTitle").innerText =
    data.phase.includes("guessing")
      ? "🎯 Adivinhe as respostas"
      : "📝 Responda sobre você"

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
// TIMER
// ======================================

function startTimer(){

  clearInterval(timer)
  timeLeft = 120

  timer = setInterval(()=>{

    const el = document.getElementById("timer")

    const m = Math.floor(timeLeft / 60)
    const s = timeLeft % 60

    if(el){
      el.innerText = `⏱️ ${m}:${s < 10 ? "0" : ""}${s}`
    }

    if(timeLeft <= 0){
      clearInterval(timer)
      alert("Tempo acabou")
      return
    }

    timeLeft--

  },1000)
}

// ======================================
// SAVE
// ======================================

async function saveAnswers(){

  if(!canSave) return
  canSave = false

  play(successSound)

  const answers = questions.map((_,i)=>
    document.getElementById(`q${i}`)?.value || ""
  )

  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  if(!data){
    canSave = true
    return
  }

  const update = async (payload) => {
    await supabase
      .from("rooms")
      .update(payload)
      .eq("code", roomCode)
  }

  if(data.phase === "player1_answers"){
    await update({
      player1_answers: answers,
      phase: "player2_answers",
      current_turn: "player2"
    })
  }

  if(data.phase === "player2_answers"){
    await update({
      player2_answers: answers,
      phase: "guessing",
      current_turn: "player1"
    })
  }

  if(data.phase === "guessing"){
    await update({
      player1_guesses: answers,
      phase: "finished",
      status: "completed"
    })
  }

  canSave = true
}

// ======================================
// RESULT
// ======================================

async function showResult(data = null){

  if(isResultShown) return
  isResultShown = true

  if(!data){
    const res = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

    data = res.data
  }

  play(winSound)
  show("resultScreen")

  let p1 = 0
  let p2 = 0

  const norm = t => (t || "").toLowerCase().trim()

  data.player1_guesses?.forEach((g,i)=>{
    if(norm(g) === norm(data.player2_answers?.[i])) p1 += 10
  })

  data.player2_guesses?.forEach((g,i)=>{
    if(norm(g) === norm(data.player1_answers?.[i])) p2 += 10
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
// HELPERS
// ======================================

function generateCode(){
  return Math.random().toString(36).substring(2,8).toUpperCase()
}

function show(id){

  ["home","waiting","questionsScreen","resultScreen"]
    .forEach(s => document.getElementById(s).classList.add("hidden"))

  document.getElementById(id).classList.remove("hidden")
}

// INIT
show("home")