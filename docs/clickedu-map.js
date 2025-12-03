javascript:(()=>{
  const EXIST = document.getElementById("clickeduMapContainer");
  
  if (EXIST) {
    EXIST.remove();
    return;
  }
  
  // Check if we're on the target page in a new tab
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('clickedu_overlay') === 'true') {
    console.log('New tab detected, building overlay...');
    
    let loaded = false;
    const checkResults = setInterval(() => {
      const rows = Array.from(document.querySelectorAll("table tbody tr td table tbody tr td:nth-child(3) div span strong a"));
      console.log('Looking for results... found:', rows.length);
      
      if (rows.length && !loaded) {
        loaded = true;
        clearInterval(checkResults);
        
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
        
        const cats = ["EAFP", "EA", "GA", "POC", "GRL", "GQ", "EAESO", "PO", "GC", "EABAT", "SOR", "Gestio", "GRH"];
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
        
        function stripOfficeViewer(u) {
          try {
            const n = new URL(u);
            if (n.hostname.includes("view.officeapps.live.com")) {
              const d = n.searchParams.get("src");
              if (d) return decodeURIComponent(d);
            }
          } catch (e) {}
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
          }
        }, true);
        
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
              background: "#" + Math.floor(Math.random() * 16777215).toString(16),
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
              a.click();
            });
            content.appendChild(btn);
          });
        });
      }
    }, 300);
    
    return;
  }
  
  // First run - get the search form action URL
  console.log('Getting search URL...');
  
  const waitSearch = setInterval(() => {
    const form = document.querySelector("#frm_cercar");
    const input = document.querySelector("#p");
    
    if (form && input) {
      clearInterval(waitSearch);
      
      // Get the form action URL
      let actionUrl = form.action || window.location.href;
      
      // Build the search URL with parameters
      const formData = new FormData(form);
      formData.set('p', '_');
      
      const params = new URLSearchParams();
      for (let [key, value] of formData.entries()) {
        params.append(key, value);
      }
      
      // Add our special marker
      params.append('clickedu_overlay', 'true');
      
      const finalUrl = actionUrl + '?' + params.toString();
      
      console.log('Opening new tab with URL:', finalUrl);
      
      // Open in new tab
      const newTab = window.open(finalUrl, '_blank');
      
      if (!newTab) {
        alert('Please allow pop-ups for this site, then try again.');
      } else {
        // Inject our script into the new tab
        setTimeout(() => {
          try {
            const script = newTab.document.createElement('script');
            script.textContent = '(' + arguments.callee.toString() + ')();';
            newTab.document.head.appendChild(script);
          } catch (e) {
            console.log('Could not inject script (cross-origin), the new tab will need manual activation');
          }
        }, 1000);
      }
    }
  }, 100);
})();
