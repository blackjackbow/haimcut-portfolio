// Réservation d'un appel : le jour, puis l'heure, puis le formulaire.
// L'adresse du script Google se met dans data-api de #reserver ; sans elle, ou si le script ne répond pas, le bloc Instagram reste.
(() => {
  const section = document.getElementById('reserver');
  const API = section && section.dataset.api;
  if (!API) return;
  const boite = section.querySelector('.agenda-placeholder');
  const repli = boite.innerHTML;
  const ERREURS = {
    pris: 'Ce créneau vient d’être pris. Choisis-en un autre.',
    adresse: 'Tu as déjà deux demandes ou rendez-vous à venir avec cette adresse.',
    plein: 'Trop de demandes aujourd’hui. Écris-moi sur Instagram, je te réponds vite.',
    champs: 'Vérifie ton prénom et ton adresse mail.',
    occupe: 'Petit embouteillage, réessaie dans un instant.'
  };
  let fuseau = 'Europe/Paris', creneaux = [], pris = [], mois = '';

  const el = (tag, props = {}, ...enfants) => { const n = Object.assign(document.createElement(tag), props); n.append(...enfants); return n; };
  const date = (iso, o) => new Intl.DateTimeFormat('fr-FR', { timeZone: fuseau, ...o }).format(new Date(iso));
  const cleJour = iso => new Intl.DateTimeFormat('en-CA', { timeZone: fuseau }).format(new Date(iso));
  const afficher = (...enfants) => { boite.replaceChildren(...enfants); boite.classList.add('resa'); };
  const titre = texte => el('strong', { className: 'resa-titre', textContent: texte });
  const retour = (texte, action) => el('button', { type: 'button', className: 'resa-retour', textContent: '← ' + texte, onclick: action });
  const replier = () => { boite.classList.remove('resa'); boite.innerHTML = repli; };

  function jours() {
    const parJour = {}, tous = {};
    creneaux.forEach(iso => (parJour[cleJour(iso)] ||= []).push(iso));
    [...creneaux, ...pris].sort().forEach(iso => (tous[cleJour(iso)] ||= []).push(iso));
    const cles = Object.keys(parJour);
    if (!cles.length) return afficher(titre('Aucun créneau libre pour l’instant.'), el('div', { innerHTML: repli, className: 'resa-repli' }));
    // Grille du mois, semaine du lundi au dimanche ; seuls les jours avec un créneau libre sont cliquables.
    const moisListe = [...new Set(cles.map(k => k.slice(0, 7)))];
    if (!moisListe.includes(mois)) mois = moisListe[0];
    const [a, m] = mois.split('-').map(Number);
    const decalage = (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;
    const nbJours = new Date(Date.UTC(a, m, 0)).getUTCDate();
    const cases = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map(j => el('span', { className: 'resa-entete', textContent: j }));
    for (let i = 0; i < decalage; i++) cases.push(el('span'));
    for (let d = 1; d <= nbJours; d++) {
      const libres = parJour[`${mois}-${String(d).padStart(2, '0')}`];
      cases.push(el('button', { type: 'button', className: 'resa-jour', textContent: d, disabled: !libres,
        ariaLabel: libres ? date(libres[0], { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + libres.length + ' créneaux libres' : '',
        onclick: libres ? () => heures(tous[`${mois}-${String(d).padStart(2, '0')}`]) : null }));
    }
    const i = moisListe.indexOf(mois);
    const fleche = (texte, label, cible) => el('button', { type: 'button', className: 'resa-fleche', textContent: texte, ariaLabel: label,
      disabled: !cible, onclick: () => { mois = cible; jours(); } });
    afficher(titre('Choisis un jour'),
      el('div', { className: 'resa-mois' }, fleche('‹', 'Mois précédent', moisListe[i - 1]),
        el('span', { textContent: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(a, m - 1, 15)) }),
        fleche('›', 'Mois suivant', moisListe[i + 1])),
      el('div', { className: 'resa-cal' }, ...cases),
      el('p', { className: 'resa-note', textContent: 'Les jours en couleur ont des créneaux libres.' }));
  }

  function heures(liste) {
    afficher(titre(date(liste[0], { weekday: 'long', day: 'numeric', month: 'long' })),
      el('div', { className: 'resa-grille' }, ...liste.map(iso => {
        const libre = creneaux.includes(iso), h = date(iso, { hour: '2-digit', minute: '2-digit' });
        return el('button', { type: 'button', className: 'resa-choix' + (libre ? '' : ' resa-pris'), textContent: h, disabled: !libre,
          ariaLabel: h + (libre ? ', libre' : ', déjà pris'), onclick: libre ? () => formulaire(iso, liste) : null });
      })),
      el('p', { className: 'resa-note', textContent: 'Heure de Paris · en sable : libre · en gris : déjà pris' }), retour('Autre jour', jours));
  }

  function formulaire(iso, liste) {
    const message = el('p', { className: 'resa-message', role: 'status' });
    const champ = (nom, label, type, requis) => el('label', { className: 'resa-champ' }, label,
      el('input', { name: nom, type, required: requis, maxLength: nom === 'chaine' ? 200 : 120, autocomplete: { prenom: 'given-name', mail: 'email' }[nom] || 'off' }));
    const form = el('form', { className: 'resa-form' },
      champ('prenom', 'Prénom', 'text', true), champ('mail', 'Adresse mail', 'email', true),
      champ('chaine', 'Ta chaîne ou ton compte (facultatif)', 'text', false),
      el('label', { className: 'resa-piege', ariaHidden: 'true' }, 'Site', el('input', { name: 'site', tabIndex: -1, autocomplete: 'off' })),
      el('button', { type: 'submit', className: 'button', textContent: 'Réserver ce créneau' }), message);
    form.onsubmit = async e => {
      e.preventDefault();
      const bouton = form.querySelector('button[type=submit]');
      bouton.disabled = true; message.textContent = 'Envoi…';
      const corps = Object.fromEntries(new FormData(form)); corps.debut = iso;
      try {
        // text/plain : requête « simple », sans pré-contrôle OPTIONS qu'Apps Script ne sait pas servir.
        const r = await (await fetch(API, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(corps) })).json();
        if (r.ok) return afficher(titre('C’est réservé.'), el('p', { className: 'resa-note', textContent:
          'On s’appelle le ' + date(iso, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + '. L’invitation avec le lien de l’appel arrive dans ta boîte mail. Pas reçu ? Regarde dans tes indésirables.' }));
        message.textContent = ERREURS[r.erreur] || ERREURS.occupe;
        if (r.erreur === 'pris') { creneaux = creneaux.filter(x => x !== iso); pris.push(iso); return setTimeout(jours, 1800); }
      } catch (_) { message.textContent = ERREURS.occupe; }
      bouton.disabled = false;
    };
    afficher(titre(date(iso, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + date(iso, { hour: '2-digit', minute: '2-digit' })),
      form, retour('Autre heure', () => heures(liste)));
  }

  afficher(el('p', { className: 'resa-note', textContent: 'Chargement des créneaux…' }));
  fetch(API, { credentials: 'omit' }).then(r => r.json()).then(d => { fuseau = d.fuseau || fuseau; creneaux = d.creneaux || []; pris = d.pris || []; jours(); }).catch(replier);
})();
