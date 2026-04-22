window.addEventListener("DOMContentLoaded", () => {
    initClassClock();
    setAppHeight();
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
    let slideHeight = window.innerHeight;

    function goTo(index) {
        current = clamp(index, 0, slides.length - 1);
        deck.style.transform = `translateY(-${current * slideHeight}px)`;

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
    window.addEventListener("resize", () => {
        setAppHeight();
        slideHeight = window.innerHeight;
        goTo(current);
    });

    window.addEventListener("keydown", (event) => {
        if (document.body.classList.contains("media-focus-mode")) {
            if (event.key === "Escape") {
                document.dispatchEvent(new CustomEvent("media:close"));
            }
            return;
        }
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
        if (document.body.classList.contains("media-focus-mode")) {
            return;
        }
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
        if (document.body.classList.contains("media-focus-mode")) {
            return;
        }
        const delta = startY - event.changedTouches[0].clientY;
        if (Math.abs(delta) < 45) {
            return;
        }
        delta > 0 ? next() : prev();
    }, { passive: true });

    bindQuizToggle();
    bindMediaFullscreen();
    bindMobileImageDrag();
    slideHeight = window.innerHeight;
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
            <div class="hero-site-preview hero-qr-preview media-preview" data-media-preview>
                <div class="hero-site-topbar">
                    <span class="browser-dot red"></span>
                    <span class="browser-dot yellow"></span>
                    <span class="browser-dot green"></span>
                    <span class="address-bar">walter-fx.github.io/aula-imunizacao</span>
                </div>
                <div class="hero-site-body hero-qr-body">
                    <img class="hero-main-qr" src="assets/qr/qr-code.png" alt="QR Code da aula" loading="lazy" />
                </div>
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
        <div class="hero-site-preview media-preview" data-media-preview>
            <div class="hero-site-topbar">
                <span class="browser-dot red"></span>
                <span class="browser-dot yellow"></span>
                <span class="browser-dot green"></span>
                <span class="address-bar">walter-fx.github.io/aula-imunizacao</span>
            </div>
            <div class="media-window-body">
                <img class="media-main-image" src="${src}" alt="${escapeHtml(alt)}" loading="lazy" />
            </div>
        </div>
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

function bindMediaFullscreen() {
    const previews = Array.from(document.querySelectorAll("[data-media-preview]"));
    if (!previews.length) {
        return;
    }

    previews.forEach((preview) => {
        const media = preview.querySelector("img");
        if (!media) {
            return;
        }

        media.setAttribute("draggable", "false");
        let expanded = false;
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let dx = 0;
        let dy = 0;
        const originalParent = preview.parentElement;
        const originalNext = preview.nextSibling;

        const clearDrag = () => {
            preview.style.removeProperty("--drag-x");
            preview.style.removeProperty("--drag-y");
            preview.style.removeProperty("--drag-rot");
            preview.classList.remove("media-dragging");
            dx = 0;
            dy = 0;
        };

        const close = () => {
            if (!expanded) {
                return;
            }
            expanded = false;
            clearDrag();
            preview.classList.remove("media-expanded");
            document.body.classList.remove("media-focus-mode");
            if (originalParent) {
                if (originalNext && originalNext.parentNode === originalParent) {
                    originalParent.insertBefore(preview, originalNext);
                } else {
                    originalParent.appendChild(preview);
                }
            }
        };

        const open = () => {
            if (expanded) {
                return;
            }
            expanded = true;
            document.body.appendChild(preview);
            preview.classList.add("media-expanded");
            document.body.classList.add("media-focus-mode");
        };

        const toggle = () => {
            expanded ? close() : open();
        };

        media.addEventListener("click", (event) => {
            event.stopPropagation();
            toggle();
        });

        preview.addEventListener("click", () => {
            if (expanded) {
                close();
            }
        });

        preview.addEventListener("pointerdown", (event) => {
            if (!expanded) {
                return;
            }
            dragging = true;
            startX = event.clientX;
            startY = event.clientY;
            preview.classList.add("media-dragging");
            preview.setPointerCapture?.(event.pointerId);
        });

        preview.addEventListener("pointermove", (event) => {
            if (!expanded || !dragging) {
                return;
            }
            dx = event.clientX - startX;
            dy = event.clientY - startY;
            preview.style.setProperty("--drag-x", `${dx}px`);
            preview.style.setProperty("--drag-y", `${dy}px`);
            preview.style.setProperty("--drag-rot", `${dx * 0.03}deg`);
        });

        preview.addEventListener("pointerup", (event) => {
            if (!expanded || !dragging) {
                return;
            }
            dragging = false;
            preview.releasePointerCapture?.(event.pointerId);
            const distance = Math.hypot(dx, dy);
            if (distance > 140) {
                close();
                return;
            }
            clearDrag();
        });

        preview.addEventListener("pointercancel", () => {
            dragging = false;
            clearDrag();
        });

        document.addEventListener("media:close", close);
    });
}

function bindMobileImageDrag() {
    const mobileMq = window.matchMedia("(max-width: 1024px)");
    const sides = Array.from(document.querySelectorAll(".slide-side"));
    if (!sides.length) {
        return;
    }

    sides.forEach((side) => {
        side.style.removeProperty("--media-drag-y");
        side.classList.remove("media-collapsed");

        let dragging = false;
        let moved = false;
        let startY = 0;
        let startOffset = 0;
        let currentOffset = 0;

        const getMaxOffset = () => Math.max(0, side.offsetHeight - 34);
        const applyOffset = (value) => {
            currentOffset = Math.max(0, Math.min(getMaxOffset(), value));
            side.style.setProperty("--media-drag-y", `${currentOffset}px`);
        };

        const snap = () => {
            const maxOffset = getMaxOffset();
            const shouldCollapse = currentOffset > maxOffset * 0.42;
            applyOffset(shouldCollapse ? maxOffset : 0);
            side.classList.toggle("media-collapsed", shouldCollapse);
        };

        side.addEventListener("pointerdown", (event) => {
            if (!mobileMq.matches || document.body.classList.contains("media-focus-mode")) {
                return;
            }
            dragging = true;
            moved = false;
            startY = event.clientY;
            startOffset = currentOffset;
            side.classList.add("media-dragging-local");
            side.setPointerCapture?.(event.pointerId);
        });

        side.addEventListener("pointermove", (event) => {
            if (!dragging || !mobileMq.matches) {
                return;
            }
            const delta = event.clientY - startY;
            if (Math.abs(delta) > 4) {
                moved = true;
            }
            applyOffset(startOffset + delta);
        });

        side.addEventListener("pointerup", (event) => {
            if (!dragging) {
                return;
            }
            dragging = false;
            side.classList.remove("media-dragging-local");
            side.releasePointerCapture?.(event.pointerId);
            if (moved) {
                snap();
            }
        });

        side.addEventListener("pointercancel", () => {
            dragging = false;
            side.classList.remove("media-dragging-local");
            snap();
        });

        side.addEventListener("dblclick", () => {
            if (!mobileMq.matches) {
                return;
            }
            const maxOffset = getMaxOffset();
            const collapsed = side.classList.contains("media-collapsed");
            applyOffset(collapsed ? 0 : maxOffset);
            side.classList.toggle("media-collapsed", !collapsed);
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

function setAppHeight() {
    document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
}
