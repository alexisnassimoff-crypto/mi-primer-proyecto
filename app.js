// State
let currentBook = "bereshit";
let currentParashaIndex = 0;
let currentTab = "text";

// DOM Elements
const parashaMenu = document.getElementById("parasha-menu");
const welcomeScreen = document.getElementById("welcome-screen");
const parashaContent = document.getElementById("parasha-content");
const parashaTitle = document.getElementById("parasha-title");
const parashaRef = document.getElementById("parasha-ref");
const parashaSummary = document.getElementById("parasha-summary");
const biblicalText = document.getElementById("biblical-text");
const rashiText = document.getElementById("rashi-text");
const rambanText = document.getElementById("ramban-text");
const ibnEzraText = document.getElementById("ibn-ezra-text");
const sfornoText = document.getElementById("sforno-text");
const allCommentaries = document.getElementById("all-commentaries");
const prevBtn = document.getElementById("prev-parasha");
const nextBtn = document.getElementById("next-parasha");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    setupBookNavigation();
    loadParashaMenu(currentBook);
});

// Book navigation
function setupBookNavigation() {
    const navBtns = document.querySelectorAll("#main-nav .nav-btn");
    navBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            navBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentBook = btn.dataset.book;
            currentParashaIndex = 0;
            loadParashaMenu(currentBook);
            showWelcome();
        });
    });
}

// Load parasha sidebar
function loadParashaMenu(bookId) {
    const book = torahData[bookId];
    parashaMenu.innerHTML = "";
    book.parashot.forEach((parasha, index) => {
        const li = document.createElement("li");
        li.textContent = `${parasha.name} (${parasha.nameHe})`;
        li.addEventListener("click", () => {
            currentParashaIndex = index;
            loadParasha(bookId, index);
            document.querySelectorAll("#parasha-menu li").forEach(l => l.classList.remove("active"));
            li.classList.add("active");
        });
        parashaMenu.appendChild(li);
    });
}

// Show welcome screen
function showWelcome() {
    welcomeScreen.style.display = "block";
    parashaContent.classList.add("hidden");
}

// Load parasha content
function loadParasha(bookId, index) {
    const book = torahData[bookId];
    const parasha = book.parashot[index];

    welcomeScreen.style.display = "none";
    parashaContent.classList.remove("hidden");

    parashaTitle.textContent = `${parasha.name} — ${parasha.nameHe}`;
    parashaRef.textContent = parasha.ref;
    parashaSummary.textContent = parasha.summary;

    // Biblical text
    biblicalText.innerHTML = parasha.verses
        .map(v => `<div class="verse"><span class="verse-num">${v.num}</span>${v.text}</div>`)
        .join("");

    // Commentaries
    renderCommentary(rashiText, parasha.rashi, "peshat");
    renderCommentary(rambanText, parasha.ramban, "kabbalistic");
    renderCommentary(ibnEzraText, parasha.ibnEzra, "grammatical");
    renderCommentary(sfornoText, parasha.sforno, "ethical");

    // All commentaries view
    renderAllCommentaries(parasha);

    // Navigation buttons
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === book.parashot.length - 1;

    // Reset to text tab
    switchTab("text");
    updateTabButtons("text");

    // Scroll to top of content
    parashaContent.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Render commentary
function renderCommentary(container, comments, cssClass) {
    if (!comments || comments.length === 0) {
        container.innerHTML = '<p class="no-commentary">No hay comentario disponible para esta parashá.</p>';
        return;
    }
    container.innerHTML = comments
        .map(c => `
            <div class="comment-block ${cssClass}">
                <span class="verse-ref">${c.verseRef}</span>
                ${c.text}
            </div>
        `).join("");
}

// Render all commentaries together
function renderAllCommentaries(parasha) {
    const sections = [
        { title: "Rashi", data: parasha.rashi, badge: "peshat", label: "Peshat" },
        { title: "Rambán", data: parasha.ramban, badge: "kabbalistic", label: "Kabalístico" },
        { title: "Ibn Ezra", data: parasha.ibnEzra, badge: "grammatical", label: "Gramatical" },
        { title: "Sforno", data: parasha.sforno, badge: "ethical", label: "Ético" }
    ];

    allCommentaries.innerHTML = sections
        .filter(s => s.data && s.data.length > 0)
        .map(s => `
            <div class="all-commentary-section">
                <h3>${s.title} <span class="commentary-badge ${s.badge}">${s.label}</span></h3>
                ${s.data.map(c => `
                    <div class="comment-block ${s.badge}">
                        <span class="verse-ref">${c.verseRef}</span>
                        ${c.text}
                    </div>
                `).join("")}
            </div>
        `).join("");
}

// Tab switching
function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
    });
    document.getElementById(`tab-${tabId}`).classList.add("active");
}

function updateTabButtons(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.tab === tabId) {
            btn.classList.add("active");
        }
    });
}

// Tab click handlers
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;
        switchTab(tabId);
        updateTabButtons(tabId);
    });
});

// Parasha navigation
prevBtn.addEventListener("click", () => {
    if (currentParashaIndex > 0) {
        currentParashaIndex--;
        loadParasha(currentBook, currentParashaIndex);
        updateMenuSelection();
    }
});

nextBtn.addEventListener("click", () => {
    const book = torahData[currentBook];
    if (currentParashaIndex < book.parashot.length - 1) {
        currentParashaIndex++;
        loadParasha(currentBook, currentParashaIndex);
        updateMenuSelection();
    }
});

function updateMenuSelection() {
    const items = document.querySelectorAll("#parasha-menu li");
    items.forEach((li, i) => {
        li.classList.toggle("active", i === currentParashaIndex);
    });
}
