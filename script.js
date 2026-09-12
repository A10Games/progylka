// ====== НАСТРОЙКИ (ЗАМЕНИ НА СВОИ) ======
const BOT_TOKEN = '8755713817:AAFpdsBdW4FS8aQmbV3e33VQiH8XxptqFA4'; // ← СЮДА ТОКЕН
const CHAT_ID = '1058076056'; // ← СЮДА ТВОЙ ID

// ====== СОСТОЯНИЕ ======
let selectedPlace = null;
let selectedCuisine = null;
let noBtnAttempts = 0;
const noBtnTexts = [
    'Нет', 'Точно нет?', 'Подумай ещё 🤔', 'Уверена?',
    'Последний шанс!', 'Не убежишь 😏', 'Кнопка сломалась'
];

// ====== ФОН: ПРИРОДНЫЕ ЭМОДЗИ ======
function createNatureBg() {
    const container = document.getElementById('natureBg');
    const emojis = ['🌿', '🌸', '🍃', '🦋', '🌻', '🌱', '🌼', '🍀', '🌷', '🐝'];
    setInterval(() => {
        const el = document.createElement('div');
        el.className = 'nature-item';
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.fontSize = (16 + Math.random() * 22) + 'px';
        el.style.animationDuration = (7 + Math.random() * 7) + 's';
        container.appendChild(el);
        setTimeout(() => el.remove(), 15000);
    }, 800);
}
createNatureBg();

// ====== ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ ======
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    target.classList.add('active');
    target.scrollTop = 0;
}

// ====== КНОПКА "НЕТ" УБЕГАЕТ ======
const btnNo = document.getElementById('btnNo');
const btnYes = document.getElementById('btnYes');

function moveNoButton() {
    const card = btnNo.closest('.card');
    const cardRect = card.getBoundingClientRect();
    const btnRect = btnNo.getBoundingClientRect();

    // Сколько места есть внутри карточки (с отступом 8px от краёв)
    const padding = 8;
    const maxX = Math.max(cardRect.width - btnRect.width - padding * 2, 60);
    const maxY = 140;

    // Случайное смещение в пределах доступного места (центрированное)
    const randomX = (Math.random() - 0.5) * maxX;
    const randomY = (Math.random() - 0.5) * maxY;

    btnNo.style.transform = `translate(${randomX}px, ${randomY}px)`;

    if (noBtnAttempts < noBtnTexts.length - 1) noBtnAttempts++;
    btnNo.textContent = noBtnTexts[noBtnAttempts];

    const scale = 1 + noBtnAttempts * 0.08;
    btnYes.style.transform = `scale(${scale})`;
}

btnNo.addEventListener('mouseover', moveNoButton);
btnNo.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveNoButton();
}, { passive: false });
btnNo.addEventListener('click', (e) => {
    e.preventDefault();
    moveNoButton();
});

// ====== КНОПКА "ДА" ======
btnYes.addEventListener('click', () => showScreen('screen2'));

// ====== ВЫБОР МЕСТА ======
document.querySelectorAll('.option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedPlace = opt.dataset.value;
        document.getElementById('btnNextPlace').disabled = false;
    });
});

document.getElementById('btnNextPlace').addEventListener('click', () => {
    if (selectedPlace === '🍽 Ресторан') {
        showScreen('screenCuisine');
    } else {
        showScreen('screen3');
    }
});

// ====== ВЫБОР КУХНИ (только ресторан) ======
document.querySelectorAll('#cuisinePills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('#cuisinePills .pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        selectedCuisine = pill.dataset.value;
        document.getElementById('btnNextCuisine').disabled = false;
    });
});

document.getElementById('btnNextCuisine').addEventListener('click', () => {
    showScreen('screen3');
});

// ====== ДАТА И ВРЕМЯ ======
const inputDate = document.getElementById('inputDate');
const inputTime = document.getElementById('inputTime');
const btnSend = document.getElementById('btnSend');

// Минимальная дата — сегодня
const today = new Date().toISOString().split('T')[0];
inputDate.min = today;

function checkDateTime() {
    btnSend.disabled = !(inputDate.value && inputTime.value);
}
inputDate.addEventListener('change', checkDateTime);
inputTime.addEventListener('change', checkDateTime);

// ====== ОТПРАВКА В TELEGRAM ======
btnSend.addEventListener('click', async () => {
    const date = inputDate.value;
    const time = inputTime.value;
    if (!date || !time || !selectedPlace) return;

    const [year, month, day] = date.split('-');
    const months = ['января','февраля','марта','апреля','мая','июня',
                    'июля','августа','сентября','октября','ноября','декабря'];
    const dateFormatted = `${parseInt(day)} ${months[parseInt(month)-1]} ${year}`;

    // Кухня — только для ресторана
    const cuisineText = (selectedPlace === '🍽 Ресторан' && selectedCuisine)
        ? `\n🍜 *Кухня:* ${selectedCuisine}`
        : '';

    const message =
`🌿 *ОНА СОГЛАСИЛАСЬ!* 🌿

📍 *Место:* ${selectedPlace}${cuisineText}
📅 *Дата:* ${dateFormatted}
⏰ *Время:* ${time}

_Открытка сработала 🎉_`;

    btnSend.disabled = true;
    btnSend.textContent = 'Отправляю...';

    try {
        const url = `https://telegram-prox.lechbogdan000.workers.dev/`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();

        if (data.ok) {
            showScreen('screen4');
        } else {
            console.error('Telegram error:', data);
            alert('Ошибка отправки. Проверь токен и chat_id.');
            btnSend.disabled = false;
            btnSend.textContent = 'Отправить';
        }
    } catch (err) {
        console.error(err);
        alert('Нет связи. Попробуй ещё раз.');
        btnSend.disabled = false;
        btnSend.textContent = 'Отправить';
    }
});
