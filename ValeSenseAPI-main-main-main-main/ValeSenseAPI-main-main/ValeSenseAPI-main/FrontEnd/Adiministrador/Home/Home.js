const sections = document.querySelectorAll('.page-section');
const navItems = document.querySelectorAll('#scrollNav .nav-item[data-section]');
const api = window.ValeSenseApi;

function ativarNav(sectionId) {
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.section === sectionId);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) ativarNav(entry.target.id);
    });
  },
  { rootMargin: '-96px 0px -60% 0px', threshold: 0 }
);

sections.forEach((section) => observer.observe(section));

navItems.forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById(item.dataset.section).scrollIntoView({ behavior: 'smooth' });
  });
});

document.getElementById('scrollTopBtn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const nomesPerfis = {
  ADMIN: 'Administrador',
  ANALISTA: 'Analista de dados',
  PRODUTOR_EXPORTADOR: 'Produtor/exportador'
};
const statusLabel = (status) => status === 'ACTIVE' ? 'Ativo' : 'Inativo';

function criarCelula(texto) {
  const cell = document.createElement('td');
  cell.textContent = texto;
  return cell;
}

function mostrarMensagemNaTabela(tbody, colunas, texto) {
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = colunas;
  cell.textContent = texto;
  row.append(cell);
  tbody.replaceChildren(row);
}

