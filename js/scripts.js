/*!
* Start Bootstrap - Agency v7.0.12 (https://startbootstrap.com/theme/agency)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-agency/blob/master/LICENSE)
*/

window.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initRevealObserver();
    initParallax();
    loadLessonContent();
});

function initNavbar() {
    const navbarShrink = () => {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink');
        } else {
            navbarCollapsible.classList.add('navbar-shrink');
        }
    };

    navbarShrink();
    document.addEventListener('scroll', navbarShrink);

    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    }

    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(document.querySelectorAll('#navbarResponsive .nav-link'));
    responsiveNavItems.forEach((responsiveNavItem) => {
        responsiveNavItem.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });
}

function initRevealObserver() {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px',
    });

    document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));

    window.observeNewReveal = () => {
        document.querySelectorAll('.reveal:not(.is-visible)').forEach((item) => revealObserver.observe(item));
    };
}

function initParallax() {
    const masthead = document.querySelector('.masthead');
    if (!masthead) {
        return;
    }

    document.addEventListener('scroll', () => {
        const offset = Math.min(window.scrollY * 0.35, 180);
        masthead.style.backgroundPosition = `center calc(50% + ${offset}px)`;
    });
}

async function loadLessonContent() {
    try {
        const response = await fetch('conteudo.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Falha ao carregar conteudo.json');
        }

        const rawText = await response.text();
        const data = parseJsonBlock(rawText);
        renderPage(data);
        if (window.observeNewReveal) {
            window.observeNewReveal();
        }
    } catch (error) {
        setErrorState(error);
    }
}

function parseJsonBlock(rawText) {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
        throw new Error('Não foi possível interpretar o conteúdo do JSON.');
    }

    return JSON.parse(rawText.slice(start, end + 1));
}

function renderPage(data) {
    const aula = data.aula || {};
    const programatico = data.conteudo_programatico || {};
    const quadroResumo = data.quadro_resumo || {};

    setText('heroTitle', aula.titulo || 'Aula de Imunização');
    setText('heroTheme', aula.tema_central || 'Conteúdo programático carregado.');
    setText('disciplinaNivel', `${aula.disciplina || ''} ${aula.nivel ? `| Nível: ${aula.nivel}` : ''}`.trim());
    setText('objetivoGeral', aula.objetivo_geral || 'Objetivo geral não informado.');
    setText('justificativa', aula.justificativa || 'Justificativa não informada.');
    setText('footerTitle', aula.titulo || 'Aula de Imunização');
    setText('footerTema', aula.tema_central || '');

    const metaEntries = [
        ['Idioma', aula.idioma],
        ['Carga sugerida', aula.carga_horaria_sugerida],
        ['Público-alvo', arrayToText(aula.publico_alvo)],
    ];
    renderMeta(metaEntries);

    renderList('objetivosEspecificos', aula.objetivos_especificos);
    renderList('competencias', aula.competencias_desenvolvidas);
    renderList('habilidades', aula.habilidades);
    renderTags('palavrasChave', aula.palavras_chave);

    renderUnidades(programatico.unidades || []);
    renderQuadroResumo(quadroResumo);
    renderEstudosCaso(data.estudo_de_casos || []);
    renderList('perguntasDiscussao', data.perguntas_para_discussao);
    renderRoteiro(data.roteiro_de_aula || {});
    renderAtividade(data.atividade_avaliativa || {});
    renderGlossario(data.glossario || []);
    renderReferencias(data.referencias || []);
    renderList('mensagensChave', data.mensagens_chave);
}

function renderMeta(entries) {
    const container = document.getElementById('metaInfo');
    if (!container) {
        return;
    }

    container.innerHTML = entries
        .filter(([, value]) => Boolean(value))
        .map(([label, value]) => `<li><span>${escapeHtml(label)}:</span> ${escapeHtml(value)}</li>`)
        .join('');
}

