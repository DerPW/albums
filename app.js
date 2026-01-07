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
                        let existing = albums.find(a => a.album.toLowerCase() === album.toLowerCase());
                        if (existing) {
                            existing.count++;
                            // Füge Interpret hinzu, falls noch nicht vorhanden
                            if (!Array.isArray(existing.artists)) {
                                existing.artists = [existing.artist];
                                delete existing.artist;
                            }
                            if (!existing.artists.some(art => art.toLowerCase() === artist.toLowerCase())) {
                                existing.artists.push(artist);
                            }
                            if (song && !existing.songs.includes(song)) existing.songs.push(song);
                            if (date && !existing.date) existing.date = date;
                        } else {
                            let songs = song ? [song] : [];
                            albums.push({ album, artists: [artist], count: 1, songs, date: date || null });
                        }
                    });
                } catch (err) {
                    alert('Fehler beim Importieren der CSV-Datei.');
                }
                filesRead++;
                if (filesRead === files.length) renderList(albumInput.value);
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
let currentSort = { field: 'count', direction: 'desc' };

// Set für ausgeklappte Alben global
const expandedAlbums = new Set();

// Render-Funktion mit neuer Suchlogik (inkl. Songnamen)
function renderList(filter = '') {
    // Vor dem Rendern: Merke ausgeklappte Alben
    expandedAlbums.clear();
    document.querySelectorAll('.album-item').forEach(item => {
        if (item && item.dataset.album && item.querySelector('.album-songs') && item.querySelector('.album-songs').style.display === 'block') {
            expandedAlbums.add(item.dataset.album);
        }
    });
    albumList.innerHTML = '';
    let filtered = albums;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = albums.filter(a => {
            const artistsList = Array.isArray(a.artists) ? a.artists : [a.artist];
            const artistsText = artistsList.join(' ');
            if ((a.album + ' ' + artistsText).toLowerCase().includes(q)) return true;
            if (a.songs && a.songs.some(song => song.toLowerCase().includes(q))) return true;
            return false;
        });
    }
    // Dynamische Sortierung basierend auf currentSort
    filtered = [...filtered].sort((a, b) => {
        let aVal, bVal;
        switch(currentSort.field) {
            case 'count':
                aVal = a.count || 0;
                bVal = b.count || 0;
                break;
            case 'year':
                aVal = a.date ? parseInt(a.date.split('-')[0]) : 0;
                bVal = b.date ? parseInt(b.date.split('-')[0]) : 0;
                break;
            case 'album':
                aVal = a.album.toLowerCase();
                bVal = b.album.toLowerCase();
                return currentSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            case 'artist':
                const artistsA = Array.isArray(a.artists) ? a.artists.join(', ') : (a.artist || '');
                const artistsB = Array.isArray(b.artists) ? b.artists.join(', ') : (b.artist || '');
                aVal = artistsA.toLowerCase();
                bVal = artistsB.toLowerCase();
                return currentSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    filtered.forEach(a => {
        const li = document.createElement('li');
        li.className = 'album-item';
        li.dataset.album = a.album;
        
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
        const artistsList = Array.isArray(a.artists) ? a.artists : [a.artist];
        // Jeden Artist einzeln rendern
        artistsList.forEach((artist, idx) => {
            const singleArtist = document.createElement('span');
            singleArtist.className = 'artist-chip';
            singleArtist.textContent = artist;
            singleArtist.title = 'Klicke, um diesen Interpreten zu suchen';
            singleArtist.style.cursor = 'pointer';
            singleArtist.addEventListener('click', function(e) {
                e.stopPropagation();
                albumInput.value = artist;
                renderList(artist);
            });
            artistSpan.appendChild(singleArtist);
            if (idx < artistsList.length - 1) {
                artistSpan.appendChild(document.createTextNode(', '));
            }
        });
        if (a.date) {
            const year = a.date.split('-')[0];
            artistSpan.appendChild(document.createTextNode(' • ' + year));
        }
        textContainer.appendChild(artistSpan);
        
        info.appendChild(textContainer);
        row.appendChild(info);
        
        // Button-Container für Copy und Delete
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'album-buttons';
        
        // Clipboard-Button für Album
        const copyAlbumBtn = document.createElement('button');
        copyAlbumBtn.className = 'copy-btn';
        copyAlbumBtn.title = 'Albumname kopieren';
        copyAlbumBtn.innerHTML = '<svg width="20" height="20" style="vertical-align:middle;"><use href="#icon-album" /></svg>';
        copyAlbumBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(a.album).then(() => {
                // Kurzes visuelles Feedback
                copyAlbumBtn.style.color = '#4caf50';
                setTimeout(() => {
                    copyAlbumBtn.style.color = '';
                }, 500);
                // Toast-Nachricht anzeigen
                showToast(`Album "${a.album}" kopiert`);
            }).catch(err => {
                console.error('Fehler beim Kopieren:', err);
            });
        };
        buttonContainer.appendChild(copyAlbumBtn);
        
        // Clipboard-Button für Interpret
        const copyArtistBtn = document.createElement('button');
        copyArtistBtn.className = 'copy-btn';
        copyArtistBtn.title = 'Interpret kopieren';
        copyArtistBtn.innerHTML = '<svg width="20" height="20" style="vertical-align:middle;"><use href="#icon-user" /></svg>';
        copyArtistBtn.onclick = (e) => {
            e.stopPropagation();
            const firstArtist = a.artists && a.artists.length > 0 ? a.artists[0] : '';
            navigator.clipboard.writeText(firstArtist).then(() => {
                // Kurzes visuelles Feedback
                copyArtistBtn.style.color = '#4caf50';
                setTimeout(() => {
                    copyArtistBtn.style.color = '';
                }, 500);
                // Toast-Nachricht anzeigen
                showToast(`Interpret "${firstArtist}" kopiert`);
            }).catch(err => {
                console.error('Fehler beim Kopieren:', err);
            });
        };
        buttonContainer.appendChild(copyArtistBtn);
        
        // Trashcan-Button
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.title = 'Album löschen';
        delBtn.innerHTML = '<svg width="20" height="20" style="vertical-align:middle;"><use href="#icon-trash" /></svg>';
        delBtn.onclick = () => {
            const idx = albums.findIndex(x => x.album === a.album);
            if (idx !== -1) {
                const albumName = albums[idx].album;
                const deletedAlbum = albums[idx];
                albums.splice(idx, 1);
                renderList(albumInput.value);
                showToast(`"${albumName}" gelöscht`, () => {
                    // Undo: Album wiederherstellen
                    albums.splice(idx, 0, deletedAlbum);
                    renderList(albumInput.value);
                    showToast(`"${albumName}" wiederhergestellt`);
                });
            }
        };
        buttonContainer.appendChild(delBtn);
        row.appendChild(buttonContainer);
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
                        // Songs ausgeklappt lassen, wenn Album vorher ausgeklappt war
            // Songs ausgeklappt lassen, wenn Album vorher ausgeklappt war
            if (expandedAlbums.has(a.album)) {
                songList.style.display = 'block';
            }
            li.appendChild(songList);
            li.style.cursor = 'pointer';
            li.addEventListener('click', function(e) {
                if (e.target.closest('.delete-btn')) return;
                if (songList.style.display === 'none') {
                    songList.style.display = 'block';
                    expandedAlbums.add(a.album);
                } else {
                    songList.style.display = 'none';
                    expandedAlbums.delete(a.album);
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
    const allArtists = albums.flatMap(a => Array.isArray(a.artists) ? a.artists : [a.artist]);
    const uniqueArtists = new Set(allArtists.map(art => art.toLowerCase())).size;
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

// Sortier-Buttons
const sortButtons = {
    sortCount: document.getElementById('sortCount'),
    sortYear: document.getElementById('sortYear'),
    sortAlbum: document.getElementById('sortAlbum'),
    sortArtist: document.getElementById('sortArtist')
};

function updateSortButtons() {
    Object.entries(sortButtons).forEach(([key, btn]) => {
        if (!btn) return;
        const field = key.replace('sort', '').toLowerCase();
        if (currentSort.field === field) {
            btn.classList.add('active');
            const arrow = currentSort.direction === 'asc' ? '↑' : '↓';
            btn.textContent = btn.textContent.replace(/[↑↓]/, arrow);
        } else {
            btn.classList.remove('active');
        }
    });
}

Object.entries(sortButtons).forEach(([key, btn]) => {
    if (!btn) return;
    const field = key.replace('sort', '').toLowerCase();
    btn.addEventListener('click', () => {
        if (currentSort.field === field) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = field;
            currentSort.direction = 'desc';
        }
        updateSortButtons();
        renderList(albumInput.value);
    });
});

updateSortButtons();

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
    // Clear-Button ist immer sichtbar, aber ggf. deaktiviert
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.disabled = !albumInput.value;
        clearBtn.setAttribute('aria-disabled', !albumInput.value);
    }
});

// Clear-Button Funktionalität
const clearSearchBtn = document.getElementById('clearSearchBtn');
if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
        albumInput.value = '';
        renderList('');
        albumInput.focus();
        clearSearchBtn.disabled = true;
        clearSearchBtn.setAttribute('aria-disabled', 'true');
    });
}

