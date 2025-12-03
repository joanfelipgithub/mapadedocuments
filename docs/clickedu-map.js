(function () {
    // --- toggle map ---
    const EXISTING = document.getElementById("clickeduMapContainer");
    if (EXISTING) {
        EXISTING.remove();
        console.log("🧹 Map removed.");
        return;
    }

    console.log("🗺️ Building Clickedu Categorized Map…");

    // --- 1. Find all authorized links ---
    const rows = Array.from(document.querySelectorAll(
        "table tbody tr td table tbody tr td:nth-child(3) div span strong a"
    ));

    if (!rows.length) {
        console.warn("⚠ No document links found.");
        return;
    }

    // --- 2. Categories ---
    const categories = [
        "EAFP","EA","GA","POC","GRL","GQ","EAESO","PO","GC","EABAT","SOR","Gestio","GRH"
    ];
    const categoryMap = {};
    categories.push("Altres"); // catch-all

    categories.forEach(c => categoryMap[c] = []);

    // --- 3. Assign links to categories ---
    rows.forEach(a => {
        const text = a.innerText.trim();
        if (/obsolet/i.test(text)) return; // ignore obsolete

        // extract _CODE_ from text
        const match = text.match(/_(.*?)_/);
        let cat = "Altres";
        if (match && categories.includes(match[1])) cat = match[1];

        categoryMap[cat].push({element:a,text});
    });

    // --- 4. Build container ---
    const container = document.createElement("div");
    container.id = "clickeduMapContainer";
    Object.assign(container.style,{
        position:"fixed",
        top:"20px",
        right:"20px",
        width:"480px",
        maxHeight:"90vh",
        overflowY:"auto",
        padding:"12px",
        background:"white",
        borderRadius:"12px",
        boxShadow:"0 0 12px rgba(0,0,0,0.25)",
        zIndex:"999999",
    });
    document.body.appendChild(container);

    // --- 5. Strip Office Viewer ---
    function stripOfficeViewer(url){
        try {
            const u = new URL(url);
            if(u.hostname.includes("view.officeapps.live.com")){
                const direct = u.searchParams.get("src");
                if(direct) return decodeURIComponent(direct);
            }
        } catch(e){}
        return url;
    }

    // --- 6. Block Office Viewer ---
    document.addEventListener("click",function(ev){
        const a = ev.target.closest("a");
        if(!a) return;
        const href = a.href;
        const direct = stripOfficeViewer(href);
        if(direct !== href){
            ev.preventDefault();
            ev.stopImmediatePropagation();
            const dl=document.createElement("a");
            dl.href=direct;
            dl.download="";
            document.body.appendChild(dl);
            dl.click();
            dl.remove();
            console.log("🚫 OfficeViewer blocked → downloading:",direct);
        }
    },true);

    // --- 7. Build foldable categories with buttons ---
    Object.keys(categoryMap).forEach(cat=>{
        const links = categoryMap[cat];
        if(!links.length) return;

        // foldable header
        const header = document.createElement("div");
        header.innerText = cat + ` (${links.length})`;
        Object.assign(header.style,{
            fontWeight:"bold",
            cursor:"pointer",
            margin:"6px 0",
            padding:"4px 8px",
            background:"#ddd",
            borderRadius:"6px"
        });
        container.appendChild(header);

        // content container
        const content = document.createElement("div");
        content.style.display="none";
        content.style.gridTemplateColumns="repeat(3, 1fr)";
        content.style.gap="10px";
        content.style.marginBottom="6px";
        content.style.display="grid";
        container.appendChild(content);

        header.addEventListener("click",()=>{ 
            content.style.display = content.style.display==="none"?"grid":"none"; 
        });

        // add buttons
        links.forEach(item=>{
            const a = item.element;
            const textFull = item.text;
            const matchLabel = textFull.match(/^[^ _]+/);
            const label = matchLabel?matchLabel[0]:textFull;

            const btn = document.createElement("div");
            btn.innerText=label;
            Object.assign(btn.style,{
                width:"127px",
                height:"54px",
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                background:"#"+Math.floor(Math.random()*16777215).toString(16),
                color:"white",
                fontWeight:"bold",
                fontSize:"14px",
                borderRadius:"10px",
                cursor:"pointer",
                userSelect:"none",
                textAlign:"center",
                overflow:"hidden"
            });

            btn.addEventListener("click",e=>{
                e.stopPropagation();
                a.click();
            });

            content.appendChild(btn);
        });
    });

    console.log("✔ Categorized map generated.");
})();
