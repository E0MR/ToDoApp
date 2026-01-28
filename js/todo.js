let db;

function initDB(callback) {
    const req = indexedDB.open("FinalLuxuryTodoDB", 2);
    req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("tasks")) {
            db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("categories")) {
            db.createObjectStore("categories", { keyPath: "name" });
        }
    };
    req.onsuccess = (e) => {
        db = e.target.result;
        initCategories(); // Ensure default categories exist
        if (callback) callback();
    };
}

function initCategories() {
    const tx = db.transaction("categories", "readwrite");
    const store = tx.objectStore("categories");
    const defaults = ["عام", "عمل", "عائلي", "صحة"];

    // Logic to ensure all defaults exist
    defaults.forEach(name => {
        store.get(name).onsuccess = (e) => {
            if (!e.target.result) store.add({ name });
        };
    });

    // Cleanup old spelling if it exists
    store.delete("غير المنجزة");
    store.delete("المنجزة");

    tx.oncomplete = () => loadCategories();
}

function addTask() {
    const input = document.getElementById("todoInput");
    const categorySelect = document.getElementById("categorySelect");
    if (!input.value.trim()) return;
    const tx = db.transaction("tasks", "readwrite");
    tx.objectStore("tasks").add({
        title: input.value,
        category: categorySelect.value,
        completed: false,
        createdAt: new Date().getTime(),
        completedAt: null,
    });
    tx.oncomplete = () => {
        input.value = "";
        render();
    };
}

