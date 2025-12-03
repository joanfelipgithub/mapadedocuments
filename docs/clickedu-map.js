javascript:(function clickeduMain() {
  // Nom de la clau a localStorage
  const FLAG_NAME = 'clickeduBuildOverlay'; 
  // Clau general per guardar la configuració de documents personalitzats
  const CONFIG_KEY = 'clickeduDocConfigs';
    
    // --- Colors per Defecte ---
    const DEFAULT_BG = '#93C81C';
    const DEFAULT_TEXT = '#013365';
    
    // Carrega la configuració de colors i favorits de localStorage
    let docConfigs = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');

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
// --- FUNCIONS UTILITÀRIES ---
// ----------------------------------------------------------------------

    // Funció per guardar la configuració actual
    function saveConfigs() {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(docConfigs));
    }

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
    // Afegim una categoria especial per als favorits
    catMap["❤️ Favorits"] = []; 
    cats.forEach(c => catMap[c] = []);
    
    const uniqueUrls = new Map(); 

    rows.forEach(a => {
        const url = a.href;
        
        // Omet si la URL ja s'ha processat
        if (uniqueUrls.has(url)) {
            return; 
        }
        
        uniqueUrls.set(url, true); // Marca la URL com a vista
        
      const t = a.innerText.trim();
      if (/obsolet/i.test(t)) return;
      const m = t.match(/_(.*?)_/);
      let cat = "Altres";
      if (m && cats.includes(m[1])) cat = m[1];
      
      const docData = { element: a, text: t };

      catMap[cat].push(docData);
      
      // Si el document és favorit, també l'afegim a la llista de Favorits
      if (docConfigs[t] && docConfigs[t].favorite) {
          catMap["❤️ Favorits"].push(docData);
      }
    });
    
    // --------------------------------------------------
    // --- FUNCIÓ DE CREACIÓ DEL MENÚ CONTEXTUAL ---
    // --------------------------------------------------
    function createContextMenu(btnElement, text, docData) {
        const menu = document.createElement('div');
        Object.assign(menu.style, {
            position: 'fixed',
            background: 'white',
            border: '1px solid #ccc',
            padding: '5px',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
            zIndex: '1000000',
            display: 'none',
            flexDirection: 'column',
            cursor: 'pointer'
        });
        document.body.appendChild(menu);

        function hideMenu() {
            menu.style.display = 'none';
        }
        
        document.addEventListener('click', hideMenu);
        // Evita tancar el menú si es fa clic dret sobre ell mateix (o un altre botó)
        document.addEventListener('contextmenu', (e) => {
            if (e.target !== btnElement) hideMenu();
        });

        const isFav = docConfigs[text] && docConfigs[text].favorite;
        const favText = isFav ? "💔 Eliminar de Favorits" : "❤️ Afegir a Favorits";
        
        // Opció 1: Favorits
        const favItem = document.createElement('div');
        Object.assign(favItem.style, { padding: '5px 10px' });
        favItem.textContent = favText;
        favItem.onmouseover = () => favItem.style.background = '#eee';
        favItem.onmouseout = () => favItem.style.background = 'white';
        favItem.onclick = () => {
            docConfigs[text] = docConfigs[text] || {};
            docConfigs[text].favorite = !isFav;
            saveConfigs();
            alert(`"${text.match(/^[^ _]+/)[0]}" ${isFav ? 'eliminat' : 'afegit'} a Favorits. Recarrega l'Overlay per actualitzar.`);
            hideMenu();
        };
        menu.appendChild(favItem);

        // Opció 2: Canviar Fons
        const bgItem = document.createElement('div');
        Object.assign(bgItem.style, { padding: '5px 10px' });
        bgItem.textContent = "🎨 Canviar Color Fons";
        bgItem.onmouseover = () => bgItem.style.background = '#eee';
        bgItem.onmouseout = () => bgItem.style.background = 'white';
        bgItem.onclick = () => {
            const newColor = prompt("Introdueix el nou color de fons (HEX, e.g. #FF0000):", btnElement.style.backgroundColor);
            // Comprovació simple de format HEX (opcionalment, es podria fer una validació més estricta)
            if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
                btnElement.style.background = newColor;
                docConfigs[text] = docConfigs[text] || {};
                docConfigs[text].background = newColor;
                saveConfigs();
            } else if (newColor !== null) {
                alert("Format de color no vàlid. Utilitza #RRGGBB.");
            }
            hideMenu();
        };
        menu.appendChild(bgItem);
        
        // Opció 3: Canviar Lletres
        const textColorItem = document.createElement('div');
        Object.assign(textColorItem.style, { padding: '5px 10px' });
        textColorItem.textContent = "🅰️ Canviar Color Lletres";
        textColorItem.onmouseover = () => textColorItem.style.background = '#eee';
        textColorItem.onmouseout = () => textColorItem.style.background = 'white';
        textColorItem.onclick = () => {
            const newColor = prompt("Introdueix el nou color de lletres (HEX, e.g. #000000):", btnElement.style.color);
            if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
                btnElement.style.color = newColor;
                docConfigs[text] = docConfigs[text] || {};
                docConfigs[text].color = newColor;
                saveConfigs();
            } else if (newColor !== null) {
                alert("Format de color no vàlid. Utilitza #RRGGBB.");
            }
            hideMenu();
        };
        menu.appendChild(textColorItem);

        return menu;
    }
    // --------------------------------------------------


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
      if (a.closest("#clickeduMapContainer")) return;  // Ignora els clics dins del mapa
        
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
      
      // Ordena per a totes les categories (excepte Favorits, que es manté a dalt)
      if (cat !== "❤️ Favorits") {
          list.sort((a, b) => {
              const textA = a.text.toUpperCase();
              const textB = b.text.toUpperCase();
              if (textA < textB) return -1;
              if (textA > textB) return 1;
              return 0;
          });
      }


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
        display: (cat === "❤️ Favorits") ? "grid" : "none", // Mostra Favorits per defecte
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
        
        // Aplica colors personalitzats o per defecte
        const config = docConfigs[t] || {};
        const bgColor = config.background || DEFAULT_BG;
        const textColor = config.color || DEFAULT_TEXT;
        
        Object.assign(btn.style, {
          width: "127px",
          height: "54px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bgColor, // Color fix o personalitzat
          color: textColor, // Color fix o personalitzat
          fontWeight: "bold",
          fontSize: "14px",
          borderRadius: "10px",
          cursor: "pointer",
          userSelect: "none",
          textAlign: "center",
          overflow: "hidden"
        });

        // Event: Clic esquerre (navegació)
        btn.addEventListener("click", e => { 
          e.stopPropagation(); 
          console.log("🖱️ Clicat:", t);
          a.click(); 
        });
        
        // Event: Clic dret (menú contextual)
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Evita el menú natiu del navegador
            
            const existingMenu = document.getElementById('clickeduContextMenu');
            if (existingMenu) existingMenu.remove();
            
            const menu = createContextMenu(btn, t, item);
            menu.id = 'clickeduContextMenu';
            
            // Posiciona el menú just al costat del ratolí
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
            menu.style.display = 'flex';
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
    console.log('🔄 S\'ha detectat que la cerca s\'ha activat, construint la superposició...');
    
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
      <div style="font-size: 14px; opacity: 0.9;">Torna a <strong>clicar el bookmarklet</strong> un cop la pàgina s\'hagi recarregat per construir el mapa.</div>
    `;
    document.body.appendChild(instructionNotif);

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
    
    // Injecta '_' i clica el botó amb un retard adequat
    input.value = "_";
    
    setTimeout(() => {
      instructionNotif.remove();
      searchBtn.click();
      console.log("🔍 Cerca activada. Torna a clicar el bookmarklet després de la recàrrega.");
    }, 5000);
  } else {
    console.log("❌ No s'han trobat els elements del formulari de cerca.");
    localStorage.removeItem(FLAG_NAME); 
  }
})();
