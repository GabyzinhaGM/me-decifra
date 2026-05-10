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
let currentRoom = null
let isSaving = false

// ======================================
// SONS
// ======================================

const clickSound = document.getElementById("clickSound")
const successSound = document.getElementById("successSound")
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
window.saveAnswers = saveAnswers

// ======================================
// CRIAR SALA
// ======================================

async function createRoom(){

  play(clickSound)

  const name = document.getElementById("playerName").value.trim()

  if(!name){
    alert("Digite seu nome")
    return
  }

  roomCode = generateCode()
  playerId = "player1"

  const { error } = await supabase
    .from("rooms")
    .insert([{
      code: roomCode,

      phase: "waiting_player2",

      player1_name: name,
      player2_name: "",

      player1_answers: [],
      player2_answers: [],

      player1_guesses: [],
      player2_guesses: [],

      player1_ready: false,
      player2_ready: false,

      player1_guess_ready: false,
      player2_guess_ready: false,

      phase_started_at: new Date().toISOString()
    }])

  if(error){
    console.error(error)
    alert(error.message)
    return
  }

  subscribeRoom(roomCode)

  document.getElementById("roomCode").innerText = roomCode

  show("waiting")
}

// ======================================
// ENTRAR NA SALA
// ======================================

async function joinRoom(){

  play(clickSound)

  const name = document.getElementById("playerName").value.trim()

  roomCode = document
    .getElementById("roomInput")
    .value
    .trim()
    .toUpperCase()

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
      phase: "answers",
      phase_started_at: new Date().toISOString()
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
    .channel(`room-${code}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rooms",
        filter: `code=eq.${code}`
      },
      (payload)=>{

        const data = payload.new

        if(!data) return

        currentRoom = data

        handleRoom(data)
      }
    )
    .subscribe()
}

// ======================================
// FLUXO
// ======================================

function handleRoom(data){

  clearInterval(timer)

  if(data.phase === "waiting_player2"){

    show("waiting")

    return
  }

  if(data.phase === "answers"){

    show("questionsScreen")

    document.getElementById("phaseTitle").innerText =
      "📝 Responda sobre você"

    renderQuestions()

    startTimer(data.phase_started_at)

    return
  }

  if(data.phase === "guessing"){

    show("questionsScreen")

    document.getElementById("phaseTitle").innerText =
      "🎯 Adivinhe o outro jogador"

    renderQuestions()

    startTimer(data.phase_started_at)

    return
  }

  if(data.phase === "finished"){

    showResult(data)
  }
}

// ======================================
// RENDER
// ======================================

function renderQuestions(){

  const container = document.getElementById("questions")

  container.innerHTML = ""

  questions.forEach((q,i)=>{

    container.innerHTML += `
      <div class="question">
        <label for="q${i}">
          ${q}
        </label>

        <input
          id="q${i}"
          type="text"
          autocomplete="off"
          aria-label="${q}"
        >
      </div>
    `
  })
}

// ======================================
// TIMER
// ======================================

function startTimer(startedAt){

  clearInterval(timer)

  timer = setInterval(()=>{

    const start = new Date(startedAt).getTime()

    const now = Date.now()

    const diff = Math.floor((now - start) / 1000)

    let left = 120 - diff

    if(left < 0){
      left = 0
    }

    const m = Math.floor(left / 60)
    const s = left % 60

    const el = document.getElementById("timer")

    if(el){

      el.innerText =
        `⏱️ ${m}:${s < 10 ? "0" : ""}${s}`

      el.classList.remove("warning","danger")

      if(left <= 30){
        el.classList.add("warning")
      }

      if(left <= 10){
        el.classList.add("danger")
      }
    }

    if(left <= 0){

      clearInterval(timer)

      autoSubmit()
    }

  },1000)
}

// ======================================
// AUTO ENVIAR
// ======================================

function autoSubmit(){

  if(isSaving) return

  saveAnswers()
}

// ======================================
// SALVAR
// ======================================

async function saveAnswers(){

  if(isSaving) return

  isSaving = true

  play(successSound)

  try{

    const answers = questions.map((_,i)=>
      document.getElementById(`q${i}`)?.value || ""
    )

    const { data } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", roomCode)
      .single()

    if(!data){
      alert("Sala inválida")
      return
    }

    // ======================================
    // FASE RESPOSTAS
    // ======================================

    if(data.phase === "answers"){

      if(playerId === "player1"){

        await supabase
          .from("rooms")
          .update({
            player1_answers: answers,
            player1_ready: true
          })
          .eq("code", roomCode)
      }

      if(playerId === "player2"){

        await supabase
          .from("rooms")
          .update({
            player2_answers: answers,
            player2_ready: true
          })
          .eq("code", roomCode)
      }

      // pega atualizado

      const { data: updated } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode)
        .single()

      if(
        updated.player1_ready &&
        updated.player2_ready
      ){

        await supabase
          .from("rooms")
          .update({
            phase: "guessing",

            phase_started_at:
              new Date().toISOString()
          })
          .eq("code", roomCode)
      }

      else{

        show("waiting")
      }
    }

    // ======================================
    // FASE PALPITES
    // ======================================

    else if(data.phase === "guessing"){

      if(playerId === "player1"){

        await supabase
          .from("rooms")
          .update({
            player1_guesses: answers,
            player1_guess_ready: true
          })
          .eq("code", roomCode)
      }

      if(playerId === "player2"){

        await supabase
          .from("rooms")
          .update({
            player2_guesses: answers,
            player2_guess_ready: true
          })
          .eq("code", roomCode)
      }

      const { data: updated } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", roomCode)
        .single()

      if(
        updated.player1_guess_ready &&
        updated.player2_guess_ready
      ){

        await supabase
          .from("rooms")
          .update({
            phase: "finished"
          })
          .eq("code", roomCode)
      }

      else{

        show("waiting")
      }
    }

  }catch(err){

    console.error(err)

    alert("Erro ao salvar")

  }finally{

    isSaving = false
  }
}

// ======================================
// RESULTADO
// ======================================

function showResult(data){

  clearInterval(timer)

  play(winSound)

  show("resultScreen")

  const normalize = text =>
    (text || "")
      .toLowerCase()
      .trim()

  let p1 = 0
  let p2 = 0

  data.player1_guesses.forEach((g,i)=>{

    if(
      normalize(g) ===
      normalize(data.player2_answers[i])
    ){
      p1 += 10
    }
  })

  data.player2_guesses.forEach((g,i)=>{

    if(
      normalize(g) ===
      normalize(data.player1_answers[i])
    ){
      p2 += 10
    }
  })

  let winner = "Empate"

  if(p1 > p2){
    winner = data.player1_name
  }

  if(p2 > p1){
    winner = data.player2_name
  }

  let phrase = ""

  const total = p1 + p2

  if(total >= 140){

    phrase =
      "❤️ Vocês se conhecem MUITO bem!"
  }

  else if(total >= 80){

    phrase =
      "✨ Vocês têm uma conexão incrível!"
  }

  else{

    phrase =
      "😂 Acho que vocês precisam conversar mais!"
  }

  document.getElementById("score").innerHTML = `
    <h2>${winner}</h2>

    <p>
      ${data.player1_name}: ${p1} pontos
    </p>

    <p>
      ${data.player2_name}: ${p2} pontos
    </p>

    <br>

    <h3>${phrase}</h3>
  `
}

// ======================================
// HELPERS
// ======================================

function generateCode(){

  return Math
    .random()
    .toString(36)
    .substring(2,8)
    .toUpperCase()
}

function show(id){

  [
    "home",
    "waiting",
    "questionsScreen",
    "resultScreen"
  ].forEach(screen=>{

    document
      .getElementById(screen)
      .classList
      .add("hidden")
  })

  document
    .getElementById(id)
    .classList
    .remove("hidden")
}

// ======================================
// INIT
// ======================================

show("home")