// Professional SVG Icons
const ICONS = {
    check: `<svg viewBox="0 0 24 24" class="svg-icon check"><path d="M20 6L9 17L4 12" /></svg>`,
    edit: `<svg viewBox="0 0 24 24" class="svg-icon edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" class="svg-icon trash"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    sun: `<svg viewBox="0 0 24 24" class="svg-icon sun"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" class="svg-icon moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    download: `<svg viewBox="0 0 24 24" class="svg-icon download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" class="svg-icon upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" class="svg-icon plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
};

function render() {
    const list = document.getElementById("todoList");
    const filterSelect = document.getElementById("filterSelect");
    if (!list || !filterSelect) return;

    const filter = filterSelect.value || "all";
    list.innerHTML = "";

    if (!db) return;

    const store = db.transaction("tasks").objectStore("tasks");
    store.openCursor(null, "prev").onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const t = cursor.value;

            let show = false;
            if (filter === "all") show = true;
            else if (filter === "المنجزة") show = t.completed;
            else if (filter === "الغير منجزة") show = !t.completed;
            else show = (t.category === filter);

            if (show) {
                const li = document.createElement("li");
                if (t.completed) li.classList.add("completed");
                const createdStr = formatDate(t.createdAt || t.date); // Fallback for old tasks
                const completedStr = t.completedAt ? formatDate(t.completedAt) : "";

                li.innerHTML = `
                <div class="task-content">
                    <span class="${t.completed ? "completed" : ""}" style="display:block;">${t.title}</span>
                    <div class="task-info">
                        <small class="task-cat">${t.category}</small>
                        <div class="task-dates">
                            <span class="date-item created" title="تاريخ الإنشاء">
                                إضافة: ${createdStr}
                            </span>
                            ${t.completedAt ? `
                            <span class="date-item done" title="تاريخ الإنجاز">
                                إنجاز: ${completedStr}
                            </span>` : ""}
                        </div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-btn complete" title="إنجاز" onclick="confirmComplete(${t.id}, ${t.completed})">${ICONS.check}</button>
                    <button class="action-btn edit" title="تعديل" onclick="openEditModal(${t.id})">${ICONS.edit}</button>
                    <button class="action-btn delete" title="حذف" onclick="confirmDelete(${t.id})">${ICONS.trash}</button>
                </div>`;
                list.appendChild(li);
            }
            cursor.continue();
        }
    };
}

function showConfirm(title, text, confirmCallback, isSuccessAction, hideCancel = false) {
    const modal = document.getElementById("confirmModal");
    const btn = document.getElementById("confirmBtn");
    const cancelBtn = modal.querySelector(".modal-btn.cancel");

    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalText").innerText = text;

    cancelBtn.style.display = hideCancel ? "none" : "block";
    btn.className = "modal-btn confirm" + (isSuccessAction ? " success" : "");
    btn.onclick = () => {
        if (confirmCallback) confirmCallback();
        closeModal();
    };

    modal.classList.add("active");
}

function showAlert(title, text, isSuccess = true) {
    showConfirm(title, text, null, isSuccess, true);
}

function closeModal() {
    document.getElementById("confirmModal").classList.remove("active");
}

function confirmComplete(id, isCompleted) {
    const title = isCompleted ? "إعادة المهمة" : "تأكيد الإنجاز";
    const text = isCompleted ? "هل تريد إعادة هذه المهمة لقائمة المهام النشطة؟" : "هل أنت متأكد من إنجاز هذه المهمة؟";
    showConfirm(title, text, () => toggleTask(id), !isCompleted);
}

function confirmDelete(id) {
    showConfirm("تأكيد الحذف", "هل أنت متأكد من رغبتك في حذف هذه المهمة نهائياً؟", () => deleteTask(id), false);
}

function toggleTask(id) {
    const tx = db.transaction("tasks", "readwrite");
    const store = tx.objectStore("tasks");
    store.get(id).onsuccess = (e) => {
        const data = e.target.result;
        data.completed = !data.completed;
        data.completedAt = data.completed ? new Date().getTime() : null;
        store.put(data);
    };
    tx.oncomplete = () => render();
}

function deleteTask(id) {
    const tx = db.transaction("tasks", "readwrite");
    tx.objectStore("tasks").delete(id);
    tx.oncomplete = () => render();
}

// Edit Modal Functions
function openEditModal(id) {
    const tx = db.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    store.get(id).onsuccess = (e) => {
        const task = e.target.result;
        document.getElementById("editTodoInput").value = task.title;
        document.getElementById("editCategorySelect").value = task.category;
        document.getElementById("saveEditBtn").onclick = () => saveEdit(id);
        document.getElementById("editModal").classList.add("active");
    };
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
}

function saveEdit(id) {
    const newTitle = document.getElementById("editTodoInput").value;
    const newCat = document.getElementById("editCategorySelect").value;
    if (!newTitle.trim()) return;

    const tx = db.transaction("tasks", "readwrite");
    const store = tx.objectStore("tasks");
    store.get(id).onsuccess = (e) => {
        const data = e.target.result;
        data.title = newTitle;
        data.category = newCat;
        store.put(data);
    };
    tx.oncomplete = () => {
        render();
        closeEditModal();
    };
}

// Category Management
function openAddCategoryModal() {
    document.getElementById("catModal").classList.add("active");
}

function closeCatModal() {
    document.getElementById("catModal").classList.remove("active");
}

function handleAddCategory() {
    const input = document.getElementById("newCatInput");
    const name = input.value.trim();
    if (!name) return;

    const tx = db.transaction("categories", "readwrite");
    tx.objectStore("categories").add({ name }).onsuccess = () => {
        input.value = "";
        loadCategories();
        closeCatModal();
    };
}

function confirmDeleteCategory(name) {
    if (["عام", "عمل", "عائلي", "صحة"].includes(name)) {
        alert("لا يمكن حذف التصنيفات الأساسية");
        return;
    }
    showConfirm("حذف التصنيف", `هل أنت متأكد من حذف تصنيف "${name}"؟ سيتم تحويل مهامه لتصنيف "عام".`, () => deleteCategory(name), false);
}

function deleteCategory(name) {
    const tx = db.transaction(["categories", "tasks"], "readwrite");
    tx.objectStore("categories").delete(name);

    // Reset tasks with this category to "عام"
    const taskStore = tx.objectStore("tasks");
    taskStore.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            if (cursor.value.category === name) {
                const updated = cursor.value;
                updated.category = "عام";
                cursor.update(updated);
            }
            cursor.continue();
        }
    };

    tx.oncomplete = () => {
        loadCategories();
        render();
        closeCategoryManageModal();
    };
}

function loadCategories() {
    const tx = db.transaction("categories", "readonly");
    const store = tx.objectStore("categories");
    store.getAll().onsuccess = (e) => {
        const categories = e.target.result.map((c) => c.name);
        updateCategorySelects(categories);
        renderCategoryManager(e.target.result);
        injectBackupIcons();
        render(); // Ensure tasks render after filter is populated
    };
}

function injectBackupIcons() {
    const exIcon = document.getElementById("exportIcon");
    const imIcon = document.getElementById("importIcon");
    const adIcon = document.getElementById("addIcon");
    if (exIcon) exIcon.innerHTML = ICONS.download;
    if (imIcon) imIcon.innerHTML = ICONS.upload;
    if (adIcon) adIcon.innerHTML = ICONS.plus;
}

function updateCategorySelects(cats) {
    const selects = [
        { el: document.getElementById("categorySelect"), isFilter: false },
        { el: document.getElementById("editCategorySelect"), isFilter: false },
        { el: document.getElementById("filterSelect"), isFilter: true }
    ];

    selects.forEach(({ el, isFilter }) => {
        if (!el) return;

        if (isFilter) {
            let html = '<option value="all">جميع المهام</option>';
            html += '<option value="الغير منجزة">الغير منجزة</option>';
            html += '<option value="المنجزة">المنجزة</option>';
            html += cats.map((c) => `<option value="${c}">${c}</option>`).join("");
            el.innerHTML = html;
        } else {
            el.innerHTML = cats.map((c) => `<option value="${c}">${c}</option>`).join("");
        }
    });
}

function formatDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${mins}`;
}