async function carregarUsuarios() {
  const tbody = document.getElementById('userTableBody');
  try {
    const { data: usuarios } = await api.request('users');
    tbody.replaceChildren();
    usuarios.forEach((usuario) => {
      const row = document.createElement('tr');
      row.dataset.userId = usuario.id;
      row.append(criarCelula(usuario.name), criarCelula(nomesPerfis[usuario.role] || usuario.role));
      const statusCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${usuario.status === 'ACTIVE' ? 'ok' : 'inactive'}`;
      badge.textContent = statusLabel(usuario.status);
      statusCell.append(badge);
      const actions = document.createElement('td');
      actions.className = 'actions-cell';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-outline';
      button.dataset.userStatus = usuario.status;
      button.dataset.userId = usuario.id;
      button.textContent = usuario.status === 'ACTIVE' ? 'Inativar' : 'Ativar';
      actions.append(button);
      row.append(statusCell, actions);
      tbody.append(row);
    });
    if (!usuarios.length) mostrarMensagemNaTabela(tbody, 4, 'Nenhum usuário cadastrado.');
  } catch (error) {
    console.error('Falha ao carregar usuários:', error);
    mostrarMensagemNaTabela(tbody, 4, error.message || 'Não foi possível carregar os usuários.');
  }
}

async function carregarSensores() {
  const sensorList = document.getElementById('sensorList');
  try {
    const { data: sensores } = await api.request('sensors');
    sensorList.replaceChildren();
    sensores.forEach((sensor) => {
      const bloco = document.createElement('div');
      bloco.className = 'sensor-block';
      bloco.dataset.sensor = sensor.id;
      const nome = document.createElement('p');
      nome.className = 'sensor-name';
      nome.textContent = `${sensor.identificador} · ${sensor.talhao.nome}`;
      const row = document.createElement('div');
      row.className = 'sensor-row';
      const status = document.createElement('div');
      status.className = `sensor-status ${sensor.status === 'ATIVO' ? 'ok' : 'danger'}`;
      const detail = document.createElement('span');
      detail.textContent = sensor.status === 'ATIVO'
        ? 'Ativo e disponível para registrar leituras'
        : sensor.status === 'MANUTENCAO' ? 'Em manutenção' : 'Inativo';
      status.append(detail);
      const label = document.createElement('label');
      label.className = 'toggle';
      label.setAttribute('aria-label', `Ativar ou desativar ${sensor.identificador}`);
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = sensor.status === 'ATIVO';
      checkbox.dataset.sensorToggle = sensor.id;
      checkbox.dataset.previousStatus = sensor.status;
      const track = document.createElement('span');
      track.className = 'toggle-track';
      track.innerHTML = '<span class="toggle-thumb"></span>';
      label.append(checkbox, track);
      row.append(status, label);
      bloco.append(nome, row);
      sensorList.append(bloco);
    });
    if (!sensores.length) sensorList.textContent = 'Nenhum sensor cadastrado no banco.';
  } catch (error) {
    console.error('Falha ao carregar sensores:', error);
    sensorList.textContent = error.message || 'Não foi possível carregar os sensores.';
  }
}

async function carregarRegistros() {
  const body = document.getElementById('accessLogBody');
  const alerta = document.getElementById('loginAlert');
  const alertaVazio = document.getElementById('loginAlertEmpty');
  try {
    const { data: logs } = await api.request('users/access-logs');
    body.replaceChildren();
    const falhasLogin = logs.filter((log) => log.action === 'LOGIN' && log.result === 'FALHA');
    alerta.hidden = falhasLogin.length === 0;
    alerta.style.display = falhasLogin.length ? 'flex' : 'none';
    alertaVazio.hidden = falhasLogin.length !== 0;
    alertaVazio.style.display = falhasLogin.length ? 'none' : 'block';
    if (falhasLogin.length) {
      document.getElementById('loginAlertTitle').textContent = `${falhasLogin.length} tentativas de login falhas`;
      document.getElementById('loginAlertSub').textContent = `Última ocorrência: ${new Date(falhasLogin[0].timestamp).toLocaleString('pt-BR')}`;
    }

    logs.forEach((log) => {
      const categoria = log.action === 'SENSOR' ? 'sensor'
        : log.result === 'FALHA' ? 'seguranca' : 'usuario';
      const nomeCategoria = categoria === 'sensor' ? 'Sensores'
        : categoria === 'seguranca' ? 'Segurança' : 'Usuários';
      const descricao = log.action === 'LOGIN' ? (log.result === 'SUCESSO' ? 'Login realizado' : 'Login falho')
        : log.action === 'CADASTRO' ? 'Cadastro de usuário'
          : log.action === 'SENSOR' ? 'Alteração de sensor' : log.action;
      const row = document.createElement('tr');
      row.dataset.categoria = categoria;
      row.append(
        criarCelula(new Date(log.timestamp).toLocaleString('pt-BR')),
        criarCelula(log.user),
        criarCelula(descricao),
        criarCelula(log.email || log.ip || '—'),
        criarCelula(log.result === 'FALHA' ? 'Operação não concluída' : 'Operação concluída')
      );
      const categoryCell = document.createElement('td');
      const tag = document.createElement('span');
      tag.className = `tag ${categoria}`;
      tag.textContent = nomeCategoria;
      categoryCell.append(tag);
      row.append(categoryCell);
      body.append(row);
    });
    if (!logs.length) mostrarMensagemNaTabela(body, 6, 'Nenhum registro de acesso no banco.');
    aplicarFiltroRegistros();
  } catch (error) {
    console.error('Falha ao carregar registros de acesso:', error);
    mostrarMensagemNaTabela(body, 6, error.message || 'Não foi possível carregar os registros.');
    alerta.hidden = true;
    alerta.style.display = 'none';
    alertaVazio.textContent = error.message || 'Não foi possível carregar os alertas.';
  }
}

document.getElementById('addUserBtn').addEventListener('click', async () => {
  const name = window.prompt('Nome do novo usuário:');
  if (name === null) return;
  const email = window.prompt('E-mail do novo usuário:');
  if (email === null) return;
  const password = window.prompt('Senha temporária (mínimo de 8 caracteres):');
  if (password === null) return;
  const perfil = window.prompt('Perfil: ADMIN, ANALISTA ou PRODUTOR_EXPORTADOR', 'ANALISTA');
  if (perfil === null) return;
  const role = perfil.trim().toUpperCase();
  if (!Object.hasOwn(nomesPerfis, role)) {
    window.alert('Perfil inválido.');
    return;
  }
  try {
    await api.request('users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    await carregarUsuarios();
  } catch (error) {
    window.alert(error.message || 'Não foi possível cadastrar o usuário.');
  }
});

document.getElementById('userTableBody').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-user-status]');
  if (!button) return;
  const novoStatus = button.dataset.userStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  try {
    await api.request(`users/${button.dataset.userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: novoStatus })
    });
    await carregarUsuarios();
  } catch (error) {
    window.alert(error.message || 'Não foi possível alterar o status do usuário.');
  }
});

