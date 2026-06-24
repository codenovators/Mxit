const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login.html";
}

const currentUser = JSON.parse(localStorage.getItem("user"));

const socket = io({
  auth: {
    token,
  },
});

const form = document.getElementById("chatForm");

const input = document.getElementById("message");

const messages = document.getElementById("messages");

const usersList = document.getElementById("users");

let selectedUser = null;

// ------------------
// Load Users
// ------------------

async function loadUsers() {
  const response = await fetch("/users");

  const users = await response.json();

  usersList.innerHTML = "";

  users.forEach((user) => {
    if (user._id === currentUser.id) return;

    const li = document.createElement("li");

    li.textContent = user.username;

    li.style.cursor = "pointer";

    li.addEventListener("click", () => {
      selectedUser = user._id;

      loadConversation(user._id);
    });

    usersList.appendChild(li);
  });
}

// ------------------
// Load Conversation
// ------------------

async function loadConversation(otherUserId) {
  messages.innerHTML = "";

  const response = await fetch(`/messages/${currentUser.id}/${otherUserId}`);

  const conversation = await response.json();

  conversation.forEach((msg) => {
    addMessage(msg);
  });
}

// ------------------
// Display Message
// ------------------

function addMessage(data) {
  const li = document.createElement("li");

  li.innerHTML = `
    <strong>
      ${data.senderName || data.username || "User"}
    </strong>
    :
    ${data.message}
  `;

  messages.appendChild(li);

  messages.scrollTop = messages.scrollHeight;
}

// ------------------
// Send Message
// ------------------

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const message = input.value.trim();

  if (!message) return;

  if (!selectedUser) {
    alert("Select a user first");

    return;
  }

  socket.emit("private-message", {
    receiverId: selectedUser,
    message,
  });

  input.value = "";
});

// ------------------
// Receive Message
// ------------------

socket.on("private-message", (data) => {
  addMessage(data);
});

// Initial Load

loadUsers();