// Category Manager UI
function openCategoryManageModal() {
    document.getElementById("manageCatModal").classList.add("active");
}

function closeCategoryManageModal() {
    document.getElementById("manageCatModal").classList.remove("active");
}

function renderCategoryManager(cats) {
    const list = document.getElementById("manageCatList");
    if (!list) return;
    list.innerHTML = cats.map(c => `
        <div class="cat-manage-item">
            <span>${c.name}</span>
            ${!["عام", "عمل", "عائلي", "صحة"].includes(c.name) ?
            `<button onclick="confirmDeleteCategory('${c.name}')">${ICONS.trash}</button>` : ''}
        </div>
    `).join("");
}

// Generic Modal Closer
window.addEventListener("click", (e) => {
    const modals = [
        { el: document.getElementById("confirmModal"), close: closeModal },
        { el: document.getElementById("editModal"), close: closeEditModal },
        { el: document.getElementById("catModal"), close: closeCatModal },
        { el: document.getElementById("manageCatModal"), close: closeCategoryManageModal }
    ];

    modals.forEach((m) => {
        if (m.el && e.target === m.el) m.close();
    });
});

window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal();
        closeEditModal();
        closeCatModal();
        closeCategoryManageModal();
    }
});
// Data Portability (Export/Import)
function confirmExport() {
    showConfirm(
        "تصدير البيانات",
        "هل تريد تصدير كافة المهام والتصنيفات في ملف JSON للنسخ الاحتياطي؟",
        () => exportData(),
        true
    );
}

function exportData() {
    const tx = db.transaction(["tasks", "categories"], "readonly");
    const tasksStore = tx.objectStore("tasks");
    const catsStore = tx.objectStore("categories");

    const data = {
        tasks: [],
        categories: [],
        exportDate: new Date().toISOString()
    };

    tasksStore.getAll().onsuccess = (e) => data.tasks = e.target.result;
    catsStore.getAll().onsuccess = (e) => data.categories = e.target.result;

    tx.oncomplete = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `todo_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showAlert("تم التصدير", "تم تصدير نسخة احتياطية من بياناتك بنجاح!", true);
    };
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.tasks || !data.categories) throw new Error("تنسيق ملف غير صالح");

            showConfirm(
                "تأكيد الاسترداد",
                "تحذير: استرداد الملف سيقوم بمسح كافة البيانات الحالية واستبدالها. هل تريد الاستمرار؟",
                () => importData(data),
                false
            );
        } catch (err) {
            alert("خطأ: ملف JSON غير صالح");
        }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
}

function importData(data) {
    const tx = db.transaction(["tasks", "categories"], "readwrite");
    const tasksStore = tx.objectStore("tasks");
    const catsStore = tx.objectStore("categories");

    tasksStore.clear();
    catsStore.clear();

    data.tasks.forEach(t => {
        delete t.id; // Let autoIncrement handle it
        tasksStore.add(t);
    });

    data.categories.forEach(c => {
        catsStore.add(c);
    });

    tx.oncomplete = () => {
        initCategories(); // Ensure defaults exist if file didn't have them
        render();
        loadCategories();
        showAlert("تم الاستيراد", "تم استيراد بياناتك بنجاح وتحديث القائمة حالياً.", true);
    };
}
