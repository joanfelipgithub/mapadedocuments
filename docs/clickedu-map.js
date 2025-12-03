// ===============
// Clickedu MAP v1
// ===============

(function () {
    const EXISTING = document.getElementById("clickeduMapContainer");
    if (EXISTING) {
        EXISTING.remove();
        console.log("🧹 Map removed.");
        return;
    }

    console.log("🗺️ Building Clickedu Map…");

    // --- 1. FIND ALL AUTHORIZED LINKS ---
    const rows = document.querySelectorAll(
        "table tbody tr td table tbody tr td:nth-child(3) div span strong a"
    );

    if (!rows.length) {
        console.warn("⚠ No document links found.");
        return;
    }

    // --- 2. BUILD MAP CONTAINER ---
    const container = document.createElement("div");
    container.id = "clickeduMapContainer";
    Object.assign(container.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "420px",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "12px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 0 12px rgba(0,0,0,0.25)",
        zIndex: "999999",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "10px",
    });

    document.body.appendChild(container);

    // --- 3. STRIP OFFICE VIEWER ---
    function stripOfficeViewer(url) {
        try {
            const u = new URL(url);
            if (u.hostname.includes("view.officeapps.live.com")) {
                const direct = u.searchParams.get("src");
                if (direct) return decodeURIComponent(direct);
            }
        } catch (e) {}
        return url;
    }

    // --- 4. BLOCK OFFICE VIEWER ---
    document.addEventListener(
        "click",
        function (ev) {
            const a = ev.target.closest("a");
            if (!a) return;

            const href = a.href;
            const direct = stripOfficeViewer(href);

            if (direct !== href) {
                ev.preventDefault();
                ev.stopImmediatePropagation();

                const dl = document.createElement("a");
                dl.href = direct;
                dl.download = "";
                document.body.appendChild(dl);
                dl.click();
                dl.remove();

                console.log("🚫 OfficeViewer blocked → downloading:", direct);
            }
        },
        true
    );

    // --- 5. CREATE SQUARE BUTTONS ---
    rows.forEach((a) => {
        const textFull = a.innerText.trim();

        // ignore obsolete items
        if (/obsolet/i.test(textFull)) return;

        // extract prefix until space or underscore
        const match = textFull.match(/^[^ _]+/);
        const label = (match ? match[0] : textFull).substring(0, 8);

        const url = a.href;

        const btn = document.createElement("div");
        btn.innerText = label;
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
            overflow: "hidden",
        });

        // simulate REAL link click → keeps permissions
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("▶ Simulated click for:", url);
            a.click();
        });

        container.appendChild(btn);
    });

    console.log("✔ Map generated.");
})();

