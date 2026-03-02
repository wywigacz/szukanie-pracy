const JOB_SITES = [
  'pracuj.pl',
  'olx.pl/praca',
  'indeed.pl',
  'nofluffjobs.com',
  'justjoin.it',
  'bulldogjob.pl',
  'theprotocol.it',
  'linkedin.com/jobs',
  'gowork.pl',
  'rocketjobs.pl',
  'inhire.io',
  'solid.jobs',
  'flextail.pl',
  'aplikuj.pl'
];

const WORK_MODE_LABELS = {
  any: 'Dowolny',
  remote: 'Zdalny',
  hybrid: 'Hybrydowy',
  onsite: 'Biurowy'
};

const CONTRACT_LABELS = {
  any: 'Dowolny',
  uop: 'Umowa o prace',
  b2b: 'B2B',
  zlecenie: 'Umowa zlecenie'
};

export function buildSearchPromptText(profile, preferences, iterationNumber) {
  const sitesList = JOB_SITES.map(s => `- ${s}`).join('\n');

  const negativePrefText = preferences.negative.length > 0
    ? `\n\nBEZWZGLEDNIE WYKLUCZ nastepujace typy ofert (na podstawie wczesniejszych iteracji):\n${
        preferences.negative.map(p => `- ${p.reason} (slowa kluczowe do wykluczenia: ${p.keywords.join(', ')})`).join('\n')
      }`
    : '';

  const positivePrefText = preferences.positive.length > 0
    ? `\n\nPREFEROWANE - Szukaj ofert podobnych do tych, ktore mnie zainteresowaly:\n${
        preferences.positive.map(p => `- ${p.signal} (slowa kluczowe: ${p.keywords.join(', ')})`).join('\n')
      }`
    : '';

  const excludedCompanies = preferences.excludedCompanies?.length > 0
    ? `\n\nWYKLUCZONE FIRMY:\n${preferences.excludedCompanies.map(c => `- ${c}`).join('\n')}`
    : '';

  const salaryText = (profile.salaryExpectation?.min || profile.salaryExpectation?.max)
    ? `- Oczekiwania finansowe: minimum ${profile.salaryExpectation.min || '?'} PLN netto (${profile.salaryExpectation.max ? 'preferowane do ' + profile.salaryExpectation.max + ' PLN netto' : ''})`
    : '';

  const languagesText = profile.languages?.length > 0
    ? `- Jezyki: ${profile.languages.join(', ')}`
    : '';

  const skillsText = profile.skills?.length > 0
    ? `- Umiejetnosci: ${profile.skills.join(', ')}`
    : '';

  const roleText = profile.currentRole
    ? `- Dotychczasowe doswiadczenie: ${profile.currentRole}`
    : '- Otwarta na rozne stanowiska - nie szuka konkretnej roli';

  const educationText = profile.education
    ? `- Wyksztalcenie: ${profile.education}`
    : '';

  const cvText = profile.cvSummary
    ? `\nDODATKOWY KONTEKST O KANDYDACIE:\n${profile.cvSummary}`
    : '';

  return `Jestes ekspertem od rynku pracy w Polsce. Twoim zadaniem jest znalezienie ofert pracy WYLACZNIE ZDALNEJ dla kandydatki o wszechstronnym doswiadczeniu: e-commerce, administracja biurowa, handel miedzynarodowy (rynki wschodnie), fotografia i jezyk rosyjski.

Przeszukaj WSZYSTKIE ponizsze portale:
${sitesList}

PROFIL KANDYDATKI:
- Imie: ${profile.name}
${roleText}
- Doswiadczenie: ${profile.experienceYears || 0} lat
${languagesText}
${skillsText}
${educationText}
- Tryb pracy: WYLACZNIE PRACA ZDALNA (lokalizacja nie ma znaczenia)
- Typ umowy: ${CONTRACT_LABELS[profile.preferredContractType] || 'Dowolny'}
${salaryText}
${profile.linkedinUrl ? `- LinkedIn: ${profile.linkedinUrl}` : ''}
${cvText}

KLUCZOWE ATUTY KANDYDATKI (uwzglednij przy wyszukiwaniu):
1. E-COMMERCE (5 lat) - prowadzenie wlasnego sklepu (Shoper), Super Sprzedawca Allegro (100-300 zamowien/mies.), Etsy (rynki miedzynarodowe), IdoSell, Dawanda, Pakamera. Szukaj: specjalista e-commerce, marketplace manager, obsluga zamowien, koordynator sprzedazy online
2. ADMINISTRACJA BIUROWA (2 lata) - fakturowanie (Optima, SubiektGT), obsluga biura, dokumentacja, delegacje, kalendarz. Szukaj: asystentka zdalna, wirtualna asystentka, office manager zdalny, administrator dokumentow
3. HANDEL MIEDZYNARODOWY / ROSYJSKI (7 lat) - eksport na Ukraine, Rosje, Bialorus, kraje baltyckie. Targi w Kijowie, Minsku, Moskwie. Kontrakty zagraniczne, przychod 1+ mln zl/rok. Szukaj: koordynator eksportu, obsluga klienta rosyjskojezycznego, rynki wschodnie
4. JEZYK ROSYJSKI zaawansowany - komunikacja biznesowa, obsluga klientow rosyjskojezycznych, korespondencja handlowa. Szukaj: obsluga klienta rosyjskojezycznego, koordynator rynkow wschodnich, moderator rosyjskojezyczny
5. FOTOGRAFIA (nagradzana) - TOP20 Huawei Next Image, wygrane konkursy. Fotografia produktowa i reportazowa. Szukaj: fotograf produktowy zdalny, obrobka zdjec, content creator
6. SOCIAL MEDIA i CONTENT - prowadzenie mediow spolecznosciowych, zdjecia produktowe, analiza rynku. Szukaj: social media manager, content manager, copywriter
7. MS Excel (tabele przestawne), PowerPoint, systemy ERP (Optima, SubiektGT, IdoSell)

Mozliwe kierunki poszukiwan (szukaj WSZYSTKICH):
- Specjalista/koordynator e-commerce, marketplace specialist
- Wirtualna asystentka, asystent zdalny
- Obsluga klienta (szczegolnie rosyjskojezycznego)
- Administrator, koordynator biurowy zdalny
- Obsluga klienta rosyjskojezycznego, koordynator rynkow wschodnich
- Content creator, social media manager, copywriter
- Fotograf produktowy, obrobka zdjec
- Koordynator projektow, koordynator zamowien
- Data entry, wprowadzanie danych
- Moderator tresci
- Rekrutacja na rynki wschodnie
- Specjalista ds. eksportu (zdalnie)

BEZWZGLEDNE WYKLUCZENIA (NIGDY nie pokazuj takich ofert):
- Praca stacjonarna lub hybrydowa - TYLKO praca w pelni zdalna
- Stanowiska wymagajace pozyskiwania nowych klientow, cold callingu, sprzedazy aktywnej, telemarketingu, akwizycji
- Stanowiska wymagajace bieglego angielskiego (kandydatka zna angielski tylko podstawowo)
- Stanowiska programistyczne/developerskie
- Stanowiska tlumacza / tlumaczenia jako glowne obowiazki (rosyjski jest atutem dodatkowym, nie zawodem)
${negativePrefText}
${positivePrefText}
${excludedCompanies}

To jest iteracja numer ${iterationNumber}.${iterationNumber > 1 ? ' Wczesniejsze iteracje juz przeszukaly czesc ofert - szukaj NOWYCH ofert, ktore nie byly wczesniej prezentowane. Badz kreatywna w wyszukiwaniu - probuj nowych slow kluczowych i kombinacji.' : ''}

INSTRUKCJE:
1. Przeszukaj kazdy portal uzywajac ROZNYCH slow kluczowych: "e-commerce zdalna", "rosyjski", "asystentka zdalna", "obsluga zamowien", "marketplace", "allegro", "administrator zdalny", "social media", "content", "koordynator", "fotograf produktowy", "virtual assistant", "obsluga klienta zdalna" itp.
2. Zwroc MINIMUM 15 ofert pracy (im wiecej, tym lepiej)
3. Dla kazdej oferty podaj dane w DOKLADNIE tym formacie markdown:

## [Tytul stanowiska]
- **Firma**: [Nazwa firmy]
- **Lokalizacja**: [Lokalizacja firmy / "Praca zdalna"]
- **Tryb pracy**: [Zdalnie]
- **Wynagrodzenie**: [Widelki lub "Nie podano"]
- **Zrodlo**: [Nazwa portalu]
- **Link**: [URL do ogloszenia]
- **Opis**: [2-3 zdania opisujace stanowisko i wymagania]

---

WAZNE:
- Kazda oferta MUSI byc oddzielona linia "---"
- Podawaj PRAWDZIWE, aktualne linki do ofert
- Priorytetyzuj oferty gdzie doswiadczenie e-commerce, jezyk rosyjski lub administracja sa atutem
- ROZNORODNOSC - pokaz oferty z roznych branzy i o roznych stanowiskach
- Jesli oferta jest po angielsku, przetlumacz opis na polski
- Nie pokazuj ofert wymagajacych bieglego angielskiego lub programowania`;
}

