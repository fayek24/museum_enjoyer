// global μεταβλητές
let currentUser = null;
let currentNormalPrice = 0;
let currentStudentPrice = 0;
let isSpeaking = false;

// Έλέγχει αν ο χρήστης είναι συνδεδεμένος
window.onload = function() {
  fetch('ap_user.php')
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        currentUser = data.username;
        updateUIForLoggedInUser();
      }
    });
};

// 1. ΕΚΦΩΝΗΣΗ ΣΕΛΙΔΑΣ
function speakText() {
  const speechBtn = document.getElementById("floating-speech-btn");

  if (isSpeaking || window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    if (speechBtn) speechBtn.innerText = "🔊 Εκφώνηση Σελίδας";
    return;
  }

  if (!('speechSynthesis' in window)) {
    alert("Ο περιηγητής σας δεν υποστηρίζει την εκφώνηση κειμένου.");
    return;
  }

  let textToRead = "";
  const title = document.querySelector("h1");
  if (title) textToRead += title.innerText + ". ";

  const museumCards = document.querySelectorAll(".museum-card");
  museumCards.forEach(card => {
    const mTitle = card.querySelector("h2");
    const mCity = card.querySelector(".city-tag");
    const mInfo = card.querySelector(".info-box p");

    if (mTitle) textToRead += mTitle.innerText + ". ";
    if (mCity) textToRead += mCity.innerText + ". ";
    if (mInfo) textToRead += mInfo.innerText + ". ";
  });

  if (!textToRead.trim()) {
    alert("Δεν βρέθηκε διαθέσιμο κείμενο για εκφώνηση.");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = "el-GR";
  utterance.rate = 1;

  const voices = window.speechSynthesis.getVoices();

  utterance.onstart = function () {
    isSpeaking = true;
    if (speechBtn) speechBtn.innerText = "⏹️ Διακοπή Εκφώνησης";
  };
  utterance.onend = function () {
    isSpeaking = false;
    if (speechBtn) speechBtn.innerText = "🔊 Εκφώνηση Σελίδας";
  };
  utterance.onerror = function () {
    isSpeaking = false;
    if (speechBtn) speechBtn.innerText = "🔊 Εκφώνηση Σελίδας";
  };

  window.speechSynthesis.speak(utterance);
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}

// 2. ΕΜΦΑΝΙΣΗ / ΑΠΟΚΡΥΨΗ ΠΛΗΡΟΦΟΡΙΩΝ
function toggleInfo(infoId, priceId) {
  const infoBox = document.getElementById(infoId);
  const priceBox = document.getElementById(priceId);

  if (infoBox.classList.contains("hidden")) {
    infoBox.classList.remove("hidden");
    priceBox.classList.add("hidden");
  } else {
    infoBox.classList.add("hidden");
    priceBox.classList.remove("hidden");
  }
}

// 3. ΣΥΝΔΕΣΗ / ΕΓΓΡΑΦΗ / ΑΠΟΣΥΝΔΕΣΗ ΜΕ PHP & MYSQL
function openLoginModal() { document.getElementById("login-modal").style.display = "block"; }
function closeLoginModal() { document.getElementById("login-modal").style.display = "none"; }

function doLogin(e) {
  e.preventDefault();
  const username = document.getElementById("username-input").value.trim();
  const password = document.getElementById("password-input").value;

  if (password.length < 8) {
    alert("Ο κωδικός πρόσβασης πρέπει να έχει τουλάχιστον 8 χαρακτήρες!");
    return;
  }

  fetch('api_login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username, password: password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      alert(data.message);
      location.reload();
    } else {
      alert(data.message);
    }
  });
}

function updateUIForLoggedInUser() {
  const userInfo = document.getElementById("user-info");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const uploadBtn = document.getElementById("upload-btn");
  const myTicketsBtn = document.getElementById("my-tickets-btn");

  if (userInfo) userInfo.innerText = "Γεια σου, " + currentUser;
  if (loginBtn) loginBtn.classList.add("hidden");
  if (logoutBtn) logoutBtn.classList.remove("hidden");
  if (uploadBtn) uploadBtn.classList.remove("hidden");
  if (myTicketsBtn) myTicketsBtn.classList.remove("hidden");
}

function doLogout() {
  fetch('api_logout.php')
    .then(() => location.reload());
}

// 4. ΑΝΕΒΑΣΜΑ ΑΡΧΕΙΟΥ
function openUploadModal() { document.getElementById("upload-modal").style.display = "block"; }
function closeUploadModal() { document.getElementById("upload-modal").style.display = "none"; }

function doUpload(e) {
  e.preventDefault();
  const museum = document.getElementById("select-museum").value;
  const fileInput = document.getElementById("file-input");
  const altText = document.getElementById("alt-input").value;
  const grid = document.getElementById("grid-" + museum);

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const fileURL = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");

    const noPosts = grid.querySelector(".no-posts");
    if (noPosts) noPosts.remove();

    const item = document.createElement("div");
    item.className = "photo-item";

    if (isVideo) {
      item.innerHTML = `<video src="${fileURL}" controls></video><div class="photo-meta"><b>${currentUser}:</b>${altText}</div>`;
    } else {
      item.innerHTML = `<img src="${fileURL}" alt="${altText}"><div class="photo-meta"><b>${currentUser}:</b>${altText}</div>`;
    }

    grid.appendChild(item);
    closeUploadModal();
    document.getElementById("file-input").value = "";
    document.getElementById("alt-input").value = "";
  }
}