function renderUnidades(unidades) {
    const container = document.getElementById('unidadesContainer');
    if (!container) {
        return;
    }

    container.innerHTML = unidades.map((unidade, index) => {
        const topicos = toListHtml(unidade.topicos);
        const subtopicos = (unidade.subtopicos || []).map((sub) => {
            return `
                <div class="subtopic-block">
                    <h5>${escapeHtml(sub.titulo || '')}</h5>
                    <p>${escapeHtml(sub.descricao || '')}</p>
                    ${sub.pontos_chave ? `<ul>${toListItems(sub.pontos_chave)}</ul>` : ''}
                </div>
            `;
        }).join('');

        return `
            <article class="unit-card reveal ${index % 2 ? 'unit-card-alt' : ''}">
                <div class="unit-badge">Unidade ${index + 1}</div>
                <h4>${escapeHtml(unidade.titulo || '')}</h4>
                <p class="unit-goal"><strong>Objetivo:</strong> ${escapeHtml(unidade.objetivo || '')}</p>
                <p>${escapeHtml(unidade.texto_base || '')}</p>
                ${topicos ? `<div class="unit-group"><h5>Tópicos centrais</h5><ul>${topicos}</ul></div>` : ''}
                ${subtopicos ? `<div class="unit-group"><h5>Subtópicos</h5>${subtopicos}</div>` : ''}
                ${unidade.resumo ? `<div class="unit-summary">${escapeHtml(unidade.resumo)}</div>` : ''}
            </article>
        `;
    }).join('');
}

function renderQuadroResumo(quadroResumo) {
    const container = document.getElementById('quadroResumo');
    if (!container) {
        return;
    }

    const entries = Object.entries(quadroResumo);
    container.innerHTML = entries.map(([key, value], index) => {
        const title = key.replaceAll('_', ' ');
        return `
            <div class="col-lg-6 reveal ${index % 3 === 1 ? 'reveal-delay-1' : index % 3 === 2 ? 'reveal-delay-2' : ''}">
                <div class="content-card h-100 summary-card">
                    <h4 class="card-title">${escapeHtml(toTitleCase(title))}</h4>
                    <ul class="content-list mb-0">${toListItems(value)}</ul>
                </div>
            </div>
        `;
    }).join('');
}

function renderEstudosCaso(casos) {
    const container = document.getElementById('estudosCaso');
    if (!container) {
        return;
    }

    container.innerHTML = casos.map((caso, index) => {
        return `
            <div class="col-lg-6 reveal ${index % 2 ? 'reveal-delay-1' : ''}">
                <article class="content-card h-100 case-card">
                    <span class="case-id">Caso ${escapeHtml(String(caso.id || index + 1))}</span>
                    <h4 class="card-title">${escapeHtml(caso.titulo || '')}</h4>
                    <p><strong>Situação:</strong> ${escapeHtml(caso.caso || '')}</p>
                    <p><strong>Pergunta:</strong> ${escapeHtml(caso.pergunta || '')}</p>
                    <p><strong>Resposta esperada:</strong> ${escapeHtml(caso.resposta_esperada || '')}</p>
                    <p class="mb-0"><strong>Justificativa:</strong> ${escapeHtml(caso.justificativa || '')}</p>
                </article>
            </div>
        `;
    }).join('');
}

function renderRoteiro(roteiro) {
    const container = document.getElementById('roteiroAula');
    if (!container) {
        return;
    }

    const cards = [
        ['Abertura', roteiro.abertura],
        ['Desenvolvimento', roteiro.desenvolvimento],
        ['Encerramento', roteiro.encerramento],
    ];

    container.innerHTML = cards.map(([titulo, bloco], index) => {
        const estrategia = bloco?.estrategia ? `<p><strong>Estratégia:</strong> ${escapeHtml(bloco.estrategia)}</p>` : '';
        const fala = bloco?.fala_sugerida_docente ? `<p><strong>Fala sugerida:</strong> ${escapeHtml(bloco.fala_sugerida_docente)}</p>` : '';
        const etapas = bloco?.etapas ? `<ul class="content-list">${toListItems(bloco.etapas)}</ul>` : '';

        return `
            <div class="col-lg-4 reveal ${index === 1 ? 'reveal-delay-1' : index === 2 ? 'reveal-delay-2' : ''}">
                <div class="content-card h-100">
                    <h4 class="card-title">${escapeHtml(titulo)}</h4>
                    <p><strong>Duração:</strong> ${escapeHtml(bloco?.duracao_sugerida || 'Não informado')}</p>
                    ${estrategia}
                    ${etapas}
                    ${fala}
                </div>
            </div>
        `;
    }).join('');
}

