fetch("http://localhost:3000/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: "admin",
    password: "1234"
  })
})
.then(res => res.json())
.then(data => console.log(data));