// 5. ΑΓΟΡΑ & ΔΙΑΧΕΙΡΙΣΗ ΕΙΣΙΤΗΡΙΩΝ
function openTicketModal(museumName, normalPrice, studentPrice) {
  if (!currentUser) {
    alert("Πρέπει να συνδεθείτε στον λογαριασμό σας για να αγοράσετε εισιτήριο!");
    openLoginModal();
    return;
  }

  currentNormalPrice = normalPrice;
  currentStudentPrice = studentPrice;

  document.getElementById("ticket-museum-title").innerText = "Αγορά Εισιτηρίου: " + museumName;
  document.getElementById("ticket-form").classList.remove("hidden");
  document.getElementById("ticket-receipt").classList.add("hidden");

  const today = new Date().toISOString().split('T')[0];
  document.getElementById("ticket-date").value = today;
  document.getElementById("ticket-quantity").value = 1;
  document.getElementById("ticket-type").value = "normal";

  calculateTotal();
  document.getElementById("ticket-modal").style.display = "block";
}

function closeTicketModal() { document.getElementById("ticket-modal").style.display = "none"; }

function calculateTotal() {
  const type = document.getElementById("ticket-type").value;
  const qty = parseInt(document.getElementById("ticket-quantity").value) || 1;
  const pricePerTicket = (type === "student") ? currentStudentPrice : currentNormalPrice;
  
  document.getElementById("total-price").innerText = pricePerTicket * qty;
}

function buyTicket(e) {
  e.preventDefault();
  
  const date = document.getElementById("ticket-date").value;
  const typeSelect = document.getElementById("ticket-type");
  const typeText = typeSelect.options[typeSelect.selectedIndex].text;
  const qty = document.getElementById("ticket-quantity").value;
  const total = document.getElementById("total-price").innerText;
  const title = document.getElementById("ticket-museum-title").innerText.replace("Αγορά Εισιτηρίου: ", "").trim();

  fetch('api_buy_ticket.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      museum: title,
      date: date,
      type: typeText,
      quantity: qty,
      totalPrice: total
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    if (data.status === "success") {
      document.getElementById("rec-museum").innerText = title;
      document.getElementById("rec-date").innerText = date;
      document.getElementById("rec-qty").innerText = qty;
      document.getElementById("rec-type").innerText = typeText;
      document.getElementById("rec-price").innerText = total;

      document.getElementById("ticket-form").classList.add("hidden");
      document.getElementById("ticket-receipt").classList.remove("hidden");
    }
  })
  .catch(err => {
    alert("Σφάλμα επικοινωνίας κατά την αγορά: " + err);
  });
}

function openMyTicketsModal() {
  const container = document.getElementById("tickets-list-container");
  container.innerHTML = "";

  fetch('api_get_tickets.php')
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        const userTickets = data.tickets;
        if (userTickets.length === 0) {
          container.innerHTML = "<p>Δεν έχετε αγοράσει ακόμα εισιτήρια.</p>";
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          userTickets.forEach(t => {
            const ticketDate = new Date(t.date);
            ticketDate.setHours(0, 0, 0, 0);

            const isExpired = ticketDate < today;

            const card = document.createElement("div");
            card.className = `ticket-card-item ${isExpired ? 'expired' : ''}`;
            
            card.innerHTML = `
              <h4>🏛️ ${t.museum}</h4>
              <p><b>Ημερομηνία:</b> ${t.date}</p>
              <p><b>Ποσότητα:</b> ${t.qty}x (${t.type})</p>
              <p><b>Σύνολο:</b> ${t.totalPrice}€</p>
              <span class="status-badge ${isExpired ? 'status-expired' : 'status-active'}">
                ${isExpired ? '❌ Ακυρώθηκε / Έληξε' : '✅ Σε Ισχύ'}
              </span>
            `;
            container.appendChild(card);
          });
        }
        document.getElementById("my-tickets-modal").style.display = "block";
      }
    });
}

function closeMyTicketsModal() {
  document.getElementById("my-tickets-modal").style.display = "none";
}

// 6. LIVE CHAT
function toggleChat() {
  document.getElementById("chat-box").classList.toggle("hidden");
}

function sendChatMessage() {
  const input = document.getElementById("chat-input");
  const msgText = input.value.trim();
  const messagesBox = document.getElementById("chat-messages");

  if (msgText !== "") {
    const sender = currentUser ? currentUser : "Επισκέπτης";
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg";
    msgDiv.innerHTML = `<b>${sender}:</b>${msgText}`;
    messagesBox.appendChild(msgDiv);
    input.value = "";
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }
}


// Εκτελείται αυτόματα μόλις φορτώσει η σελίδα
window.onload = function() {
  fetch('api_user.php')
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        currentUser = data.username;
        updateUIForLoggedInUser();
      }
    })
    .catch(err => console.error("Σφάλμα ελέγχου συνεδρίας:", err));
};

function handleChatKeyPress(e) {
  if (e.key === 'Enter') sendChatMessage();
}