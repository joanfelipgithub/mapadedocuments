javascript:(function clickeduMain() {
  const EXIST = document.getElementById("clickeduMapContainer");
  if (EXIST) {
    EXIST.remove();
    localStorage.removeItem('clickeduBuildOverlay');
    localStorage.removeItem('clickeduScript');
    console.log("🧹 Map removed.");
    return;
  }

  console.log("⏳ ClickEdu map: initializing…");

  // Function to build the overlay
  function buildOverlay() {
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

    // --- Categories ---
    const cats = ["EAFP","EA","GA","POC","GRL","GQ","EAESO","PO","GC","EABAT","SOR","Gestio","GRH"];
    const catMap = {};
    cats.push("Altres");
    cats.forEach(c => catMap[c] = []);

    // --- Assign links to categories ---
    rows.forEach(a => {
      const t = a.innerText.trim();
      if (/obsolet/i.test(t)) return;
      const m = t.match(/_(.*?)_/);
      let cat = "Altres";
      if (m && cats.includes(m[1])) cat = m[1];
      catMap[cat].push({ element: a, text: t });
    });

    // --- Block Office Viewer ---
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

    // --- Build foldable categories ---
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

    // Clean up flags
    localStorage.removeItem('clickeduBuildOverlay');
    localStorage.removeItem('clickeduScript');
    console.log("🗺️ ClickEdu overlay ready!");
    return true;
  }

  // Check if we should auto-build after page reload
  if (localStorage.getItem('clickeduBuildOverlay') === 'true') {
    console.log("🔄 Detected page reload, building overlay...");
    
    // Try immediately
    if (buildOverlay()) {
      return;
    }
    
    // If not found, wait with MutationObserver
    let loaded = false;
    const observer = new MutationObserver(() => {
      if (loaded) return;
      if (buildOverlay()) {
        loaded = true;
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      observer.disconnect();
      localStorage.removeItem('clickeduBuildOverlay');
      localStorage.removeItem('clickeduScript');
      if (!loaded) {
        console.log("⏱️ Timeout: Results not found after page reload.");
      }
    }, 10000);
    
    return;
  }

  // First run: Check if results already exist
  if (buildOverlay()) {
    console.log("✨ Results already present!");
    return;
  }

  // No results yet, trigger search
  const input = document.querySelector("#p");
  const searchBtn = document.querySelector("#frm_cercar table tbody tr td:nth-child(2) a");
  
  if (input && searchBtn) {
    // Store the entire script in localStorage for auto-execution after reload
    const scriptCode = '(' + clickeduMain.toString() + ')();';
    localStorage.setItem('clickeduScript', scriptCode);
    localStorage.setItem('clickeduBuildOverlay', 'true');
    
    // Inject auto-runner that will execute after page loads
    const autoScript = document.createElement('script');
    autoScript.id = 'clickeduAutoRunner';
    autoScript.textContent = `
      (function() {
        window.addEventListener('DOMContentLoaded', function() {
          const storedScript = localStorage.getItem('clickeduScript');
          if (storedScript && localStorage.getItem('clickeduBuildOverlay') === 'true') {
            console.log('🚀 Auto-executing ClickEdu script after page load...');
            try {
              eval(storedScript);
            } catch(e) {
              console.error('❌ Auto-execution failed:', e);
              localStorage.removeItem('clickeduScript');
              localStorage.removeItem('clickeduBuildOverlay');
            }
          }
        });
      })();
    `;
    document.head.appendChild(autoScript);
    
    input.value = "_";
    searchBtn.click();
    console.log("🔍 Search triggered with '_' value. Page will reload and auto-build overlay...");
  } else {
    console.log("❌ Search form not found.");
  }
})();
