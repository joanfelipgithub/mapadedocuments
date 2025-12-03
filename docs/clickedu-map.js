javascript:(function clickeduMain() {
  // Nom de la clau a localStorage
  const FLAG_NAME = 'clickeduBuildOverlay'; 

  // --- 1. Neteja Inicial / Toggle (Primer Clic) ---
  const EXIST = document.getElementById("clickeduMapContainer");
  if (EXIST) {
    EXIST.remove();
    localStorage.removeItem(FLAG_NAME);
    console.log("🧹 Mapa eliminat i emmagatzematge netejat.");
    return;
  }

  console.log("⏳ Mapa ClickEdu: inicialitzant…");

// ----------------------------------------------------------------------
// --- Funció Principal: Construeix la Superposició a partir dels Resultats ---
// ----------------------------------------------------------------------
  function buildOverlay() {
    // Comprova si la superposició ja s'ha construït (important per l'Observer)
    if (document.getElementById("clickeduMapContainer")) {
        return true; 
    }
    
    console.log(`[DEBUG] buildOverlay en execució. URL: ${window.location.href}`);

    // Selector de les files de resultats
    const rows = Array.from(document.querySelectorAll(
      "table tbody tr td table tbody tr td:nth-child(3) div span strong a"
    ));
    
    if (!rows.length) {
      console.log("⚠️ Encara no s'han trobat resultats.");
      return false;
    }

    console.log("✔ Resultats de cerca detectats:", rows.length);

    // --- Contenidor de la Superposició (Overlay) ---
    const container = document.createElement("div");
    container.id = "clickeduMapContainer";
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      width: "480px",
      maxHeight: "90vh",
      overflowY: "auto",
      padding: "12px",
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 0 12px rgba(0,0,0,0.25)",
      zIndex: "999999"
    });
    document.body.appendChild(container);

    // --- Definició i Assignació de Categories ---
    const cats = ["EAFP","EA","GA","POC","GRL","GQ","EAESO","PO","GC","EABAT","SOR","Gestio","GRH"];
    const catMap = {};
    cats.push("Altres");
    cats.forEach(c => catMap[c] = []);

    rows.forEach(a => {
      const t = a.innerText.trim();
      if (/obsolet/i.test(t)) return;
      const m = t.match(/_(.*?)_/);
      let cat = "Altres";
      if (m && cats.includes(m[1])) cat = m[1];
      catMap[cat].push({ element: a, text: t });
    });

    // --- Funció i Listener per Bloquejar Office Viewer (descàrrega directa) ---
    function stripOfficeViewer(u) {
      try {
        const n = new URL(u);
        if (n.hostname.includes("view.officeapps.live.com")) {
          const d = n.searchParams.get("src");
          if (d) return decodeURIComponent(d);
        }
      } catch(e){}
      return u;
    }

    document.addEventListener("click", e => {
      const a = e.target.closest("a");
      if (!a) return;
      if (a.closest("#clickeduMapContainer")) return;  // Ignora els clics dins del mapa
        
      const h = a.href;
      const d = stripOfficeViewer(h);
      if (d !== h) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const dl = document.createElement("a");
        dl.href = d;
        dl.download = "";
        document.body.appendChild(dl);
        dl.click();
        dl.remove();
        console.log("🚫 OfficeViewer bloquejat → descarregant:", d);
      }
    }, true); 

    // --- Construcció de la UI de Categories Plegables ---
    Object.keys(catMap).forEach(cat => {
      let list = catMap[cat];
      if (!list.length) return;
        
      // ORDENACIÓ: Ordena la llista alfabèticament pel text de l'element
      list.sort((a, b) => {
          const textA = a.text.toUpperCase();
          const textB = b.text.toUpperCase();
          if (textA < textB) return -1;
          if (textA > textB) return 1;
          return 0;
      });

      // Capçalera plegable
      const head = document.createElement("div");
      head.innerText = cat + " (" + list.length + ")";
      Object.assign(head.style, {
        fontWeight: "bold",
        cursor: "pointer",
        margin: "6px 0",
        padding: "4px 8px",
        background: "#ddd",
        borderRadius: "6px"
      });
      container.appendChild(head);

      // Contenidor de contingut (col·lapsat)
      const content = document.createElement("div");
      Object.assign(content.style, {
        display: "none",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "10px",
        marginBottom: "6px"
      });
      container.appendChild(content);

      head.addEventListener("click", () => {
        content.style.display = content.style.display === "none" ? "grid" : "none";
      });

      // Botons
      list.forEach(item => {
        const a = item.element;
        const t = item.text;
        const l = t.match(/^[^ _]+/) ? t.match(/^[^ _]+/)[0] : t;
        const btn = document.createElement("div");
        btn.innerText = l;
        
        Object.assign(btn.style, {
          width: "127px",
          height: "54px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#" + Math.floor(Math.random()*16777215).toString(16),
          color: "white",
          fontWeight: "bold",
          fontSize: "14px",
          borderRadius: "10px",
          cursor: "pointer",
          userSelect: "none",
          textAlign: "center",
          overflow: "hidden"
        });
        btn.addEventListener("click", e => { 
          e.stopPropagation(); 
          console.log("🖱️ Clicat:", t);
          a.click(); 
        });
        content.appendChild(btn);
      });
    });

    // Neteja la bandera d'èxit
    console.log("🗺️ Mapa ClickEdu a punt!");
    localStorage.removeItem(FLAG_NAME);
    return true;
  }
