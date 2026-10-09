function setupLogoutButton() {
  const actions = document.querySelector(".topbar-actions, .pe-top-actions");
  if (!actions || actions.querySelector("[data-logout]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = actions.classList.contains("pe-top-actions")
    ? "pe-icon-button logout-action"
    : "icon-btn logout-action";
  button.style.color = document.documentElement.classList.contains("dark-theme") ? "#e59189" : "#a3433d";
  button.dataset.logout = "";
  button.title = "Sair da conta";
  button.setAttribute("aria-label", "Sair da conta");
  button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>';
  button.addEventListener("click", () => {
    sessionStorage.removeItem("valesense_token");
    sessionStorage.removeItem("valesense_user");
    localStorage.removeItem("valesense_token");
    localStorage.removeItem("valesense_user");
    window.location.replace(document.body.dataset.loginPath);
  });
  actions.append(button);
}

function protectPage(event) {
  const token = sessionStorage.getItem('valesense_token');
  const navigation = performance.getEntriesByType('navigation')[0];
  const returnedWithBrowserArrow = (navigation && navigation.type === 'back_forward') || event?.persisted;
  const loginPath = document.body.dataset.loginPath;

  if (!token || returnedWithBrowserArrow) {
    sessionStorage.removeItem('valesense_token');
    sessionStorage.removeItem('valesense_user');
    localStorage.removeItem('valesense_token');
    localStorage.removeItem('valesense_user');
    window.location.replace(loginPath);
  }
}

protectPage();
if (sessionStorage.getItem('valesense_token')) setupLogoutButton();
window.addEventListener('pageshow', (event) => protectPage(event));
