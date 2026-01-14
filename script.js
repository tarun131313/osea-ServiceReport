// OSEA Service Report Form - JavaScript

// Global variables
let machineCount = 0;
let navVisible = true;
let engineers = []; // Array of {title, name} objects

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
    document.getElementById('arrivalDate').value = today;

    // Generate unique report number
    document.getElementById('reportNo').textContent = generateReportNumber();

    // Initialize navigation
    initNavigation();

    // Add first machine
    addMachine();

    // Load any saved draft
    loadDraft();

    // Engineer input enter key
    document.getElementById('engineerInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addEngineer();
        }
    });

    // Date sync: When one date is changed, sync the other if empty or update calendar view
    document.getElementById('arrivalDate').addEventListener('change', function() {
        const departureDate = document.getElementById('departureDate');
        if (!departureDate.value || departureDate.value < this.value) {
            departureDate.value = this.value;
        }
    });

    document.getElementById('departureDate').addEventListener('change', function() {
        const arrivalDate = document.getElementById('arrivalDate');
        if (!arrivalDate.value) {
            arrivalDate.value = this.value;
        }
    });

    // Initialize representatives (add empty OSEA rep if none from engineers)
    syncEngineersToOseaReps();
    initDragAndDrop();
});

// ==================== NAVIGATION FUNCTIONS ====================

const isMobile = () => window.innerWidth <= 768;

function initNavigation() {
    const nav = document.getElementById('nav-sidebar');
    const overlay = document.getElementById('nav-overlay');
    const toggleBtn = document.getElementById('nav-toggle-btn');

    // Set up overlay click handler
    if (overlay) {
        overlay.onclick = toggleNavigation;
    }

    // Set up toggle button click handler
    if (toggleBtn) {
        toggleBtn.onclick = toggleNavigation;
    }

    // Set initial state based on screen size
    if (isMobile()) {
        navVisible = false;
        nav.classList.add('hidden');
        toggleBtn.classList.add('nav-hidden');
        document.body.classList.add('nav-closed');
    }

    updateNavigation();
}

function toggleNavigation() {
    const nav = document.getElementById('nav-sidebar');
    const toggleBtn = document.getElementById('nav-toggle-btn');
    const overlay = document.getElementById('nav-overlay');

    navVisible = !navVisible;

    if (isMobile()) {
        if (navVisible) {
            nav.classList.remove('hidden');
            nav.classList.add('visible');
            overlay.classList.add('visible');
            toggleBtn.classList.remove('nav-hidden');
        } else {
            nav.classList.add('hidden');
            nav.classList.remove('visible');
            overlay.classList.remove('visible');
            toggleBtn.classList.add('nav-hidden');
        }
    } else {
        if (navVisible) {
            nav.classList.remove('hidden');
            toggleBtn.classList.remove('nav-hidden');
            document.body.classList.remove('nav-closed');
        } else {
            nav.classList.add('hidden');
            toggleBtn.classList.add('nav-hidden');
            document.body.classList.add('nav-closed');
        }
    }
}

function updateNavigation() {
    const nav = document.getElementById('nav-sidebar');
    if (!nav) return;

    const machines = document.querySelectorAll('.machine-card');

    let navHTML = `
        <div class="nav-header">
            <h4>Navigation</h4>
            <button class="nav-close-btn" onclick="toggleNavigation()" title="Close">✕</button>
        </div>
        <div class="nav-section">
            <div class="nav-section-title">Form Sections</div>
            <button class="nav-item" onclick="scrollToSection('report-details'); closeMobileNav()">
                <span class="nav-icon">📋</span> Report Details
            </button>
            <button class="nav-item" onclick="scrollToSection('client-details'); closeMobileNav()">
                <span class="nav-icon">🏢</span> Client Details
            </button>
            <button class="nav-item" onclick="scrollToSection('visit-details'); closeMobileNav()">
                <span class="nav-icon">📅</span> Visit Details
            </button>
        </div>
        <div class="nav-divider"></div>
        <div class="nav-section">
            <div class="nav-section-title">Machines (${machines.length})</div>
    `;

    machines.forEach((machine, index) => {
        const machineId = machine.id;
        const isCollapsed = machine.classList.contains('collapsed') ? ' 📁' : '';
        navHTML += `
            <button class="nav-item machine-nav" onclick="scrollToSection('${machineId}'); closeMobileNav()">
                <span class="nav-icon">🔧</span> Machine ${index + 1}${isCollapsed}
            </button>
        `;
    });

    navHTML += `
        </div>
        <div class="nav-divider"></div>
        <div class="nav-section">
            <button class="nav-item" onclick="scrollToSection('general-recommendations'); closeMobileNav()">
                <span class="nav-icon">💡</span> Recommendations
            </button>
            <button class="nav-item" onclick="scrollToSection('signatures'); closeMobileNav()">
                <span class="nav-icon">✍️</span> Signatures
            </button>
        </div>
        <div class="nav-divider"></div>
        <button class="nav-item nav-add-machine" onclick="addMachine(); closeMobileNav()">
            <span class="nav-icon">➕</span> Add Machine
        </button>
    `;

    nav.innerHTML = navHTML;
}