document.getElementById('sensorList').addEventListener('change', async (event) => {
  const toggle = event.target.closest('[data-sensor-toggle]');
  if (!toggle) return;
  const oldStatus = toggle.dataset.previousStatus;
  const status = toggle.checked ? 'ATIVO' : 'INATIVO';
  toggle.disabled = true;
  try {
    const { sensor } = await api.request(`sensors/${toggle.dataset.sensorToggle}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    toggle.dataset.previousStatus = sensor.status;
    await carregarSensores();
  } catch (error) {
    toggle.checked = oldStatus === 'ATIVO';
    window.alert(error.message || 'Não foi possível atualizar o sensor.');
  } finally {
    toggle.disabled = false;
  }
});

document.getElementById('addSensorBtn').addEventListener('click', async () => {
  try {
    const { data: talhoes } = await api.request('sensors/plots');
    if (!talhoes.length) {
      window.alert('Cadastre uma propriedade e um talhão no banco antes de adicionar sensores.');
      return;
    }
    const opcoes = talhoes.map((talhao) => `${talhao.nome} (${talhao.propriedade.nome}) — ${talhao.id}`).join('\n');
    const talhaoId = window.prompt(`Informe o ID do talhão:\n${opcoes}`);
    if (talhaoId === null) return;
    const identificador = window.prompt('Identificador do sensor:');
    if (identificador === null) return;
    const canalThingSpeak = window.prompt('Canal ThingSpeak (opcional):');
    if (canalThingSpeak === null) return;
    await api.request('sensors', {
      method: 'POST',
      body: JSON.stringify({ talhaoId: talhaoId.trim(), identificador, canalThingSpeak })
    });
    await carregarSensores();
  } catch (error) {
    window.alert(error.message || 'Não foi possível cadastrar o sensor.');
  }
});

const filtroAcao = document.getElementById('filtroAcao');
const filtroData = document.getElementById('filtroData');

function aplicarFiltroRegistros() {
  document.querySelectorAll('#tabelaRegistros tbody tr[data-categoria]').forEach((linha) => {
    const bateCategoria = filtroAcao.value === 'todas' || linha.dataset.categoria === filtroAcao.value;
    const dataFiltro = filtroData.value;
    const bateData = !dataFiltro || linha.cells[0].textContent.slice(0, 10).split('/').reverse().join('-') === dataFiltro;
    linha.classList.toggle('hidden-row', !bateCategoria || !bateData);
  });
}

filtroAcao.addEventListener('change', aplicarFiltroRegistros);
filtroData.addEventListener('change', aplicarFiltroRegistros);

document.getElementById('exportRegistrosBtn').addEventListener('click', () => {
  const cabecalho = ['Data/Hora', 'Usuário', 'Ação', 'Alvo', 'Detalhes', 'Categoria'];
  const rows = Array.from(document.querySelectorAll('#tabelaRegistros tbody tr[data-categoria]'))
    .filter((row) => !row.classList.contains('hidden-row'));
  const csv = [cabecalho, ...rows.map((row) => Array.from(row.cells, (cell) => cell.textContent.trim()))]
    .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'registros_valesense.csv';
  link.click();
  URL.revokeObjectURL(url);
});

carregarUsuarios();
carregarSensores();
carregarRegistros();
