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
    // Check if the overlay has already been built (important for MutationObserver calls)
    if (document.getElementById("clickeduMapContainer")) {
        return true; 
    }
    
    // TEMPORARY DEBUG: Confirm the function is running on the search page
    console.log(`[DEBUG] buildOverlay running. URL: ${window.location.href}`);

    const rows = Array.from(document.querySelectorAll(
      "table tbody tr td table tbody tr td:nth-child(3) div span strong a"
    ));
    
    if (!rows.length) {
      if (localStorage.getItem(FLAG_NAME) !== 'true') {
         console.log("⚠️ No results found yet.");
      }
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

      // Foldable header
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

      // Content container (collapsed)
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

      // Buttons
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
    console.log("🗺️ ClickEdu overlay ready! (SUCCESS & CLEANUP)");
    localStorage.removeItem(FLAG_NAME);
    localStorage.removeItem(SCRIPT_NAME);
    return true;
  }

  // --- Scenario 1: Auto-Build After Page Reload Logic ---
  if (localStorage.getItem(FLAG_NAME) === 'true') {
    const startTime = performance.now();
    console.log(`🔄 Detected page reload, attempting to build overlay... Time: ${startTime.toFixed(2)}ms`);

    if (buildOverlay()) {
      return;
    }
    
    // If not found, set up MutationObserver to wait for results
    let loaded = false;
    const observer = new MutationObserver(() => {
      if (loaded) return;
      if (buildOverlay()) {
        loaded = true;
        observer.disconnect();
        const endTime = performance.now();
        console.log(`✔ Observer success. Total wait time: ${(endTime - startTime).toFixed(2)}ms`);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Safety Timeout (EXTENDED TO 20 SECONDS)
    setTimeout(() => {
      observer.disconnect();
      if (!loaded) {
        localStorage.removeItem(FLAG_NAME);
        localStorage.removeItem(SCRIPT_NAME);
        console.log("⏱️ Timeout: Results not found after page reload. (Flags cleaned)");
      }
    }, 20000); // 20 seconds
    
    return;
  }

  // --- Scenario 2: Initial Run & Search Trigger Logic ---
  
  if (buildOverlay()) {
    console.log("✨ Results already present on initial run!");
    return;
  }

  // NEW: Wait for search elements to ensure they are loaded
  function waitForSearchElements(attempts = 0) {
      const input = document.querySelector("#p");
      const searchBtn = document.querySelector("#frm_cercar table tbody tr td:nth-child(2) a");

      if (input && searchBtn && input.value !== "_") {
          // Success: Elements found, proceed to trigger search
          triggerSearch(input, searchBtn);
      } else if (attempts < 10) {
          // Not found yet, wait 100ms and try again
          setTimeout(() => waitForSearchElements(attempts + 1), 100);
      } else {
          // Timeout: Elements never appeared
          console.log("❌ Search form elements not found after waiting 1 second.");
          localStorage.removeItem(FLAG_NAME); 
          localStorage.removeItem(SCRIPT_NAME);
      }
  }

  function triggerSearch(input, searchBtn) {
      // 1. Store the entire script code and flag for re-execution
      const scriptCode = '(' + clickeduMain.toString() + ')();';
      localStorage.setItem(SCRIPT_NAME, scriptCode);
      localStorage.setItem(FLAG_NAME, 'true');
      
      // 2. Inject auto-runner to trigger the main script on the next page load
      const autoScript = document.createElement('script');
      autoScript.id = 'clickeduAutoRunner';
      autoScript.textContent = `
          (function() {
              const SCRIPT_NAME = '${SCRIPT_NAME}';
              const FLAG_NAME = '${FLAG_NAME}';
              
              window.addEventListener('DOMContentLoaded', function() {
                  const storedScript = localStorage.getItem(SCRIPT_NAME);
                  if (storedScript && localStorage.getItem(FLAG_NAME) === 'true') {
                      console.log('🚀 Auto-executing ClickEdu script after page load...');
                      try {
                          (1,eval)(storedScript);
                      } catch(e) {
                          console.error('❌ Auto-execution failed:', e);
                          localStorage.removeItem(SCRIPT_NAME);
                          localStorage.removeItem(FLAG_NAME);
                      }
                  }
              }, { once: true });
          })();
      `;
      document.head.appendChild(autoScript);
      
      // 3. Perform the search (causes page reload)
      input.value = "_";
      searchBtn.click();
      console.log("🔍 Search triggered with '_' value. Page will reload and auto-build overlay...");
  }
  
  // Start the wait process
  waitForSearchElements();
})();