function closeMobileNav() {
    if (isMobile() && navVisible) {
        toggleNavigation();
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        // Expand machine if it's collapsed
        if (section.classList.contains('machine-card') && section.classList.contains('collapsed')) {
            section.classList.remove('collapsed');
            updateNavigation();
        }
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Handle window resize
window.addEventListener('resize', function() {
    const nav = document.getElementById('nav-sidebar');
    const toggleBtn = document.getElementById('nav-toggle-btn');
    const overlay = document.getElementById('nav-overlay');

    if (!nav || !toggleBtn) return;

    if (isMobile()) {
        if (navVisible) {
            navVisible = false;
            nav.classList.add('hidden');
            nav.classList.remove('visible');
            overlay.classList.remove('visible');
            toggleBtn.classList.add('nav-hidden');
        }
        document.body.classList.add('nav-closed');
    } else {
        overlay.classList.remove('visible');
        if (!navVisible) {
            document.body.classList.add('nav-closed');
        } else {
            document.body.classList.remove('nav-closed');
        }
    }
});

// ==================== ENGINEER FUNCTIONS ====================

function addEngineer() {
    const titleSelect = document.getElementById('engineerTitle');
    const input = document.getElementById('engineerInput');
    const title = titleSelect.value;
    const name = input.value.trim();

    // Check if name already exists
    const exists = engineers.some(eng => eng.name === name);

    if (name && !exists) {
        engineers.push({ title, name });
        renderEngineers();
        input.value = '';
        titleSelect.value = 'Mr.'; // Reset to default
    }
    input.focus();
}

function removeEngineer(index) {
    engineers.splice(index, 1);
    renderEngineers();
}

function renderEngineers() {
    const container = document.getElementById('engineersContainer');
    container.innerHTML = engineers.map((eng, i) => `
        <span class="engineer-tag">
            ${eng.title} ${eng.name}
            <button type="button" onclick="removeEngineer(${i})">×</button>
        </span>
    `).join('');

    // Auto-populate OSEA representatives from engineers
    syncEngineersToOseaReps();
}

function syncEngineersToOseaReps() {
    const oseaReps = document.getElementById('osea-reps');
    if (!oseaReps) return;

    // Get existing reps data to preserve designations (title comes from engineer)
    const existingReps = {};
    oseaReps.querySelectorAll('.rep-item').forEach(item => {
        const name = item.querySelector('.rep-name').value;
        const designation = item.querySelector('.rep-designation').value;
        if (name) existingReps[name] = designation;
    });

    // Clear and rebuild
    oseaReps.innerHTML = '';

    engineers.forEach(eng => {
        const designation = existingReps[eng.name] || 'Service Engineer';
        addOseaRepWithData(eng.title, eng.name, designation);
    });

    // If no engineers, add empty row
    if (engineers.length === 0) {
        addOseaRep();
    }

    initDragAndDrop();
}

// ==================== REPRESENTATIVE FUNCTIONS ====================

function addOseaRep(btn) {
    addOseaRepWithData('Mr.', '', '', btn);
}

function addOseaRepWithData(title, name, designation, btn) {
    const list = document.getElementById('osea-reps');
    const item = document.createElement('div');
    item.className = 'rep-item';
    item.draggable = true;
    item.innerHTML = `
        <span class="drag-handle">⋮⋮</span>
        <select class="rep-title">
            <option value="Mr."${title === 'Mr.' ? ' selected' : ''}>Mr.</option>
            <option value="Mrs."${title === 'Mrs.' ? ' selected' : ''}>Mrs.</option>
            <option value="Miss"${title === 'Miss' ? ' selected' : ''}>Miss</option>
            <option value="Ms."${title === 'Ms.' ? ' selected' : ''}>Ms.</option>
            <option value="Dr."${title === 'Dr.' ? ' selected' : ''}>Dr.</option>
        </select>
        <input type="text" class="rep-name" placeholder="Name" value="${name}">
        <input type="text" class="rep-designation" placeholder="Designation" value="${designation}">
        <button class="add-rep-btn-inline" onclick="addOseaRep(this)">+</button>
        <button class="remove-rep-btn" onclick="removeRep(this)">×</button>
    `;

    if (btn) {
        const currentItem = btn.closest('.rep-item');
        currentItem.insertAdjacentElement('afterend', item);
    } else {
        list.appendChild(item);
    }

    initDragAndDrop();
    if (!name) item.querySelector('.rep-name').focus();
}

function addClientRep(btn) {
    const list = document.getElementById('client-reps');
    const item = document.createElement('div');
    item.className = 'rep-item';
    item.draggable = true;
    item.innerHTML = `
        <span class="drag-handle">⋮⋮</span>
        <select class="rep-title">
            <option value="Mr." selected>Mr.</option>
            <option value="Mrs.">Mrs.</option>
            <option value="Miss">Miss</option>
            <option value="Ms.">Ms.</option>
            <option value="Dr.">Dr.</option>
        </select>
        <input type="text" class="rep-name" placeholder="Name">
        <input type="text" class="rep-designation" placeholder="Designation">
        <button class="add-rep-btn-inline" onclick="addClientRep(this)">+</button>
        <button class="remove-rep-btn" onclick="removeRep(this)">×</button>
    `;

    if (btn) {
        const currentItem = btn.closest('.rep-item');
        currentItem.insertAdjacentElement('afterend', item);
    } else {
        list.appendChild(item);
    }

    initDragAndDrop();
    item.querySelector('.rep-name').focus();
}

function removeRep(btn) {
    const item = btn.parentElement;
    const list = item.parentElement;

    // Keep at least one row
    if (list.querySelectorAll('.rep-item').length <= 1) {
        item.querySelector('.rep-title').value = 'Mr.';
        item.querySelector('.rep-name').value = '';
        item.querySelector('.rep-designation').value = '';
        return;
    }

    item.remove();
}

// Drag and Drop for reordering
let draggedItem = null;

function initDragAndDrop() {
    document.querySelectorAll('.rep-item').forEach(item => {
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragend', handleDragEnd);
        item.removeEventListener('dragover', handleDragOver);
        item.removeEventListener('drop', handleDrop);
        item.removeEventListener('dragleave', handleDragLeave);

        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.rep-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Only allow drop within same list
    if (draggedItem && this.parentElement === draggedItem.parentElement && this !== draggedItem) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedItem && this !== draggedItem && this.parentElement === draggedItem.parentElement) {
        const list = this.parentElement;
        const items = Array.from(list.children);
        const draggedIndex = items.indexOf(draggedItem);
        const dropIndex = items.indexOf(this);

        if (draggedIndex < dropIndex) {
            this.insertAdjacentElement('afterend', draggedItem);
        } else {
            this.insertAdjacentElement('beforebegin', draggedItem);
        }
    }
}

function getOseaReps() {
    const reps = [];
    document.querySelectorAll('#osea-reps .rep-item').forEach(item => {
        const title = item.querySelector('.rep-title')?.value || 'Mr.';
        const name = item.querySelector('.rep-name').value.trim();
        const designation = item.querySelector('.rep-designation').value.trim();
        if (name) reps.push({ title, name, designation });
    });
    return reps;
}

function getClientReps() {
    const reps = [];
    document.querySelectorAll('#client-reps .rep-item').forEach(item => {
        const title = item.querySelector('.rep-title')?.value || 'Mr.';
        const name = item.querySelector('.rep-name').value.trim();
        const designation = item.querySelector('.rep-designation').value.trim();
        if (name) reps.push({ title, name, designation });
    });
    return reps;
}

// ==================== MACHINE FUNCTIONS ====================

function addMachine() {
    machineCount++;
    const container = document.getElementById('machines-container');
    const machineId = `machine-${machineCount}`;

    const machineHTML = `
        <div class="machine-card" id="${machineId}">
            <div class="machine-header" onclick="toggleMachineCollapse('${machineId}')">
                <h3>
                    <span class="collapse-icon">▼</span>
                    Machine ${machineCount}
                </h3>
                <div class="header-buttons">
                    <button class="collapse-btn" onclick="event.stopPropagation(); toggleMachineCollapse('${machineId}')">
                        Collapse
                    </button>
                    <button class="remove-btn" onclick="event.stopPropagation(); removeMachine('${machineId}')">
                        Remove
                    </button>
                </div>
            </div>
            <div class="machine-body">
                <!-- Machine Info -->
                <div class="subsection">
                    <div class="subsection-title">Machine Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Machine Name/Type</label>
                            <input type="text" class="machine-name" placeholder="e.g., Extrusion Lamination Machine">
                        </div>
                        <div class="form-group small">
                            <label>Serial Number</label>
                            <input type="text" class="serial-number" placeholder="Serial #">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group small">
                            <label>Make</label>
                            <input type="text" class="machine-make" placeholder="Manufacturer">
                        </div>
                        <div class="form-group small">
                            <label>Model</label>
                            <input type="text" class="machine-model" placeholder="Model">
                        </div>
                        <div class="form-group small">
                            <label>Year</label>
                            <select class="machine-year">
                                <option value="">Select</option>
                                ${generateYearOptions()}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Problem Reported -->
                <div class="subsection">
                    <div class="subsection-title">Problem Reported by Client</div>
                    <div class="form-group">
                        <textarea class="problem-reported" placeholder="Describe the issue reported by the client..."></textarea>
                    </div>
                </div>

                <!-- Observations -->
                <div class="subsection list-section">
                    <div class="subsection-title">Observations</div>
                    <div class="observations-list" id="${machineId}-observations">
                        <div class="list-item">
                            <span class="item-number">1.</span>
                            <input type="text" placeholder="Enter observation...">
                            <button class="add-item-btn" onclick="addObservation('${machineId}', this)" title="Add row">+</button>
                            <button class="remove-item-btn" onclick="removeListItem(this)" title="Remove">×</button>
                        </div>
                    </div>
                </div>

                <!-- Activities -->
                <div class="subsection list-section">
                    <div class="subsection-title">Activities Performed</div>
                    <div class="activities-list" id="${machineId}-activities">
                        <div class="list-item">
                            <span class="item-number">1.</span>
                            <input type="text" placeholder="Enter activity...">
                            <button class="add-item-btn" onclick="addActivity('${machineId}', this)" title="Add row">+</button>
                            <button class="remove-item-btn" onclick="removeListItem(this)" title="Remove">×</button>
                        </div>
                    </div>
                </div>

                <!-- Conclusions -->
                <div class="subsection list-section">
                    <div class="subsection-title">Conclusions</div>
                    <div class="conclusions-list" id="${machineId}-conclusions">
                        <div class="list-item bullet">
                            <span class="item-bullet">•</span>
                            <input type="text" placeholder="Enter conclusion...">
                            <button class="add-item-btn" onclick="addConclusion('${machineId}', this)" title="Add row">+</button>
                            <button class="remove-item-btn" onclick="removeListItem(this)" title="Remove">×</button>
                        </div>
                    </div>
                </div>

                <!-- Current Status -->
                <div class="subsection">
                    <div class="subsection-title">Current Machine Status</div>
                    <div class="form-group">
                        <div class="checkbox-group">
                            <label class="checkbox-item" onclick="toggleCheckbox(this)">
                                <input type="checkbox" class="status-operational" value="Operational"> Operational
                            </label>
                            <label class="checkbox-item" onclick="toggleCheckbox(this)">
                                <input type="checkbox" class="status-partial" value="Partially Operational"> Partially Operational
                            </label>
                            <label class="checkbox-item" onclick="toggleCheckbox(this)">
                                <input type="checkbox" class="status-down" value="Down/Non-functional"> Down
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Status Notes</label>
                        <textarea class="status-notes" placeholder="Additional notes about current status..."></textarea>
                    </div>
                </div>

                <!-- Pending Actions -->
                <div class="subsection">
                    <div class="subsection-title">Pending Actions</div>
                    <table class="dynamic-table" id="${machineId}-pending">
                        <thead>
                            <tr>
                                <th>Action Required</th>
                                <th>Responsibility</th>
                                <th>Target Date</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="text" placeholder="Action required..."></td>
                                <td><select class="responsibility-select"><option value="">Select...</option><option value="OSEA">OSEA</option><option value="Client">Client</option><option value="Both">Both</option></select></td>
                                <td><input type="date"></td>
                                <td class="action-buttons">
                                    <button class="add-row-btn" onclick="addPendingAction('${machineId}', this)" title="Add row">+</button>
                                    <button class="remove-row-btn" onclick="removeTableRow(this)" title="Remove">×</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Parts Required -->
                <div class="subsection">
                    <div class="subsection-title">Parts/Materials Required</div>
                    <table class="dynamic-table" id="${machineId}-parts">
                        <thead>
                            <tr>
                                <th>Part Description</th>
                                <th>Qty</th>
                                <th>Remarks</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="text" placeholder="Part description..."></td>
                                <td><input type="text" placeholder="Qty" style="width: 60px;"></td>
                                <td><input type="text" placeholder="Remarks..."></td>
                                <td class="action-buttons">
                                    <button class="add-row-btn" onclick="addPart('${machineId}', this)" title="Add row">+</button>
                                    <button class="remove-row-btn" onclick="removeTableRow(this)" title="Remove">×</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', machineHTML);
    updateMachineNumbers();
    updateNavigation();

    // Scroll to new machine only if not the first one (on page load)
    if (machineCount > 1) {
        setTimeout(() => {
            document.getElementById(machineId).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function removeMachine(machineId) {
    if (document.querySelectorAll('.machine-card').length <= 1) {
        showStatus('At least one machine is required', 'error');
        return;
    }
    if (confirm('Remove this machine?')) {
        document.getElementById(machineId).remove();
        updateMachineNumbers();
        updateNavigation();
    }
}

function updateMachineNumbers() {
    const machines = document.querySelectorAll('.machine-card');
    machines.forEach((machine, index) => {
        const header = machine.querySelector('.machine-header h3');
        const icon = header.querySelector('.collapse-icon');
        header.innerHTML = '';
        header.appendChild(icon);
        header.appendChild(document.createTextNode(` Machine ${index + 1}`));
    });
}

function toggleMachineCollapse(machineId) {
    const machine = document.getElementById(machineId);
    if (machine) {
        machine.classList.toggle('collapsed');
        updateNavigation();
    }
}

// ==================== LIST FUNCTIONS ====================

function addObservation(machineId, btn) {
    const list = document.getElementById(`${machineId}-observations`);
    const newItem = document.createElement('div');
    newItem.className = 'list-item';
    newItem.innerHTML = `
        <span class="item-number">1.</span>
        <input type="text" placeholder="Enter observation...">
        <button class="add-item-btn" onclick="addObservation('${machineId}', this)" title="Add row">+</button>
        <button class="remove-item-btn" onclick="removeListItem(this)" title="Remove">×</button>
    `;

    if (btn) {
        // Insert after the row containing this button
        const currentRow = btn.parentElement;
        currentRow.insertAdjacentElement('afterend', newItem);
    } else {
        // Append at end (for initial row)
        list.appendChild(newItem);
    }

    renumberList(list);
    newItem.querySelector('input').focus();
}

function addActivity(machineId, btn) {
    const list = document.getElementById(`${machineId}-activities`);
    const newItem = document.createElement('div');
    newItem.className = 'list-item';
    newItem.innerHTML = `
        <span class="item-number">1.</span>
        <input type="text" placeholder="Enter activity...">
        <button class="add-item-btn" onclick="addActivity('${machineId}', this)" title="Add row">+</button>
        <button class="remove-item-btn" onclick="removeListItem(this)" title="Remove">×</button>
    `;

    if (btn) {
        const currentRow = btn.parentElement;
        currentRow.insertAdjacentElement('afterend', newItem);
    } else {
        list.appendChild(newItem);
    }

    renumberList(list);
    newItem.querySelector('input').focus();
}

function addConclusion(machineId, btn) {
    const list = document.getElementById(`${machineId}-conclusions`);
    const newItem = document.createElement('div');
    newItem.className = 'list-item bullet';
    newItem.innerHTML = `
        <span class="item-bullet">•</span>
        <input type="text" placeholder="Enter conclusion...">
        <button class="add-item-btn" onclick="addConclusion('${machineId}', this)" title="Add row">+</button>
        <button class="remove-item-btn" onclick="removeListItem(this)" title="Remove">×</button>
    `;

    if (btn) {
        const currentRow = btn.parentElement;
        currentRow.insertAdjacentElement('afterend', newItem);
    } else {
        list.appendChild(newItem);
    }

    newItem.querySelector('input').focus();
}

function removeListItem(btn) {
    const item = btn.parentElement;
    const list = item.parentElement;
    const isNumbered = item.querySelector('.item-number');

    if (list.querySelectorAll('.list-item').length <= 1) {
        // Clear input instead of removing
        item.querySelector('input').value = '';
        return;
    }

    item.remove();

    // Renumber if numbered list
    if (isNumbered) {
        renumberList(list);
    }
}

function renumberList(list) {
    const items = list.querySelectorAll('.list-item');
    items.forEach((item, index) => {
        const numberSpan = item.querySelector('.item-number');
        if (numberSpan) {
            numberSpan.textContent = `${index + 1}.`;
        }
    });
}

// ==================== TABLE FUNCTIONS ====================

function addPendingAction(machineId, btn) {
    const tbody = document.querySelector(`#${machineId}-pending tbody`);
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" placeholder="Action required..."></td>
        <td><select class="responsibility-select"><option value="">Select...</option><option value="OSEA">OSEA</option><option value="Client">Client</option><option value="Both">Both</option></select></td>
        <td><input type="date"></td>
        <td class="action-buttons">
            <button class="add-row-btn" onclick="addPendingAction('${machineId}', this)" title="Add row">+</button>
            <button class="remove-row-btn" onclick="removeTableRow(this)" title="Remove">×</button>
        </td>
    `;

    if (btn) {
        const currentRow = btn.closest('tr');
        currentRow.insertAdjacentElement('afterend', newRow);
    } else {
        tbody.appendChild(newRow);
    }

    newRow.querySelector('input').focus();
}

function addPart(machineId, btn) {
    const tbody = document.querySelector(`#${machineId}-parts tbody`);
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" placeholder="Part description..."></td>
        <td><input type="text" placeholder="Qty" style="width: 60px;"></td>
        <td><input type="text" placeholder="Remarks..."></td>
        <td class="action-buttons">
            <button class="add-row-btn" onclick="addPart('${machineId}', this)" title="Add row">+</button>
            <button class="remove-row-btn" onclick="removeTableRow(this)" title="Remove">×</button>
        </td>
    `;

    if (btn) {
        const currentRow = btn.closest('tr');
        currentRow.insertAdjacentElement('afterend', newRow);
    } else {
        tbody.appendChild(newRow);
    }

    newRow.querySelector('input').focus();
}

function removeTableRow(btn) {
    const row = btn.closest('tr');
    const tbody = row.parentElement;

    // Keep at least one row - clear it instead of removing
    if (tbody.querySelectorAll('tr').length <= 1) {
        row.querySelectorAll('input').forEach(input => input.value = '');
        const select = row.querySelector('select');
        if (select) select.value = '';
        return;
    }

    row.remove();
}

// ==================== UTILITY FUNCTIONS ====================

function generateReportNumber() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `OSEA-${yy}/${mm}/${dd}/${hh}${min}${ss}`;
}

function toggleCheckbox(label) {
    const checkbox = label.querySelector('input[type="checkbox"]');
    // Allow the default behavior - checkbox toggles automatically
}

function generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const startYear = 1980;
    let options = '';
    for (let year = currentYear + 1; year >= startYear; year--) {
        options += `<option value="${year}">${year}</option>`;
    }
    return options;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getVisitTypes() {
    const checked = document.querySelectorAll('input[name="visitType"]:checked');
    return Array.from(checked).map(cb => cb.value);
}

function getLocation() {
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    if (city && state) return `${city}, ${state}`;
    return city || state || '';
}

function getContactPerson() {
    const title = document.getElementById('contactTitle').value;
    const name = document.getElementById('contactPerson').value.trim();
    if (name) return `${title} ${name}`;
    return '';
}

function getEngineersDisplay() {
    return engineers.map(eng => `${eng.title} ${eng.name}`).join(', ');
}

function showStatus(message, type = 'success') {
    const statusMsg = document.getElementById('statusMsg');
    statusMsg.textContent = message;
    statusMsg.className = 'status-msg ' + type;
    statusMsg.style.display = 'block';
    setTimeout(() => {
        statusMsg.style.display = 'none';
    }, 3000);
}

// ==================== DRAFT FUNCTIONS ====================

function collectFormData() {
    // Collect all machine data
    const machinesData = [];
    document.querySelectorAll('.machine-card').forEach(machine => {
        const machineData = {
            name: machine.querySelector('.machine-name')?.value || '',
            serialNumber: machine.querySelector('.serial-number')?.value || '',
            make: machine.querySelector('.machine-make')?.value || '',
            model: machine.querySelector('.machine-model')?.value || '',
            year: machine.querySelector('.machine-year')?.value || '',
            problemReported: machine.querySelector('.problem-reported')?.value || '',
            observations: Array.from(machine.querySelectorAll('.observations-list .list-item input')).map(i => i.value).filter(v => v),
            activities: Array.from(machine.querySelectorAll('.activities-list .list-item input')).map(i => i.value).filter(v => v),
            conclusions: Array.from(machine.querySelectorAll('.conclusions-list .list-item input')).map(i => i.value).filter(v => v),
            statusOperational: machine.querySelector('.status-operational')?.checked || false,
            statusPartial: machine.querySelector('.status-partial')?.checked || false,
            statusDown: machine.querySelector('.status-down')?.checked || false,
            statusNotes: machine.querySelector('.status-notes')?.value || '',
            pendingActions: Array.from(machine.querySelectorAll(`#${machine.id}-pending tbody tr`)).map(row => ({
                action: row.querySelector('input[type="text"]')?.value || '',
                responsibility: row.querySelector('select')?.value || '',
                targetDate: row.querySelector('input[type="date"]')?.value || ''
            })).filter(p => p.action),
            parts: Array.from(machine.querySelectorAll(`#${machine.id}-parts tbody tr`)).map(row => {
                const inputs = row.querySelectorAll('input');
                return {
                    description: inputs[0]?.value || '',
                    qty: inputs[1]?.value || '',
                    remarks: inputs[2]?.value || ''
                };
            }).filter(p => p.description)
        };
        machinesData.push(machineData);
    });

    // Collect client reps
    const clientRepsData = [];
    document.querySelectorAll('#client-reps .rep-item').forEach(item => {
        const title = item.querySelector('.rep-title')?.value || 'Mr.';
        const name = item.querySelector('.rep-name')?.value || '';
        const designation = item.querySelector('.rep-designation')?.value || '';
        if (name) clientRepsData.push({ title, name, designation });
    });

    return {
        reportNo: document.getElementById('reportNo').textContent,
        reportDate: document.getElementById('reportDate').value,
        companyName: document.getElementById('companyName').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        contactTitle: document.getElementById('contactTitle').value,
        contactPerson: document.getElementById('contactPerson').value,
        contactInfo: document.getElementById('contactInfo').value,
        visitTypes: getVisitTypes(),
        engineers: engineers,
        arrivalDate: document.getElementById('arrivalDate').value,
        departureDate: document.getElementById('departureDate').value,
        generalRecommendations: document.getElementById('generalRecommendations').value,
        machines: machinesData,
        clientReps: clientRepsData,
        timestamp: new Date().toISOString()
    };
}