albumInput.addEventListener('keydown', e => {
    // Enter macht nichts mehr
});

document.addEventListener('click', e => {
    if (!suggestions.contains(e.target) && e.target !== albumInput) {
        suggestions.style.display = 'none';
    }
});

exportBtn.addEventListener('click', () => {
    // Konvertiere alle Alben zum neuen Format (artists als Array) und entferne source
    const exportAlbums = albums.map(a => {
        const {source, artist, ...rest} = a;
        // Stelle sicher, dass artists ein Array ist
        const artists = Array.isArray(a.artists) ? a.artists : (a.artist ? [a.artist] : []);
        return {
            ...rest,
            artists
        };
    });
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
                        const existing = albums.find(a => a.album.toLowerCase() === newAlbum.album.toLowerCase());
                        if (existing) {
                            existing.count += newAlbum.count || 1;
                            // Merge artists
                            const newArtists = Array.isArray(newAlbum.artists) ? newAlbum.artists : [newAlbum.artist];
                            if (!Array.isArray(existing.artists)) {
                                existing.artists = [existing.artist];
                                delete existing.artist;
                            }
                            newArtists.forEach(art => {
                                if (!existing.artists.some(a => a.toLowerCase() === art.toLowerCase())) {
                                    existing.artists.push(art);
                                }
                            });
                            if (newAlbum.date && !existing.date) existing.date = newAlbum.date;
                        } else {
                            const artists = Array.isArray(newAlbum.artists) ? newAlbum.artists : [newAlbum.artist];
                            albums.push({
                                album: newAlbum.album,
                                artists: artists,
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
            if (filesRead === files.length) renderList(albumInput.value);
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
    renderList('');
});

// Toast-Benachrichtigung anzeigen
function showToast(message, undoCallback) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);
    
    let timeoutId;
    
    // Wenn Undo-Callback vorhanden, Button hinzufügen
    if (undoCallback) {
        const undoBtn = document.createElement('button');
        undoBtn.className = 'toast-undo-btn';
        undoBtn.textContent = 'Rückgängig';
        undoBtn.onclick = () => {
            clearTimeout(timeoutId);
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
            undoCallback();
        };
        toast.appendChild(undoBtn);
    }
    
    toastContainer.appendChild(toast);
    
    // Toast einblenden
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Funktion zum Ausblenden
    const hideToast = () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    };
    
    // Toast nach 4 Sekunden ausblenden
    timeoutId = setTimeout(hideToast, 4000);
    
    // Hover-Effekt: Timer stoppen beim Hover
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
    });
    
    // Hover-Effekt: Timer neu starten beim Verlassen
    toast.addEventListener('mouseleave', () => {
        timeoutId = setTimeout(hideToast, 4000);
    });
}
