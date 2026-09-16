/* ============================================================
   Sauvegarde locale — export / import (remplace le compte cloud).
   • Aucun serveur, aucune inscription : la progression ne quitte l'appareil
     que si LE JOUEUR clique sur « Exporter », sous forme d'un fichier JSON
     qu'il télécharge lui-même.
   • « Importer » relit ce fichier et restaure la progression — sur le même
     appareil (après réinstallation, nettoyage du navigateur…) ou sur un
     autre, en copiant le fichier à la main.
   • Module AUTONOME comme l'était account.js : ne lit/écrit QUE les clés
     localStorage du jeu listées ci-dessous, aucune notion de gameplay ici.
   ============================================================ */
(function () {
  "use strict";
  // Même contrat de traduction que le reste du jeu (cf. i18n.js) : la clé du
  // dictionnaire est le texte français lui-même, affiché tel quel si aucune
  // traduction n'existe.
  const T = (tpl, vars) => (window.I18N ? window.I18N.t(tpl, vars) : (vars
    ? Object.keys(vars).reduce((a, k) => a.split("{" + k + "}").join(vars[k] == null ? "" : String(vars[k])), tpl)
    : tpl));

  // Exactement les clés que couvrait l'ancien compte cloud : carrière en
  // cours, panthéon (carrières terminées) et progression (niveau, jetons,
  // badges, quêtes…). PAS "openEleven_lang" : une préférence d'affichage,
  // pas une donnée de partie.
  const KEYS = ["openEleven_current", "destinDeChampion_pantheon", "destinDeChampion_progress"];

  const btnExport = document.getElementById("btn-export");
  const btnImport = document.getElementById("btn-import");
  const fileInput = document.getElementById("import-file-input");
  if (!btnExport || !btnImport || !fileInput) return;

  function hasLocalData() {
    return KEYS.some((k) => localStorage.getItem(k) != null);
  }
  function collectLocal() {
    const d = {};
    KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v != null) d[k] = v; });
    return d;
  }
  function pad2(n) { return String(n).padStart(2, "0"); }

  // ---- Export --------------------------------------------------------------
  function exportSave() {
    if (!hasLocalData()) {
      alert(T("Aucune sauvegarde à exporter pour l'instant : commencez une carrière, puis revenez ici."));
      return;
    }
    const payload = { app: "Road To The Glory", exportedAt: new Date().toISOString(), data: collectLocal() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const stamp = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `road-to-the-glory-save-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Révocation différée : certains navigateurs annulent le téléchargement
    // si l'URL objet est libérée immédiatement après le clic.
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---- Import --------------------------------------------------------------
  function looksLikeSave(obj) {
    return !!obj && typeof obj === "object" && !!obj.data && typeof obj.data === "object"
      && KEYS.some((k) => typeof obj.data[k] === "string");
  }

  function importSave(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try { parsed = JSON.parse(String(reader.result)); }
      catch (e) {
        alert(T("Ce fichier n'est pas une sauvegarde valide (JSON illisible)."));
        return;
      }
      if (!looksLikeSave(parsed)) {
        alert(T("Ce fichier ne ressemble pas à une sauvegarde Road To The Glory."));
        return;
      }
      const ok = confirm(T("Importer ce fichier remplacera votre progression actuelle sur cet appareil (carrière en cours, panthéon, niveau, jetons, badges…). Continuer ?"));
      if (!ok) return;
      // Comme l'ancien compte cloud : on n'écrit QUE les clés présentes dans
      // le fichier, on ne touche pas aux autres.
      KEYS.forEach((k) => { if (typeof parsed.data[k] === "string") localStorage.setItem(k, parsed.data[k]); });
      location.reload();
    };
    reader.onerror = () => alert(T("Impossible de lire ce fichier."));
    reader.readAsText(file);
  }

  btnExport.addEventListener("click", exportSave);
  btnImport.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = ""; // permet de réimporter un fichier du même nom plus tard
    if (file) importSave(file);
  });
})();
