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

  const { error } = await supabase.from("rooms").insert([{
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

  if(error){
    console.log("ERRO AO CRIAR SALA:", error)
    alert("Erro ao criar sala")
    return
  }

  console.log("SALA CRIADA:", roomCode)

  subscribeRoom(roomCode)
  show("waiting")

  document.getElementById("roomCode").innerText = roomCode
}