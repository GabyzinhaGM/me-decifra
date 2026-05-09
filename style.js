*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Arial,sans-serif;
}

body{

  background:#0f172a;

  color:white;

  min-height:100vh;

  display:flex;

  justify-content:center;

  align-items:center;

  padding:20px;
}

.container{

  width:100%;

  max-width:700px;

  background:#1e293b;

  padding:30px;

  border-radius:24px;

  box-shadow:0 0 25px rgba(0,0,0,.4);

  animation:pop .5s ease;
}

.hidden{
  display:none;
}

.title{

  text-align:center;

  margin-bottom:10px;

  font-size:2.5rem;
}

.subtitle{

  text-align:center;

  margin-bottom:25px;

  color:#cbd5e1;
}

input,
select{

  width:100%;

  padding:14px;

  margin-top:12px;

  border:none;

  border-radius:12px;

  font-size:1rem;
}

button{

  width:100%;

  padding:15px;

  border:none;

  border-radius:14px;

  background:#7c3aed;

  color:white;

  font-size:1rem;

  margin-top:14px;

  cursor:pointer;

  transition:.2s;
}

button:hover{

  transform:scale(1.03);

  background:#6d28d9;
}

button:active{
  transform:scale(.97);
}

.question{

  margin-bottom:18px;

  animation:fade .3s ease;
}

.question label{

  display:block;

  margin-bottom:8px;

  font-weight:bold;
}

.room-code{

  background:#334155;

  padding:18px;

  border-radius:14px;

  text-align:center;

  font-size:2rem;

  margin-top:20px;

  letter-spacing:4px;

  animation:pulse 1.5s infinite;
}

.timer{

  text-align:center;

  font-size:2rem;

  margin-bottom:20px;

  color:#22c55e;
}

.answer-card{

  background:#334155;

  padding:16px;

  border-radius:14px;

  margin-top:15px;
}

.answer-card h3{
  margin-bottom:10px;
}

#score{

  text-align:center;

  margin-top:20px;
}

#score h2{

  margin-bottom:15px;

  color:#22c55e;
}

@keyframes fade{

  from{
    opacity:0;
    transform:translateY(10px);
  }

  to{
    opacity:1;
    transform:translateY(0);
  }
}

@keyframes pop{

  from{
    opacity:0;
    transform:scale(.95);
  }

  to{
    opacity:1;
    transform:scale(1);
  }
}

@keyframes pulse{

  0%{
    transform:scale(1);
  }

  50%{
    transform:scale(1.05);
  }

  100%{
    transform:scale(1);
  }
}