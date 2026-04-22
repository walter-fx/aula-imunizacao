window.addEventListener("DOMContentLoaded", () => {
    initClassClock();
    initDeck().catch((error) => {
        console.error(error);
        renderError(error.message || "Erro ao carregar slides.");
    });
});

async function initDeck() {
    const data = await loadJson("conteudo_apresentacao.json");
    const meta = data.meta || {};
    const slides = Array.isArray(data.slides) ? data.slides : [];

    if (!slides.length) {
        throw new Error("Nenhum slide encontrado em conteudo_apresentacao.json");
    }

    const deck = document.getElementById("deck");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const counter = document.getElementById("counter");
    const progress = document.getElementById("progress");
    const dotRail = document.getElementById("dotRail");

    deck.innerHTML = slides.map((slide, i) => renderSlide(slide, i, meta)).join("");
    dotRail.innerHTML = slides.map(() => "<button class=\"dot\" type=\"button\" aria-label=\"Ir para slide\"></button>").join("");

    const dots = Array.from(dotRail.querySelectorAll(".dot"));
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => goTo(index));
    });

    let current = 0;
    let wheelLock = false;

    function goTo(index) {
        current = clamp(index, 0, slides.length - 1);
        deck.style.transform = `translateY(-${current * 100}vh)`;

        Array.from(deck.querySelectorAll(".slide")).forEach((node, idx) => {
            node.classList.toggle("is-active", idx === current);
            node.classList.toggle("is-before", idx < current);
            node.classList.toggle("is-after", idx > current);
        });

        dots.forEach((dot, idx) => dot.classList.toggle("active", idx === current));

        counter.textContent = `${current + 1} / ${slides.length}`;
        progress.style.setProperty("--w", `${((current + 1) / slides.length) * 100}%`);
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current === slides.length - 1;
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    prevBtn.addEventListener("click", prev);
    nextBtn.addEventListener("click", next);

    window.addEventListener("keydown", (event) => {
        if (["ArrowRight"].includes(event.key)) {
            event.preventDefault();
            next();
        }
        if (["ArrowLeft"].includes(event.key)) {
            event.preventDefault();
            prev();
        }
    });

    window.addEventListener("wheel", (event) => {
        if (wheelLock || Math.abs(event.deltaY) < 24) {
            return;
        }

        wheelLock = true;
        event.deltaY > 0 ? next() : prev();

        setTimeout(() => {
            wheelLock = false;
        }, 450);
    }, { passive: true });

    let startY = 0;
    window.addEventListener("touchstart", (event) => {
        startY = event.changedTouches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchend", (event) => {
        const delta = startY - event.changedTouches[0].clientY;
        if (Math.abs(delta) < 45) {
            return;
        }
        delta > 0 ? next() : prev();
    }, { passive: true });

    bindQuizToggle();
    goTo(0);
}

async function loadJson(path) {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
        throw new Error(`Falha ao carregar ${path}`);
    }
    return response.json();
}

