function callApi(path, method, body) {
  return fetch(`/api${path}`, {
    method: method || "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).then((response) => response.json().then((data) => ({ response, data })));
}

function showError(text) {
  Swal.fire({ icon: "error", title: "Oops...", text });
}

function showSuccess(text) {
  return Swal.fire({ icon: "success", title: "Success", text });
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function getUser() {
  return callApi("/auth/me")
    .then(({ response, data }) => (response.status === 200 ? data.user : null))
    .catch(() => null);
}

function handleUnauthorized(response, data) {
  if (response.status === 401) {
    Swal.fire({ icon: "error", title: "Oops...", text: data.message }).then(() => {
      location.href = "login.html";
    });
    return true;
  }
  return false;
}

function handleLogout() {
  callApi("/auth/logout", "POST").finally(() => {
    location.href = "index.html";
  });
}

function renderNav(user) {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const home = `<button onclick="location.href='index.html'">CLASSES</button>`;

  if (!user) {
    nav.innerHTML = `${home}
      <button onclick="location.href='login.html'">LOGIN</button>
      <button onclick="location.href='register.html'">REGISTER</button>`;
    return;
  }

  let links = `${home}
    <button onclick="location.href='profile.html'">MY PROFILE</button>`;
  if (user.role === "admin") {
    links += `<button onclick="location.href='class-form.html'">ADD CLASS</button>
      <button onclick="location.href='expired.html'">EXPIRED MEMBERS</button>`;
  }
  links += `<button onclick="handleLogout()">LOGOUT</button>`;
  nav.innerHTML = links;

  const who = document.createElement("span");
  who.textContent = ` logged in as ${user.username} (${user.membershipTier}, ${user.membershipStatus})`;
  nav.appendChild(who);
}

function makeButton(label, onClick, disabled) {
  const button = document.createElement("button");
  button.textContent = label;
  button.onclick = onClick;
  if (disabled) button.disabled = true;
  return button;
}

function addCells(tr, values) {
  values.forEach((value) => {
    const td = document.createElement("td");
    td.textContent = value;
    tr.appendChild(td);
  });
}

function runAction(path, method, successText, after) {
  callApi(path, method)
    .then(({ response, data }) => {
      if (handleUnauthorized(response, data)) return;
      if (response.status === 200) {
        showSuccess(successText);
        after();
      } else {
        showError(data.message || "Something went wrong!");
      }
    })
    .catch((error) => {
      console.log(error);
      showError("could not reach the server!");
    });
}
