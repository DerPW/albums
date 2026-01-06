const sortCountSelect = document.getElementById('sortCountSelect');
let sortCountMode = 'none';
const deleteAllBtn = document.getElementById('deleteAllBtn');
// Alle löschen Button
if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
        if (confirm('Willst du wirklich alle Alben löschen?')) {
            albums = [];
            renderList(albumInput.value);
        }
    });
}
const importCsvBtn = document.getElementById('importCsvBtn');
const importCsvFile = document.getElementById('importCsvFile');
// Hilfsfunktion: CSV parsen (einfach, ohne Quotes)
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const artistIdx = header.findIndex(h => h.includes('artist') || h.includes('interpret'));
    const albumIdx = header.findIndex(h => h.includes('album'));
    const songIdx = header.findIndex(h => h.includes('song') || h.includes('titel') || h.includes('track'));
    const dateIdx = header.findIndex(h => h.includes('album date') || h === 'date' || h === 'year');
    if (artistIdx === -1 || albumIdx === -1) return [];
    function splitCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    return lines.slice(1).map(line => {
        const cols = splitCSVRow(line);
        // Entferne Anführungszeichen, falls vorhanden
        let artist = (cols[artistIdx] || '').trim().replace(/^"|"$/g, '');
        let album = (cols[albumIdx] || '').trim().replace(/^"|"$/g, '');
        let song = songIdx !== -1 ? (cols[songIdx] || '').trim().replace(/^"|"$/g, '') : null;
        let date = dateIdx !== -1 ? (cols[dateIdx] || '').trim().replace(/^"|"/g, '') : null;
        return { artist, album, song, date };
    }).filter(e => e.artist && e.album);
}

// CSV-Import Button
if (importCsvBtn && importCsvFile) {
    importCsvBtn.addEventListener('click', () => {
        importCsvFile.click();
    });
    importCsvFile.addEventListener('change', e => {
        const files = Array.from(importCsvFile.files);
        if (!files.length) return;
        let filesRead = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const entries = parseCSV(evt.target.result);
                    entries.forEach(({artist, album, song, date}) => {
                        let existing = albums.find(a => a.album.toLowerCase() === album.toLowerCase() && a.artist.toLowerCase() === artist.toLowerCase());
                        if (existing) {
                            existing.count++;
                            if (song && !existing.songs.includes(song)) existing.songs.push(song);
                            if (date && !existing.date) existing.date = date;
                        } else {
                            let songs = song ? [song] : [];
                            albums.push({ album, artist, count: 1, songs, date: date || null });
                        }
                    });
                } catch (err) {
                    alert('Fehler beim Importieren der CSV-Datei.');
                }
                filesRead++;
                if (filesRead === files.length) renderList();
            };
            reader.readAsText(file);
        });
        importCsvFile.value = '';
    });
}
const albumInput = document.getElementById('albumInput');
const addBtn = document.getElementById('addBtn');
const albumList = document.getElementById('albumList');
const suggestions = document.getElementById('suggestions');
const importBtn = document.getElementById('importBtn');
const importTxtBtn = document.getElementById('importTxtBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
// Textimport entfernt
// Text-Import Button
if (importTxtBtn && importTxtFile) {
    // Textimport entfernt
}

let albums = [];
// Render-Funktion mit neuer Suchlogik (inkl. Songnamen)
function renderList(filter = '') {
    albumList.innerHTML = '';
    let filtered = albums;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = albums.filter(a => {
            if ((a.album + ' ' + a.artist).toLowerCase().includes(q)) return true;
            if (a.songs && a.songs.some(song => song.toLowerCase().includes(q))) return true;
            return false;
        });
    }
    filtered = [...filtered].sort((a, b) => b.count - a.count);
    filtered.forEach(a => {
        const li = document.createElement('li');
        li.className = 'album-item';
        
        // Row für Badge, Text und Delete-Button
        const row = document.createElement('div');
        row.className = 'album-item-row';
        
        const info = document.createElement('div');
        info.className = 'album-info';
        
        // Badge vor dem Album-Text
        if (a.count > 1) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = a.count + '×';
            info.appendChild(badge);
        }
        
        // Container für Album + Artist
        const textContainer = document.createElement('div');
        textContainer.className = 'album-text-container';
        
        const albumSpan = document.createElement('div');
        albumSpan.className = 'album-title';
        albumSpan.textContent = a.album;
        textContainer.appendChild(albumSpan);
        
        const artistSpan = document.createElement('div');
        artistSpan.className = 'album-artist';
        artistSpan.textContent = a.artist;
        if (a.date) {
            const year = a.date.split('-')[0];
            artistSpan.textContent += ' • ' + year;
        }
        textContainer.appendChild(artistSpan);
        
        info.appendChild(textContainer);
        row.appendChild(info);
        
        // Trashcan-Button
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.title = 'Album löschen';
        delBtn.innerHTML = '<svg width="20" height="20" style="vertical-align:middle;"><use href="#icon-trash" /></svg>';
        delBtn.onclick = () => {
            const idx = albums.findIndex(x => x.album === a.album && x.artist === a.artist);
            if (idx !== -1) {
                albums.splice(idx, 1);
                renderList();
            }
        };
        row.appendChild(delBtn);
        li.appendChild(row);
        
        // Songliste unterhalb des Album-Items
        let songList = null;
        if (a.songs && a.songs.length > 0) {
            songList = document.createElement('ul');
            songList.className = 'album-songs';
            [...new Set(a.songs)].forEach(song => {
                const songLi = document.createElement('li');
                songLi.textContent = song;
                songList.appendChild(songLi);
            });
            songList.style.display = 'none';
            li.appendChild(songList);
            li.style.cursor = 'pointer';
            li.addEventListener('click', function(e) {
                if (e.target.closest('.delete-btn')) return;
                if (songList.style.display === 'none') {
                    songList.style.display = 'block';
                } else {
                    songList.style.display = 'none';
                }
            });
        }
        
        albumList.appendChild(li);
    });
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    const exportBtn = document.getElementById('exportBtn');
    const hasAlbums = albums.length > 0;
    if (deleteAllBtn) deleteAllBtn.disabled = !hasAlbums;
    if (exportBtn) exportBtn.disabled = !hasAlbums;
    
    // Update Statistiken
    updateStats();
}