function saveDraft() {
    try {
        const data = collectFormData();

        // Generate filename based on company name and date
        const companyName = data.companyName || 'Unnamed';
        const dateStr = data.reportDate || new Date().toISOString().split('T')[0];
        const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const filename = `Draft_${safeCompanyName}_${dateStr}.json`;

        // Create and download the file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus(`Draft saved as "${filename}" - Save it to Drafts folder`, 'success');
    } catch (e) {
        console.error('Error saving draft:', e);
        showStatus('Error saving draft', 'error');
    }
}

function loadDraftFromFile(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            applyDraftData(data);
            showStatus(`Loaded draft: ${file.name}`, 'success');
        } catch (err) {
            console.error('Error parsing draft file:', err);
            showStatus('Error loading draft - invalid file format', 'error');
        }
    };
    reader.onerror = function() {
        showStatus('Error reading draft file', 'error');
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    input.value = '';
}

function applyDraftData(data) {
    // Basic fields
    if (data.reportDate) document.getElementById('reportDate').value = data.reportDate;
    if (data.companyName) document.getElementById('companyName').value = data.companyName;
    if (data.city) document.getElementById('city').value = data.city;
    if (data.state) document.getElementById('state').value = data.state;
    if (data.contactTitle) document.getElementById('contactTitle').value = data.contactTitle;
    if (data.contactPerson) document.getElementById('contactPerson').value = data.contactPerson;
    if (data.contactInfo) document.getElementById('contactInfo').value = data.contactInfo;
    if (data.arrivalDate) document.getElementById('arrivalDate').value = data.arrivalDate;
    if (data.departureDate) document.getElementById('departureDate').value = data.departureDate;
    if (data.generalRecommendations) document.getElementById('generalRecommendations').value = data.generalRecommendations;

    // Visit types - clear first, then set
    document.querySelectorAll('input[name="visitType"]').forEach(cb => cb.checked = false);
    if (data.visitTypes) {
        data.visitTypes.forEach(type => {
            const cb = document.querySelector(`input[name="visitType"][value="${type}"]`);
            if (cb) cb.checked = true;
        });
    }

    // Engineers
    if (data.engineers && data.engineers.length > 0) {
        engineers = data.engineers.map(eng => {
            if (typeof eng === 'object' && eng.name) return eng;
            return { title: 'Mr.', name: String(eng) };
        });
        renderEngineers();
    }

    // Machines - rebuild if data exists
    if (data.machines && data.machines.length > 0) {
        // Clear existing machines
        document.getElementById('machines-container').innerHTML = '';
        machineCount = 0;

        // Add machines from draft
        data.machines.forEach((machineData, index) => {
            addMachine();
            const machine = document.getElementById(`machine-${index + 1}`);
            if (!machine) return;

            // Fill machine fields
            if (machineData.name) machine.querySelector('.machine-name').value = machineData.name;
            if (machineData.serialNumber) machine.querySelector('.serial-number').value = machineData.serialNumber;
            if (machineData.make) machine.querySelector('.machine-make').value = machineData.make;
            if (machineData.model) machine.querySelector('.machine-model').value = machineData.model;
            if (machineData.year) machine.querySelector('.machine-year').value = machineData.year;
            if (machineData.problemReported) machine.querySelector('.problem-reported').value = machineData.problemReported;
            if (machineData.statusNotes) machine.querySelector('.status-notes').value = machineData.statusNotes;

            // Status checkboxes
            if (machineData.statusOperational) machine.querySelector('.status-operational').checked = true;
            if (machineData.statusPartial) machine.querySelector('.status-partial').checked = true;
            if (machineData.statusDown) machine.querySelector('.status-down').checked = true;

            // Observations
            if (machineData.observations && machineData.observations.length > 0) {
                const obsList = machine.querySelector('.observations-list');
                machineData.observations.forEach((obs, i) => {
                    if (i === 0) {
                        obsList.querySelector('input').value = obs;
                    } else {
                        addObservation(`machine-${index + 1}`);
                        const inputs = obsList.querySelectorAll('input');
                        inputs[inputs.length - 1].value = obs;
                    }
                });
            }

            // Activities
            if (machineData.activities && machineData.activities.length > 0) {
                const actList = machine.querySelector('.activities-list');
                machineData.activities.forEach((act, i) => {
                    if (i === 0) {
                        actList.querySelector('input').value = act;
                    } else {
                        addActivity(`machine-${index + 1}`);
                        const inputs = actList.querySelectorAll('input');
                        inputs[inputs.length - 1].value = act;
                    }
                });
            }

            // Conclusions
            if (machineData.conclusions && machineData.conclusions.length > 0) {
                const conList = machine.querySelector('.conclusions-list');
                machineData.conclusions.forEach((con, i) => {
                    if (i === 0) {
                        conList.querySelector('input').value = con;
                    } else {
                        addConclusion(`machine-${index + 1}`);
                        const inputs = conList.querySelectorAll('input');
                        inputs[inputs.length - 1].value = con;
                    }
                });
            }

            // Pending actions
            if (machineData.pendingActions && machineData.pendingActions.length > 0) {
                const pendingTbody = machine.querySelector(`#machine-${index + 1}-pending tbody`);
                machineData.pendingActions.forEach((action, i) => {
                    if (i > 0) addPendingAction(`machine-${index + 1}`);
                    const rows = pendingTbody.querySelectorAll('tr');
                    const row = rows[rows.length - 1];
                    if (action.action) row.querySelector('input[type="text"]').value = action.action;
                    if (action.responsibility) row.querySelector('select').value = action.responsibility;
                    if (action.targetDate) row.querySelector('input[type="date"]').value = action.targetDate;
                });
            }

            // Parts
            if (machineData.parts && machineData.parts.length > 0) {
                const partsTbody = machine.querySelector(`#machine-${index + 1}-parts tbody`);
                machineData.parts.forEach((part, i) => {
                    if (i > 0) addPart(`machine-${index + 1}`);
                    const rows = partsTbody.querySelectorAll('tr');
                    const row = rows[rows.length - 1];
                    const inputs = row.querySelectorAll('input');
                    if (part.description) inputs[0].value = part.description;
                    if (part.qty) inputs[1].value = part.qty;
                    if (part.remarks) inputs[2].value = part.remarks;
                });
            }
        });
    }

    // Client representatives
    if (data.clientReps && data.clientReps.length > 0) {
        const clientRepsList = document.getElementById('client-reps');
        // Clear existing and rebuild
        clientRepsList.innerHTML = '';
        data.clientReps.forEach((rep, i) => {
            addClientRep();
            const items = clientRepsList.querySelectorAll('.rep-item');
            const item = items[items.length - 1];
            if (rep.title) item.querySelector('.rep-title').value = rep.title;
            if (rep.name) item.querySelector('.rep-name').value = rep.name;
            if (rep.designation) item.querySelector('.rep-designation').value = rep.designation;
        });
        initDragAndDrop();
    }
}

