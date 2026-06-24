const form = document.getElementById("registerForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  const response = await fetch("/register", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const data = await response.json();

  if (data.success) {
    alert("Account Created");

    window.location.href = "/login.html";
  } else {
    alert(data.message);
  }
});