function updateStats() {
    const uniqueArtists = new Set(albums.map(a => a.artist.toLowerCase())).size;
    const uniqueAlbums = albums.length;
    const uniqueSongs = new Set(albums.flatMap(a => a.songs || []).map(s => s.toLowerCase())).size;
    
    const artistCountEl = document.getElementById('artistCount');
    const albumCountEl = document.getElementById('albumCount');
    const songCountEl = document.getElementById('songCount');
    
    if (artistCountEl) artistCountEl.textContent = uniqueArtists;
    if (albumCountEl) albumCountEl.textContent = uniqueAlbums;
    if (songCountEl) songCountEl.textContent = uniqueSongs;
}
if (sortCountSelect) {
    // Sort-Dropdown entfernt
}

function renderSuggestions(query) {
    // Keine Vorschläge/Hints mehr anzeigen
    suggestions.innerHTML = '';
    suggestions.style.display = 'none';
}

function addAlbumFromInput() {
    // Hinzufügen deaktiviert
    return;
}

albumInput.addEventListener('input', e => {
    renderSuggestions(albumInput.value);
    renderList(albumInput.value);
});

albumInput.addEventListener('keydown', e => {
    // Enter macht nichts mehr
});

document.addEventListener('click', e => {
    if (!suggestions.contains(e.target) && e.target !== albumInput) {
        suggestions.style.display = 'none';
    }
});

exportBtn.addEventListener('click', () => {
    // Entferne source-Feld vor dem Export
    const exportAlbums = albums.map(({source, ...rest}) => rest);
    const data = JSON.stringify(exportAlbums, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alben.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', e => {
    const files = Array.from(importFile.files);
    if (!files.length) return;
    let filesRead = 0;
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                if (Array.isArray(imported)) {
                    // Merge logic: add counts if already exists
                    imported.forEach(newAlbum => {
                        const existing = albums.find(a => a.album.toLowerCase() === newAlbum.album.toLowerCase() && a.artist.toLowerCase() === newAlbum.artist.toLowerCase());
                        if (existing) {
                            existing.count += newAlbum.count || 1;
                            if (newAlbum.date && !existing.date) existing.date = newAlbum.date;
                        } else {
                            albums.push({
                                album: newAlbum.album,
                                artist: newAlbum.artist,
                                count: newAlbum.count || 1,
                                songs: newAlbum.songs || [],
                                date: newAlbum.date || null
                            });
                        }
                    });
                }
            } catch (err) {
                alert('Fehler beim Importieren der Datei.');
            }
            filesRead++;
            if (filesRead === files.length) renderList();
        };
        reader.readAsText(file);
    });
    importFile.value = '';
});

// Dark Mode Switch
function setDarkMode(on) {
    if (on) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
    if (on) {
        localStorage.setItem('darkmode', '1');
    } else {
        localStorage.removeItem('darkmode');
    }
}


// Darkmode sofort beim Laden setzen, noch bevor das DOM fertig ist
if (localStorage.getItem('darkmode')) {
    document.body.classList.add('dark');
}

document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Synchronisiere Schalter mit aktuellem Zustand
        darkModeToggle.checked = document.body.classList.contains('dark');
        darkModeToggle.addEventListener('change', e => {
            const checked = darkModeToggle.checked;
            console.log('Darkmode Toggle changed:', checked);
            setDarkMode(checked);
        });
    } else {
        console.warn('DarkModeToggle nicht gefunden!');
    }
    renderList();
});