// ----------------------------------------------------------------------

  // --- 2. Escenari: Intentar Construir (Segon Clic / Clic Post-Cerca) ---
  if (localStorage.getItem(FLAG_NAME) === 'true') {
    console.log('🔄 S'ha detectat que la cerca s'ha activat, construint la superposició...');
    
    // Mostra notificació a l'usuari
    const notification = document.createElement('div');
    notification.textContent = '⏳ Construint superposició ClickEdu...';
    Object.assign(notification.style, {
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#4CAF50',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      zIndex: '9999999',
      fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    });
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
    
    // Prova immediatament
    if (buildOverlay()) {
      return;
    }
    
    // Si no es troba immediatament, espera amb MutationObserver
    let loaded = false;
    const observer = new MutationObserver(() => {
      if (loaded) return;
      if (buildOverlay()) {
        loaded = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Timeout de seguretat (20 segons)
    setTimeout(() => {
      observer.disconnect();
      if (!loaded) {
        localStorage.removeItem(FLAG_NAME);
        console.log("⏱️ Temps d'espera esgotat: Resultats no trobats.");
        
        // Mostra notificació d'error
        const errorNotif = document.createElement('div');
        errorNotif.textContent = '❌ Temps esgotat. Torna a fer clic al bookmarklet.';
        Object.assign(errorNotif.style, {
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#f44336',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: '9999999',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        });
        document.body.appendChild(errorNotif);
        setTimeout(() => errorNotif.remove(), 5000);
      }
    }, 20000);
    
    return;
  }

  // --- 3. Escenari: Inici / Activació de la Cerca (Primer Clic) ---
  
  // Comprova si els resultats ja existeixen (l'usuari ja és a la pàgina de cerca amb resultats)
  if (buildOverlay()) {
    console.log("✨ Resultats ja presents! Mapa construït.");
    return;
  }

  // No hi ha resultats, troba els elements de cerca
  const input = document.querySelector("#p");
  const searchBtn = document.querySelector("#frm_cercar table tbody tr td:nth-child(2) a");
  
  if (input && searchBtn) {
    // Estableix la bandera per saber que s'ha d'intentar construir la superposició al següent clic
    localStorage.setItem(FLAG_NAME, 'true');
    
    // Mostra la notificació d'instrucció (el cor del procés de dos clics)
    const instructionNotif = document.createElement('div');
    instructionNotif.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 8px;">🔍 <strong>Activació de Cerca...</strong></div>
      <div style="font-size: 14px; opacity: 0.9;">Torna a <strong>clicar el bookmarklet</strong> un cop la pàgina s'hagi recarregat per construir el mapa.</div>
    `;
    Object.assign(instructionNotif.style, {
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#2196F3',
      color: 'white',
      padding: '16px 24px',
      borderRadius: '8px',
      zIndex: '9999999',
      fontWeight: 'bold',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxWidth: '400px',
      textAlign: 'center'
    });
    document.body.appendChild(instructionNotif);
    
    // Injecta '_' i clica el botó amb un retard adequat
    input.value = "_";
    
    setTimeout(() => {
      searchBtn.click();
      console.log("🔍 Cerca activada. Torna a clicar el bookmarklet després de la recàrrega.");
    }, 2500); // 2.5 segons per llegir el missatge
  } else {
    console.log("❌ No s'han trobat els elements del formulari de cerca.");
    localStorage.removeItem(FLAG_NAME); 
  }
})();
