javascript:(function clickeduMain() {
  const SCRIPT_NAME = 'clickeduScript';
  const FLAG_NAME = 'clickeduBuildOverlay';

  // --- Initial Cleanup/Toggle ---
  const EXIST = document.getElementById("clickeduMapContainer");
  if (EXIST) {
    EXIST.remove();
    localStorage.removeItem(FLAG_NAME);
    localStorage.removeItem(SCRIPT_NAME);
    console.log("🧹 Map removed and storage cleaned.");
    return;
  }

  console.log("⏳ ClickEdu map: initializing…");

  // --- Core Function: Builds the Overlay from Results ---
  function buildOverlay() {
    // Check if the overlay has already been built
    if (document.getElementById("clickeduMapContainer")) {
        return true; 
    }
    
    console.log(`[DEBUG] buildOverlay running. URL: ${window.location.href}`);

    const rows = Array.from(document.querySelectorAll(
      "table tbody tr td table tbody tr td:nth-child(3) div span strong a"
    ));
    
    if (!rows.length) {
      console.log("⚠️ No results found yet.");
      return false;
    }

    console.log("✔ Search results detected:", rows.length);

    // --- Overlay container ---
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

    // --- Categories Definition & Assignment ---
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

    // --- Block Office Viewer Function & Listener ---
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
      if (a.closest("#clickeduMapContainer")) return; 
        
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
        console.log("🚫 OfficeViewer blocked → downloading:", d);
      }
    }, true); 

    // --- Build foldable categories UI ---
    Object.keys(catMap).forEach(cat => {
      const list = catMap[cat];
      if (!list.length) return;

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
          console.log("🖱️ Clicked:", t);
          a.click(); 
        });
        content.appendChild(btn);
      });
    });

    // Cleanup flags upon success
    console.log("🗺️ ClickEdu overlay ready!");
    localStorage.removeItem(FLAG_NAME);
    localStorage.removeItem(SCRIPT_NAME);
    return true;
  }

  // --- Scenario 1: Auto-Build if we're on search results page ---
  if (localStorage.getItem(FLAG_NAME) === 'true') {
    console.log('🔄 Detected search was triggered, building overlay...');
    
    // Show notification to user
    const notification = document.createElement('div');
    notification.textContent = '⏳ Building ClickEdu overlay...';
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
    
    if (buildOverlay()) {
      return;
    }
    
    // If not found immediately, wait with MutationObserver
    let loaded = false;
    const observer = new MutationObserver(() => {
      if (loaded) return;
      if (buildOverlay()) {
        loaded = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Safety Timeout
    setTimeout(() => {
      observer.disconnect();
      if (!loaded) {
        localStorage.removeItem(FLAG_NAME);
        localStorage.removeItem(SCRIPT_NAME);
        console.log("⏱️ Timeout: Results not found after page reload.");
        
        // Show error notification
        const errorNotif = document.createElement('div');
        errorNotif.textContent = '❌ ClickEdu overlay timed out. Try clicking the bookmarklet again.';
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

  // --- Scenario 2: Check if results already exist (already on search page) ---
  if (buildOverlay()) {
    console.log("✨ Results already present!");
    return;
  }

  // --- Scenario 3: Trigger search and show instructions ---
  const input = document.querySelector("#p");
  const searchBtn = document.querySelector("#frm_cercar table tbody tr td:nth-child(2) a");
  
  if (input && searchBtn) {
    // Set flag so we know to build overlay after reload
    localStorage.setItem(FLAG_NAME, 'true');
    
    // Show instruction notification
    const instructionNotif = document.createElement('div');
    instructionNotif.innerHTML = `
      <div style="font-size: 16px; margin-bottom: 8px;">🔍 Triggering search...</div>
      <div style="font-size: 14px; opacity: 0.9;">Click the bookmarklet again after the page reloads to build the overlay.</div>
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
    
    input.value = "_";
    
    setTimeout(() => {
      searchBtn.click();
      console.log("🔍 Search triggered. Click bookmarklet again after page reloads.");
    }, 2000); // Give user time to read the message
  } else {
    console.log("❌ Search form not found.");
  }
})();