export function buildEmailPromptText(profile, job, companyContext) {
  return `Jestes ekspertem od pisania skutecznych emaili aplikacyjnych w jezyku polskim.
Napisz spersonalizowany email aplikacyjny na ponizsze stanowisko.

STANOWISKO:
- Tytul: ${job.title}
- Firma: ${job.company}
- Lokalizacja: ${job.location || 'Nie podano'}
- Tryb pracy: ${job.workMode || 'Nie podano'}
- Opis: ${job.description || 'Brak opisu'}
${companyContext ? `\nDODATKOWE INFORMACJE O FIRMIE:\n${companyContext}` : ''}

PROFIL KANDYDATA:
- Imie i nazwisko: ${profile.name}
- Doswiadczenie: ${profile.experienceYears || 0} lat jako ${profile.currentRole || 'specjalista'}
- Kluczowe umiejetnosci: ${profile.skills?.join(', ') || 'Nie podano'}
- Jezyki: ${profile.languages?.join(', ') || 'Nie podano'}
- Wyksztalcenie: ${profile.education || 'Nie podano'}
- Podsumowanie CV:
${profile.cvSummary || 'Brak podsumowania'}

TECHNIKI PERSWAZJI DO ZASTOSOWANIA:
1. **Wspolny grunt**: Znajdz powiazania miedzy kandydatem a firma. Jesli firma dziala na rynkach wschodnich (Rosja, Ukraina, Bialorus, Kazachstan) - podkresz biegla znajomosc rosyjskiego. Jesli firma ceni roznorodnosc jezykowa - podkresz profil filologiczny. Jesli firma jest z Trojmiasta/Pomorza - wspomnij o zwiazku z regionem (UG).
2. **Konkretne osiagniecia firmy**: Wymien konkretne sukcesy lub projekty firmy i pokaz, jak kompetencje jezykowe i humanistyczne kandydata moga je wspierac (np. ekspansja na rynki wschodnie, obsluga klientow rosyjskojezycznych, tlumaczenia dokumentacji).
3. **Zasada wzajemnosci**: Zaproponuj konkretna wartosc - np. "moge pomoc w lokalizacji produktu na rynek rosyjskojezyczny" lub "moge przejac komunikacje z partnerami ze Wschodu".
4. **Dowod spoleczny**: Nawiaz do wyksztalcenia filologicznego (mgr, Uniwersytet Gdanski) jako gwarancji jakosci jezykowej i dbania o szczegoly.
5. **Storytelling**: Wplec krotka historie zwiazana z pasja do jezykow i kultur, ktora pokazuje kompetencje i zaangazowanie kandydata.
6. **Call to action**: Zakoncz konkretna propozycja rozmowy online (bo praca zdalna) z sugestia terminu.

WYMAGANIA FORMATU:
- Email w jezyku polskim
- Temat emaila (subject line) - przyciagajacy uwage, max 60 znakow
- Zwrot grzecznosciowy odpowiedni do kultury firmy
- Dlugosc: 250-400 slow
- Ton: profesjonalny ale ciepły, pewny siebie ale nie arogancki
- NIE uzywaj szablonowych fraz typu "Z wielkim zainteresowaniem..."
- Zakoncz podpisem z danymi kontaktowymi

FORMAT ODPOWIEDZI:
**Temat:** [temat emaila]

**Tresc:**
[pelna tresc emaila]

**Podpis:**
${profile.name}
${profile.email || ''}
${profile.phone || ''}
${profile.linkedinUrl || ''}`;
}
