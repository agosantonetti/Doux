document.addEventListener("DOMContentLoaded", () => {

    // ── NAVBAR: sombra al hacer scroll ────────────────────────────────────────
    const header = document.getElementById('header');
    const actualizarHeader = () => {
        header.classList.toggle('con-scroll', window.scrollY > 10);
    };
    window.addEventListener('scroll', actualizarHeader, { passive: true });
    actualizarHeader();

    // ── NAVBAR: menú hamburguesa (mobile) ─────────────────────────────────────
    const hamburguesa = document.getElementById('hamburguesa');
    const nav         = document.getElementById('nav');

    const abrirMenu = (abrir) => {
        nav.classList.toggle('abierto', abrir);
        document.documentElement.classList.toggle('menu-abierto', abrir);
        hamburguesa.setAttribute('aria-expanded', abrir);
        hamburguesa.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    };

    hamburguesa.addEventListener('click', () => {
        abrirMenu(!nav.classList.contains('abierto'));
    });

    // Cerrar al tocar un link
    nav.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', () => abrirMenu(false));
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') abrirMenu(false);
    });

    // Si se agranda la ventana con el menú abierto, cerrarlo
    window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
        if (e.matches) abrirMenu(false);
    });

    // ── ANIMACIONES DE ENTRADA: aparecen al entrar en pantalla ───────────────
    const revelables = document.querySelectorAll("[data-revelar]");

    if ("IntersectionObserver" in window) {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach(entrada => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add("visible");
                    observador.unobserve(entrada.target); // se anima una sola vez
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

        revelables.forEach(el => observador.observe(el));
    } else {
        revelables.forEach(el => el.classList.add("visible"));
    }

    // ── MAPA: en pantallas táctiles el pin se abre al tocarlo ─────────────────
    // (con mouse se abre con hover, desde el CSS)
    const pines = document.querySelectorAll(".pin");

    // "con mouse" = versión de escritorio + mouse; la versión mobile siempre funciona al tocar
    const conMouse = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 769px)");
    const mapa = document.querySelector(".mapa");

    // la primera vez que se prueba un pin, se apaga el pulso de invitación
    const marcarExplorado = () => mapa.classList.add("explorado");
    pines.forEach(pin => {
        ["mouseenter", "focus", "click"].forEach(evento =>
            pin.addEventListener(evento, marcarExplorado, { once: true })
        );
    });

    pines.forEach(pin => {
        pin.addEventListener("click", (e) => {
            if (conMouse.matches) return; // con mouse alcanza el hover
            e.stopPropagation();
            const yaAbierto = pin.classList.contains("activo");
            pines.forEach(p => p.classList.remove("activo"));
            if (!yaAbierto) pin.classList.add("activo");
        });
    });

    // tocar fuera del mapa cierra el pin abierto
    document.addEventListener("click", () => {
        pines.forEach(p => p.classList.remove("activo"));
    });

    // ── GALERÍA: en pantallas táctiles, tocar una polaroid la endereza ────────
    const polaroids = document.querySelectorAll(".polaroid");

    polaroids.forEach(foto => {
        foto.addEventListener("click", (e) => {
            if (conMouse.matches) return; // con mouse lo hace el hover
            e.stopPropagation();
            const yaTocada = foto.classList.contains("tocada");
            polaroids.forEach(p => p.classList.remove("tocada"));
            if (!yaTocada) foto.classList.add("tocada");
        });
    });

    // tocar en cualquier otro lado la vuelve a inclinar
    document.addEventListener("click", () => {
        polaroids.forEach(p => p.classList.remove("tocada"));
    });

    // ── PRODUCTOS (mobile): carrusel que también se arrastra con el mouse ─────
    // Con el dedo el carrusel se desliza solo (scroll nativo). Con mouse no:
    // la rueda mueve la página. Así que con mouse se puede agarrar y arrastrar.
    const carrusel = document.querySelector(".productos__grid");
    const esCarrusel = window.matchMedia("(max-width: 768px)");
    let arrastre = null;

    const actualizarCarrusel = () => carrusel.classList.toggle("arrastrable", esCarrusel.matches);
    esCarrusel.addEventListener("change", actualizarCarrusel);
    actualizarCarrusel();

    carrusel.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse" || !esCarrusel.matches) return; // el dedo ya funciona solo
        arrastre = { x: e.clientX, scroll: carrusel.scrollLeft, movio: false };
        carrusel.classList.add("arrastrando");
    });

    window.addEventListener("pointermove", (e) => {
        if (!arrastre) return;
        const dx = e.clientX - arrastre.x;
        if (Math.abs(dx) > 5) arrastre.movio = true;
        carrusel.scrollLeft = arrastre.scroll - dx;
    });

    window.addEventListener("pointerup", () => {
        if (!arrastre) return;
        carrusel.classList.remove("arrastrando");
        // al soltar, se acomoda en la card más cercana
        const cards = [...carrusel.children];
        const paso = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : carrusel.clientWidth;
        const destino = Math.round(carrusel.scrollLeft / paso) * paso;
        carrusel.scrollTo({ left: destino, behavior: "smooth" });
        // si fue un arrastre, que no cuente como clic en "Ver producto"
        if (arrastre.movio) {
            const cancelarClic = (ev) => ev.preventDefault();
            carrusel.addEventListener("click", cancelarClic, { capture: true });
            setTimeout(() => carrusel.removeEventListener("click", cancelarClic, { capture: true }), 0);
        }
        arrastre = null;
    });

    carrusel.addEventListener("dragstart", (e) => e.preventDefault());

    // ── PRODUCTOS (mobile): puntos del carrusel ──────────────────────────────
    const puntos = document.querySelectorAll(".punto");
    const anchoPaso = () => {
        const cards = carrusel.children;
        return cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : carrusel.clientWidth;
    };

    // al deslizar, se marca el punto de la card que se está viendo
    carrusel.addEventListener("scroll", () => {
        const actual = Math.round(carrusel.scrollLeft / anchoPaso());
        puntos.forEach((punto, i) => {
            punto.classList.toggle("activo", i === actual);
            if (i === actual) punto.setAttribute("aria-current", "true");
            else punto.removeAttribute("aria-current");
        });
    }, { passive: true });

    // tocar un punto lleva a esa card
    puntos.forEach((punto, i) => {
        punto.addEventListener("click", () => {
            carrusel.scrollTo({ left: i * anchoPaso(), behavior: "smooth" });
        });
    });
});