function loadDraft() {
    // Legacy localStorage load - kept for backwards compatibility
    const saved = localStorage.getItem('osea-service-report-draft');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        applyDraftData(data);
    } catch (e) {
        console.error('Error loading draft:', e);
    }
}

// ==================== PDF GENERATION ====================

function generatePDF() {
    // Check if html2pdf library is loaded
    if (typeof html2pdf === 'undefined') {
        showStatus('PDF library not loaded. Please check your internet connection or open via a local server.', 'error');
        console.error('html2pdf library not loaded. The file may need to be served via HTTP instead of file://');
        return;
    }

    showStatus('Generating PDF...', 'info');

    const pdfContent = document.getElementById('pdf-content');

    // Build PDF HTML
    // Use global logo constant from logo_data.js (works with file:// protocol)
    const logoBase64 = OSEA_LOGO_BASE64;

    let html = `
        <div class="pdf-header">
            <img src="${logoBase64}" alt="OSEA Logo" class="pdf-logo">
            <div class="pdf-header-text">
                <h1>SERVICE REPORT</h1>
                <p>OmSai Engineering & Automation</p>
            </div>
        </div>

        <table class="pdf-info-table">
            <tr>
                <td><strong>Report No:</strong> ${document.getElementById('reportNo').textContent || 'N/A'}</td>
                <td><strong>Date:</strong> ${formatDate(document.getElementById('reportDate').value)}</td>
            </tr>
            <tr>
                <td><strong>Client:</strong> ${document.getElementById('companyName').value || 'N/A'}</td>
                <td><strong>Location:</strong> ${getLocation() || 'N/A'}</td>
            </tr>
            <tr>
                <td><strong>Contact:</strong> ${getContactPerson() || 'N/A'}</td>
                <td><strong>Phone/Email:</strong> ${document.getElementById('contactInfo').value || 'N/A'}</td>
            </tr>
            <tr>
                <td><strong>Visit Type:</strong> ${getVisitTypes().join(', ') || 'N/A'}</td>
                <td><strong>Representatives:</strong> ${getEngineersDisplay() || 'N/A'}</td>
            </tr>
            <tr>
                <td><strong>Arrival:</strong> ${formatDate(document.getElementById('arrivalDate').value)}</td>
                <td><strong>Departure:</strong> ${formatDate(document.getElementById('departureDate').value)}</td>
            </tr>
        </table>
    `;

    // Add machines
    const machines = document.querySelectorAll('.machine-card');
    machines.forEach((machine, index) => {
        const machineName = machine.querySelector('.machine-name').value || `Machine ${index + 1}`;
        const serialNumber = machine.querySelector('.serial-number').value || '';
        const make = machine.querySelector('.machine-make').value || '';
        const model = machine.querySelector('.machine-model').value || '';
        const year = machine.querySelector('.machine-year').value || '';
        const problemReported = machine.querySelector('.problem-reported').value || '';
        const statusNotes = machine.querySelector('.status-notes').value || '';

        // Get status
        let status = 'Not specified';
        if (machine.querySelector('.status-operational:checked')) status = 'Operational';
        else if (machine.querySelector('.status-partial:checked')) status = 'Partially Operational';
        else if (machine.querySelector('.status-down:checked')) status = 'Down/Non-functional';

        html += `
            <div class="pdf-section">
                <div class="pdf-section-title">Machine ${index + 1}: ${machineName}</div>
                <table class="pdf-info-table">
                    <tr>
                        <td><strong>Serial:</strong> ${serialNumber}</td>
                        <td><strong>Make:</strong> ${make}</td>
                        <td><strong>Model:</strong> ${model}</td>
                        <td><strong>Year:</strong> ${year}</td>
                    </tr>
                </table>
        `;

        if (problemReported) {
            html += `
                <div class="pdf-subsection">
                    <strong>Problem Reported:</strong>
                    <p>${problemReported}</p>
                </div>
            `;
        }

        // Observations
        const observations = machine.querySelectorAll('.observations-list .list-item input');
        const obsValues = Array.from(observations).map(i => i.value).filter(v => v.trim());
        if (obsValues.length > 0) {
            html += `
                <div class="pdf-subsection">
                    <strong>Observations:</strong>
                    <ol class="pdf-list">
                        ${obsValues.map(v => `<li>${v}</li>`).join('')}
                    </ol>
                </div>
            `;
        }

        // Activities
        const activities = machine.querySelectorAll('.activities-list .list-item input');
        const actValues = Array.from(activities).map(i => i.value).filter(v => v.trim());
        if (actValues.length > 0) {
            html += `
                <div class="pdf-subsection">
                    <strong>Activities Performed:</strong>
                    <ol class="pdf-list">
                        ${actValues.map(v => `<li>${v}</li>`).join('')}
                    </ol>
                </div>
            `;
        }

        // Conclusions
        const conclusions = machine.querySelectorAll('.conclusions-list .list-item input');
        const conValues = Array.from(conclusions).map(i => i.value).filter(v => v.trim());
        if (conValues.length > 0) {
            html += `
                <div class="pdf-subsection">
                    <strong>Conclusions:</strong>
                    <ul class="pdf-list">
                        ${conValues.map(v => `<li>${v}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        html += `
            <div class="pdf-subsection">
                <strong>Current Status:</strong> ${status}
                ${statusNotes ? `<p>${statusNotes}</p>` : ''}
            </div>
        `;

        // Pending Actions
        const pendingRows = machine.querySelectorAll(`#${machine.id}-pending tbody tr`);
        if (pendingRows.length > 0) {
            const pendingData = Array.from(pendingRows).map(row => {
                const actionInput = row.querySelector('input[type="text"]');
                const respSelect = row.querySelector('select');
                const dateInput = row.querySelector('input[type="date"]');
                return {
                    action: actionInput?.value || '',
                    responsibility: respSelect?.value || '',
                    targetDate: formatDate(dateInput?.value) || ''
                };
            }).filter(p => p.action.trim());

            if (pendingData.length > 0) {
                html += `
                    <div class="pdf-subsection">
                        <strong>Pending Actions:</strong>
                        <table class="pdf-table">
                            <tr><th>Action</th><th>Responsibility</th><th>Target Date</th></tr>
                            ${pendingData.map(p => `<tr><td>${p.action}</td><td>${p.responsibility}</td><td>${p.targetDate}</td></tr>`).join('')}
                        </table>
                    </div>
                `;
            }
        }

        // Parts Required
        const partsRows = machine.querySelectorAll(`#${machine.id}-parts tbody tr`);
        if (partsRows.length > 0) {
            const partsData = Array.from(partsRows).map(row => {
                const inputs = row.querySelectorAll('input');
                return {
                    description: inputs[0]?.value || '',
                    qty: inputs[1]?.value || '',
                    remarks: inputs[2]?.value || ''
                };
            }).filter(p => p.description.trim());

            if (partsData.length > 0) {
                html += `
                    <div class="pdf-subsection">
                        <strong>Parts/Materials Required:</strong>
                        <table class="pdf-table">
                            <tr><th>Description</th><th>Qty</th><th>Remarks</th></tr>
                            ${partsData.map(p => `<tr><td>${p.description}</td><td>${p.qty}</td><td>${p.remarks}</td></tr>`).join('')}
                        </table>
                    </div>
                `;
            }
        }

        html += `</div>`;
    });

    // General Recommendations
    const recommendations = document.getElementById('generalRecommendations').value;
    if (recommendations) {
        html += `
            <div class="pdf-section">
                <div class="pdf-section-title">General Recommendations</div>
                <p>${recommendations}</p>
            </div>
        `;
    }

    // Signatures
    const oseaReps = getOseaReps();
    const clientReps = getClientReps();

    html += `<div class="pdf-signatures">`;

    // OSEA Representatives
    html += `<div class="pdf-signature-column">
        <p class="sig-header"><strong>For OSEA</strong></p>`;

    if (oseaReps.length > 0) {
        oseaReps.forEach(rep => {
            html += `
                <div class="pdf-signature-box">
                    <div class="signature-line"></div>
                    <p class="sig-name">${rep.title} ${rep.name}</p>
                    <p class="sig-designation">${rep.designation}</p>
                </div>
            `;
        });
    } else {
        html += `
            <div class="pdf-signature-box">
                <div class="signature-line"></div>
                <p class="sig-name">________________</p>
                <p class="sig-designation"></p>
            </div>
        `;
    }
    html += `</div>`;

    // Client Representatives
    html += `<div class="pdf-signature-column">
        <p class="sig-header"><strong>For Client</strong></p>`;

    if (clientReps.length > 0) {
        clientReps.forEach(rep => {
            html += `
                <div class="pdf-signature-box">
                    <div class="signature-line"></div>
                    <p class="sig-name">${rep.title} ${rep.name}</p>
                    <p class="sig-designation">${rep.designation}</p>
                </div>
            `;
        });
    } else {
        html += `
            <div class="pdf-signature-box">
                <div class="signature-line"></div>
                <p class="sig-name">________________</p>
                <p class="sig-designation"></p>
            </div>
        `;
    }
    html += `</div>`;

    html += `</div>

        <div class="pdf-footer">
            <p>OmSai Engineering & Automation | Service Report</p>
        </div>
    `;

    // Open print dialog with the content - most reliable method
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>OSEA Service Report</title>
            <style>
                @media print {
                    body { margin: 0; padding: 20px; }
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11pt;
                    line-height: 1.4;
                    color: #333;
                    background: white;
                    padding: 20px 40px;
                }
                .pdf-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    border-bottom: 3px solid #d4a017;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .pdf-logo { width: 80px; height: auto; }
                .pdf-header-text h1 { font-size: 18pt; color: #1a5276; margin: 0; }
                .pdf-header-text p { font-size: 10pt; color: #666; margin: 5px 0 0 0; }
                .pdf-info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .pdf-info-table td { padding: 6px 10px; border: 1px solid #ddd; font-size: 10pt; }
                .pdf-section { margin: 15px 0; page-break-inside: avoid; }
                .pdf-section-title { background-color: #1a5276; color: white; padding: 8px 12px; font-size: 11pt; font-weight: bold; margin: 15px 0 10px 0; }
                .pdf-subsection { margin: 10px 0; }
                .pdf-subsection strong { color: #1a5276; }
                .pdf-list { margin: 5px 0 5px 20px; }
                .pdf-list li { margin: 3px 0; }
                .pdf-table { width: 100%; border-collapse: collapse; margin-top: 5px; }
                .pdf-table th { background: #f5f5f5; padding: 6px 10px; border: 1px solid #ddd; text-align: left; }
                .pdf-table td { padding: 6px 10px; border: 1px solid #ddd; }
                .pdf-signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
                .pdf-signature-column { width: 45%; }
                .sig-header { text-align: center; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #1a5276; }
                .pdf-signature-box { text-align: center; margin-bottom: 20px; }
                .signature-line { border-bottom: 1px solid #333; height: 35px; margin: 0 20px 5px 20px; }
                .sig-name { font-weight: 600; margin: 0; }
                .sig-designation { font-size: 9pt; color: #666; margin: 0; }
                .pdf-footer { margin-top: 30px; text-align: center; font-size: 8pt; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            ${html}
        </body>
        </html>
    `);
    printWindow.document.close();

    // Wait for content to load then trigger print
    printWindow.onload = function() {
        printWindow.print();
    };

    showStatus('Print dialog opened - Save as PDF from there', 'success');
}
