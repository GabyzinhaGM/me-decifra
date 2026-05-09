const SUPABASE_URL =
  "https://zeqmqluqccawgawsbcpc.supabase.co"

const SUPABASE_KEY =
  "sb_publishable_qu5Ut2JmpKFecim5QqIz5g_GBYJLq-N"

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
)

const questions = [

  "Qual é minha comida favorita?",

  "Qual é meu maior medo?",

  "Qual é meu maior sonho?",

  "O que eu mais gosto em mim?",

  "O que eu menos gosto em mim?",

  "Qual é meu time de futebol favorito?",

  "Qual é minha série ou novela favorita?",

  "O que eu mais admiro em você?",

  "Qual país eu gostaria de visitar?",

  "Qual é meu hobby favorito?",

  "Qual animal de estimação eu mais gosto?",

  "Do que eu mais tenho pavor?",

  "Qual número de sapato eu uso?",

  "Qual historinha infantil eu mais gostei?",

  "Qual é minha cor favorita?",

  "Qual é meu cantor ou banda favorita?",

  "Qual é meu maior defeito?",

  "Qual é minha maior qualidade?",

  "Qual é minha bebida favorita?",

  "Qual é minha estação do ano favorita?",

  "Qual é meu filme favorito?",

  "Qual é meu doce favorito?",

  "Qual é meu prato favorito?",

  "Qual aplicativo eu mais uso?",

  "Qual foi meu maior trauma de infância?",

  "Qual é meu maior objetivo atualmente?",

  "Qual é minha rede social favorita?",

  "Qual é meu estilo musical favorito?",

  "Qual é meu maior vício?",

  "O que mais me irrita nas pessoas?",

  "Qual é meu lugar favorito?",

  "Qual é minha memória favorita?",

  "Qual é meu cheiro favorito?",

  "Qual é meu maior arrependimento?",

  "Qual é meu signo?",

  "Qual era minha matéria favorita na escola?",

  "Qual é meu maior medo em relacionamento?",

  "Qual emoji eu mais uso?",

  "Qual é minha mania mais estranha?",

  "Qual é meu fast food favorito?"

]

let roomCode = ""

let myAnswers = []

function generateCode(){

  return Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()
}

async function createRoom(){

  roomCode = generateCode()

  const { error } = await supabase
    .from("rooms")
    .insert([
      {
        code: roomCode,
        player1_answers: [],
        player2_answers: [],
        status: "waiting"
      }
    ])

  if(error){

    console.log(error)

    alert("Erro ao criar sala")

    return
  }

  document
    .getElementById("home")
    .classList.add("hidden")

  document
    .getElementById("waiting")
    .classList.remove("hidden")

  document
    .getElementById("roomCode")
    .innerText = roomCode
}

async function joinRoom(){

  roomCode = document
    .getElementById("roomInput")
    .value
    .trim()
    .toUpperCase()

  if(!roomCode){

    alert("Digite o código da sala")

    return
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  if(error || !data){

    console.log(error)

    alert("Sala não encontrada")

    return
  }

  startQuestions()
}

function startQuestions(){

  document
    .getElementById("home")
    .classList.add("hidden")

  document
    .getElementById("waiting")
    .classList.add("hidden")

  document
    .getElementById("questionsScreen")
    .classList.remove("hidden")

  const container =
    document.getElementById("questions")

  container.innerHTML = ""

  questions.forEach((question, index)=>{

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
}

async function saveAnswers(){

  myAnswers = []

  questions.forEach((question, index)=>{

    const value = document
      .getElementById(`q${index}`)
      .value

    myAnswers.push(value)
  })

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  if(error){

    console.log(error)

    alert("Erro ao buscar sala")

    return
  }

  let updateData = {}

  if(
    !data.player1_answers ||
    data.player1_answers.length === 0
  ){

    updateData = {

      player1_answers: myAnswers,

      status: "player1_finished"
    }

  }else{

    updateData = {

      player2_answers: myAnswers,

      status: "completed"
    }
  }

  const { error: updateError } =
    await supabase
      .from("rooms")
      .update(updateData)
      .eq("code", roomCode)

  if(updateError){

    console.log(updateError)

    alert("Erro ao salvar respostas")

    return
  }

  alert("Respostas salvas com sucesso!")

  showResult()
}

async function showResult(){

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode)
    .single()

  if(error){

    console.log(error)

    alert("Erro ao carregar resultados")

    return
  }

  document
    .getElementById("questionsScreen")
    .classList.add("hidden")

  document
    .getElementById("resultScreen")
    .classList.remove("hidden")

  const player1 =
    data.player1_answers || []

  const player2 =
    data.player2_answers || []

  let matches = 0

  player1.forEach((answer, index)=>{

    if(

      player2[index] &&

      answer
        .toLowerCase()
        .trim() ===

      player2[index]
        .toLowerCase()
        .trim()

    ){
      matches++
    }
  })

  document
    .getElementById("score")
    .innerText =
      `${matches} respostas iguais`

  const answersContainer =
    document.getElementById("answers")

  answersContainer.innerHTML = ""

  questions.forEach((question, index)=>{

    answersContainer.innerHTML += `

      <div class="answer-card">

        <h3>
          ${question}
        </h3>

        <p>
          Jogador 1:
          <strong>
            ${player1[index] || "-"}
          </strong>
        </p>

        <p>
          Jogador 2:
          <strong>
            ${player2[index] || "-"}
          </strong>
        </p>

      </div>

    `
  })
}