function renderAtividade(atividade) {
    const container = document.getElementById('atividadeAvaliativa');
    if (!container) {
        return;
    }

    const componentes = atividade.componentes || [];
    const criterios = atividade.criterios_de_correcao || [];

    container.innerHTML = `
        <div class="col-lg-6 reveal">
            <div class="content-card h-100">
                <h4 class="card-title">Atividade Avaliativa</h4>
                <p><strong>Tipo:</strong> ${escapeHtml(atividade.tipo || 'Não informado')}</p>
                <ul class="content-list mb-0">
                    ${componentes.map((item) => `<li><strong>${escapeHtml(toTitleCase(item.tipo || 'Componente'))}</strong>: ${escapeHtml(item.foco || '')} ${item.quantidade ? `(${escapeHtml(String(item.quantidade))})` : ''}</li>`).join('')}
                </ul>
            </div>
        </div>
        <div class="col-lg-6 reveal reveal-delay-1">
            <div class="content-card h-100">
                <h4 class="card-title">Critérios de Correção</h4>
                <ul class="content-list mb-0">${toListItems(criterios)}</ul>
            </div>
        </div>
    `;
}

function renderGlossario(glossario) {
    const container = document.getElementById('glossario');
    if (!container) {
        return;
    }

    container.innerHTML = glossario.map((item) => {
        return `
            <article class="glossary-item">
                <h5>${escapeHtml(item.termo || '')}</h5>
                <p>${escapeHtml(item.definicao || '')}</p>
            </article>
        `;
    }).join('');
}

function renderReferencias(referencias) {
    const container = document.getElementById('referenciasLista');
    if (!container) {
        return;
    }

    container.innerHTML = referencias.map((ref) => {
        return `
            <article class="reference-item">
                <h5>${escapeHtml(ref.titulo || 'Referência')}</h5>
                <p><strong>Instituição:</strong> ${escapeHtml(ref.instituicao || ref.autor_institucional || 'Não informado')}</p>
                <p><strong>Ano:</strong> ${escapeHtml(ref.ano || 'Não informado')}</p>
                <p class="mb-0">${escapeHtml(ref.observacao || '')}</p>
            </article>
        `;
    }).join('');
}

function renderList(elementId, items) {
    const container = document.getElementById(elementId);
    if (!container) {
        return;
    }
    container.innerHTML = toListItems(items);
}

function renderTags(elementId, tags) {
    const container = document.getElementById(elementId);
    if (!container) {
        return;
    }

    container.innerHTML = (tags || []).map((tag) => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('');
}

function toListItems(items) {
    if (!Array.isArray(items)) {
        return '';
    }
    return items.map((item) => `<li>${escapeHtml(typeof item === 'string' ? item : JSON.stringify(item))}</li>`).join('');
}

function toListHtml(items) {
    return toListItems(items);
}

function arrayToText(items) {
    if (!Array.isArray(items) || !items.length) {
        return '';
    }
    return items.join(', ');
}

function toTitleCase(text) {
    return text
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function setErrorState(error) {
    console.error(error);
    setText('heroTitle', 'Não foi possível carregar o conteúdo da aula');
    setText('heroTheme', 'Verifique o arquivo conteudo.json e recarregue a página.');
}

function escapeHtml(text) {
    const str = String(text ?? '');
    return str
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