function renderSlide(slide, index, meta) {
    const layout = slide.layout || "split-cards";
    const titleTag = index === 0 ? "h1" : "h2";
    const bulletsHtml = renderBullets(slide.bullets);
    const chipsHtml = renderChips(slide.chips);
    const img = escapeHtml(slide.imagem || "");

    const header = `
        <p class="kicker">${escapeHtml(slide.kicker || meta.titulo || "Aula")}</p>
        <${titleTag}>${escapeHtml(slide.titulo || "")}</${titleTag}>
        <p class="subtitle">${escapeHtml(slide.subtitulo || "")}</p>
    `;

    let mainBody = `${bulletsHtml}${chipsHtml}`;
    let sideBody = renderImage(img, slide.titulo || "Slide");

    if (layout === "case-columns") {
        mainBody = `
            <div class="cases-grid">
                ${(slide.casos || []).map((c) => `
                    <article class="case-card">
                        <h3>${escapeHtml(c.titulo || "Caso")}</h3>
                        <p><strong>Situação:</strong> ${escapeHtml(c.situacao || "")}</p>
                        <p><strong>Conduta:</strong> ${escapeHtml(c.conduta || "")}</p>
                    </article>
                `).join("")}
            </div>
        `;
    }

    if (layout === "quiz-accordion") {
        mainBody = `
            <div class="quiz-list">
                ${(slide.questoes || []).map((q, idx) => `
                    <article class="quiz-item" data-quiz>
                        <button class="quiz-question" type="button" aria-expanded="false">
                            <span>${idx + 1}. ${escapeHtml(q.pergunta || "Pergunta")}</span>
                            <i class="fa-solid fa-chevron-down"></i>
                        </button>
                        <div class="quiz-answer">
                            <p>${escapeHtml(q.resposta || "Resposta não disponível")}</p>
                        </div>
                    </article>
                `).join("")}
            </div>
        `;
    }

    if (layout === "references-wall") {
        mainBody = `
            <div class="references-grid">
                ${(slide.referencias || []).map((r) => `<article class="ref-card">${escapeHtml(r)}</article>`).join("")}
            </div>
        `;
    }

    if (layout === "hero-wave") {
        sideBody = `
            <div class="hero-site-preview">
                <div class="hero-site-topbar">
                    <span class="browser-dot red"></span>
                    <span class="browser-dot yellow"></span>
                    <span class="browser-dot green"></span>
                    <span class="address-bar">imunizacao.aula/seguranca-vacinal</span>
                </div>
                <div class="hero-site-body">
                    <img src="${img}" alt="${escapeHtml(slide.titulo || "")}" loading="lazy" />
                    <div class="hero-site-overlay">
                        <span class="badge">Aula ao vivo</span>
                        <h3>Decisão clínica rápida</h3>
                        <p>Contraindicação, adiamento e EAPV no mesmo fluxo mental.</p>
                        <div class="cta-row">
                            <span class="mini-btn">Iniciar</span>
                            <span class="mini-btn alt">Ver casos</span>
                        </div>
                    </div>
                </div>
                <div class="pulse-ring ring-a"></div>
                <div class="pulse-ring ring-b"></div>
                <div class="pulse-ring ring-c"></div>
            </div>
        `;
        mainBody = `
            ${bulletsHtml}
            <div class="chips"><span class="chip">Carga horária: ${escapeHtml(meta.carga_horaria || "")}</span></div>
        `;
    }

    return `
        <section class="slide layout-${escapeHtml(layout)} ${index === 0 ? "is-active" : "is-after"}">
            <div class="slide-main">
                ${header}
                ${mainBody}
            </div>
            <aside class="slide-side">
                ${sideBody}
            </aside>
        </section>
    `;
}

function renderImage(src, alt) {
    return `
        <figure class="image-frame">
            <img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" />
        </figure>
    `;
}

function renderBullets(items) {
    if (!Array.isArray(items) || !items.length) {
        return "";
    }
    return `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderChips(items) {
    if (!Array.isArray(items) || !items.length) {
        return "";
    }
    return `<div class="chips">${items.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}</div>`;
}

function bindQuizToggle() {
    document.querySelectorAll("[data-quiz]").forEach((item) => {
        const btn = item.querySelector(".quiz-question");
        const answer = item.querySelector(".quiz-answer");
        if (!btn || !answer) {
            return;
        }

        btn.addEventListener("click", () => {
            const isOpen = item.classList.contains("open");
            item.classList.toggle("open", !isOpen);
            btn.setAttribute("aria-expanded", String(!isOpen));
            answer.style.maxHeight = !isOpen ? `${answer.scrollHeight + 16}px` : "0px";
        });
    });
}

function renderError(message) {
    const deck = document.getElementById("deck");
    if (!deck) {
        return;
    }

    deck.innerHTML = `
        <section class="slide is-active layout-split-cards">
            <div class="slide-main">
                <p class="kicker">Erro</p>
                <h1>Não foi possível carregar os slides</h1>
                <p class="subtitle">${escapeHtml(message)}</p>
            </div>
            <aside class="slide-side"></aside>
        </section>
    `;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}



function initClassClock() {
    const clock = document.getElementById("classClock");
    const text = document.getElementById("clockText");
    if (!clock || !text) {
        return;
    }

    const updateClock = () => {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();

        const preBreakStart = 9 * 60 + 55;
        const breakStart = 10 * 60;
        const breakEnd = 10 * 60 + 15;
        const preEndStart = 10 * 60 + 55;
        const classEnd = 11 * 60;

        clock.classList.remove("is-blinking", "is-break", "is-end");

        if (minutes >= breakStart && minutes < breakEnd) {
            text.textContent = "INTERVALO";
            clock.classList.add("is-break");
            return;
        }

        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        text.textContent = `${hh}:${mm}:${ss}`;

        if ((minutes >= preBreakStart && minutes < breakStart) || (minutes >= preEndStart && minutes < classEnd)) {
            clock.classList.add("is-blinking");
            return;
        }

        if (minutes >= classEnd) {
            clock.classList.add("is-end");
        }
    };

    updateClock();
    window.setInterval(updateClock, 1000);
}
