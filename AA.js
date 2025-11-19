// Archivo: lectorpdf.js
// Ubicación: carpeta de scripts de Templater
// Uso en nota: <% tp.user.lectorpdf("ruta/archivo.pdf") %>

function lectorpdf(pdfPath = "") {
    if (!pdfPath) {
        pdfPath = prompt("Ingresa la ruta del PDF:");
        if (!pdfPath) return "";
    }

    // Cerrar modal previo si existe
    const prevModal = document.getElementById('pdf-viewer-modal');
    if (prevModal) prevModal.remove();

    setTimeout(() => {
        // Obtener archivo del vault
        const pdfFile = app.vault.getAbstractFileByPath(pdfPath);
        if (!pdfFile) {
            new Notice(`❌ No se encontró el archivo: ${pdfPath}`);
            return;
        }

        // Obtener la ruta real del recurso
        const resourcePath = app.vault.adapter.getResourcePath(pdfFile.path);

        let darkMode = true;

        function getColors() {
            if (darkMode) {
                return {
                    bg: '#1e1e1e',
                    bgSecondary: '#2d2d2d',
                    bgHover: '#3d3d3d',
                    text: 'white',
                    textSecondary: '#aaa',
                    border: '#555'
                };
            } else {
                return {
                    bg: '#f5f5f5',
                    bgSecondary: '#ffffff',
                    bgHover: '#e0e0e0',
                    text: '#222',
                    textSecondary: '#555',
                    border: '#ddd'
                };
            }
        }

        const colors = getColors();

        // Detectar si es móvil
        const isMobile = window.innerWidth <= 768;

        const modal = document.createElement('div');
        modal.id = 'pdf-viewer-modal';
        modal.innerHTML = `
            <style>
                #pdf-content-wrapper {
                    display: flex;
                    gap: 10px;
                    min-height: 0;
                    flex: 1;
                }
                
                #pdf-column {
                    flex: 1;
                    background: ${colors.bgSecondary};
                    border-radius: 8px;
                    overflow: hidden;
                    min-height: 400px;
                }
                
                #notes-column {
                    width: 350px;
                    background: ${colors.bgSecondary};
                    border: 1px solid ${colors.border};
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                }
                
                @media (max-width: 768px) {
                    #pdf-content-wrapper {
                        flex-direction: column !important;
                    }
                    
                    #pdf-column {
                        min-height: 50vh;
                        max-height: 60vh;
                    }
                    
                    #notes-column {
                        width: 100% !important;
                        max-height: 40vh;
                    }
                }
            </style>
            
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.95); z-index:9999; display:flex; flex-direction:column; padding:10px; box-sizing:border-box;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; align-items:center; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button id="toggle-notes-btn" style="background:#4CAF50; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:5px; font-weight:bold; font-size:12px;">Ocultar notas</button>
                        <button id="toggle-theme-btn" style="background:#607D8B; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:5px; font-weight:bold; font-size:12px;">${darkMode ? '☀️ Claro' : '🌙 Oscuro'}</button>
                    </div>
                    <button id="close-pdf-btn" style="background:#ff4444; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:5px; font-weight:bold; font-size:12px;">✕ Cerrar</button>
                </div>
                
                <div id="pdf-content-wrapper">
                    <div id="pdf-column">
                        <iframe id="pdf-iframe" src="${resourcePath}" style="width:100%; height:100%; border:none;"></iframe>
                    </div>
                    
                    <div id="notes-column">
                        <h3 style="color:${colors.text}; margin:0 0 15px 0; font-size:16px;">📝 Notas</h3>
                        
                        <textarea id="note-input" placeholder="Escribe tus notas aquí..." style="width:100%; height:100px; margin-bottom:10px; padding:10px; border-radius:5px; border:1px solid ${colors.border}; background:${colors.bg}; color:${colors.text}; resize:vertical; font-family:inherit; box-sizing:border-box; font-size:14px;"></textarea>
                        
                        <button id="add-note-btn" style="width:100%; padding:10px; margin-bottom:15px; background:#4CAF50; color:white; border:none; cursor:pointer; border-radius:5px; font-weight:bold; font-size:13px;">+ Agregar nota</button>
                        
                        <div id="saved-notes" style="display:flex; flex-direction:column; gap:10px;"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const toggleNotesBtn = modal.querySelector('#toggle-notes-btn');
        const toggleThemeBtn = modal.querySelector('#toggle-theme-btn');
        const closePdfBtn = modal.querySelector('#close-pdf-btn');
        const notesColumn = modal.querySelector('#notes-column');
        const addNoteBtn = modal.querySelector('#add-note-btn');
        const noteInput = modal.querySelector('#note-input');
        const savedNotes = modal.querySelector('#saved-notes');

        let notesVisible = true;

        toggleNotesBtn.onclick = () => {
            notesVisible = !notesVisible;
            notesColumn.style.display = notesVisible ? 'flex' : 'none';
            toggleNotesBtn.textContent = notesVisible ? 'Ocultar notas' : 'Mostrar notas';
        };

        toggleThemeBtn.onclick = () => {
            darkMode = !darkMode;
            modal.remove();
            document.removeEventListener('keydown', keyHandler);
            setTimeout(() => lectorpdf(pdfPath), 10);
        };

        closePdfBtn.onclick = () => {
            modal.remove();
            document.removeEventListener('keydown', keyHandler);
        };

        const keyHandler = (e) => {
            const activeEl = document.activeElement;
            if (activeEl.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape') {
                e.preventDefault();
                modal.remove();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);

        function addNote() {
            const text = noteInput.value.trim();
            if (!text) return;

            const colors = getColors();
            const noteDiv = document.createElement('div');
            noteDiv.style.cssText = `padding:12px; background:${colors.bg}; border-radius:5px; border-left:3px solid #4CAF50; position:relative;`;

            const timestamp = new Date().toLocaleString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            noteDiv.innerHTML = `
                <small style="color:${colors.textSecondary}; display:block; margin-bottom:8px; font-size:11px;">${timestamp}</small>
                <p style="margin:0; white-space:pre-wrap; color:${colors.text}; font-size:13px;">${text}</p>
                <button class="delete-note-btn" style="position:absolute; top:8px; right:8px; background:transparent; border:none; color:${colors.textSecondary}; font-size:20px; cursor:pointer; padding:0 5px; line-height:1;">×</button>
            `;

            noteDiv.querySelector('.delete-note-btn').onclick = () => {
                noteDiv.remove();
            };

            savedNotes.appendChild(noteDiv);
            noteInput.value = '';
        }

        addNoteBtn.onclick = addNote;

        noteInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                addNote();
            }
        });

    }, 10);

    return "";
}

module.exports = lectorpdf;