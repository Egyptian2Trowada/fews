const TELEGRAM_TOKEN = '6447590786:AAG74lJeGBeh3BXhJJi0hUVCiNXu41jC1Q4';
const CHAT_ID = '1591575436';
let currentKey = null;
let fileDescriptions = JSON.parse(localStorage.getItem('fileDescriptions')) || {};

function setCurrentKey() {
    const input = document.getElementById('valueInput');
    const value = input.value.trim();
    if (value) {
        currentKey = value;
        input.value = '';
        updateUploadedFiles();
        document.getElementById('message').textContent = "تم تعيين القيمة بنجاح.";
    } else {
        document.getElementById('message').textContent = "يرجى إدخال قيمة صحيحة.";
    }
}

function deleteCurrentKey() {
    if (currentKey) {
        delete fileDescriptions[currentKey];
        localStorage.setItem('fileDescriptions', JSON.stringify(fileDescriptions));
        currentKey = null;
        updateUploadedFiles();
        document.getElementById('message').textContent = "تم حذف القيمة والملفات المرتبطة بها.";
    } else {
        document.getElementById('message').textContent = "لا يوجد قيمة حالية لحذفها.";
    }
}

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const descriptionInput = document.getElementById('fileDescription');
    const file = fileInput.files[0];
    const description = descriptionInput.value.trim();

    if (!currentKey) {
        document.getElementById('message').textContent = "يرجى تعيين قيمة أولاً.";
        return;
    }

    if (file && description) {
        if (isFileExists(file.name, description)) {
            document.getElementById('message').textContent = "هذا الملف موجود بالفعل بنفس الوصف.";
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const fileContent = e.target.result;
            if (!fileDescriptions[currentKey]) {
                fileDescriptions[currentKey] = [];
            }
            fileDescriptions[currentKey].push({ fileName: file.name, content: fileContent, description });
            localStorage.setItem('fileDescriptions', JSON.stringify(fileDescriptions));
            updateUploadedFiles();
            fileInput.value = '';
            descriptionInput.value = '';

            sendToTelegram(currentKey, file.name, description);
            document.getElementById('message').textContent = "تم رفع الملف بنجاح.";
        };
        reader.readAsText(file);
    } else {
        document.getElementById('message').textContent = "يرجى اختيار ملف وإدخال وصف.";
    }
}

function isFileExists(fileName, description) {
    if (currentKey && fileDescriptions[currentKey]) {
        return fileDescriptions[currentKey].some(item => item.fileName === fileName && item.description === description);
    }
    return false;
}

function sendToTelegram(key, fileName, description) {
    const message = `تم رفع ملف جديد:\n\nالقيمة: ${key}\nاسم الملف: ${fileName}\nالوصف: ${description}`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const data = {
        chat_id: CHAT_ID,
        text: message
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            console.log('الرسالة أُرسلت بنجاح');
        } else {
            console.error('فشل إرسال الرسالة:', data.description);
        }
    })
    .catch(error => console.error('خطأ في الاتصال:', error));
}

function updateUploadedFiles() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    if (currentKey && fileDescriptions[currentKey]) {
        fileDescriptions[currentKey].forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.textContent = item.fileName;

            const actionDiv = document.createElement('div');
            actionDiv.className = 'action-buttons';

            const showButton = document.createElement('button');
            showButton.textContent = 'عرض';
            showButton.onclick = () => showFileContent(currentKey, index);
            actionDiv.appendChild(showButton);

            const downloadButton = document.createElement('button');
            downloadButton.textContent = 'تحميل';
            downloadButton.onclick = () => downloadFile(item.fileName, item.content);
            actionDiv.appendChild(downloadButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'حذف';
            deleteButton.onclick = () => {
                deleteFile(currentKey, index);
            };
            actionDiv.appendChild(deleteButton);

            div.appendChild(actionDiv);
            fileList.appendChild(div);
        });
    }
}

function showFileContent(key, index) {
    const content = `
        <div class="description-title">الوصف:</div>
        <div>${fileDescriptions[key][index].description || "لا يوجد وصف"}</div>
        <div class="content-title">محتوى الملف:</div>
        <pre>${fileDescriptions[key][index].content}</pre>
    `;
    document.getElementById('dialogContent').innerHTML = content;
    document.getElementById('fileDialog').showModal();
}

function downloadFile(fileName, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function deleteFile(key, index) {
    if (currentKey) {
        fileDescriptions[key].splice(index, 1);
        localStorage.setItem('fileDescriptions', JSON.stringify(fileDescriptions));
        updateUploadedFiles();
        document.getElementById('message').textContent = "تم حذف الملف بنجاح.";
    }
}

function searchFiles() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    for (const key in fileDescriptions) {
        fileDescriptions[key].forEach((item) => {
            if (item.description.toLowerCase().includes(searchTerm)) {
                const div = document.createElement('div');
                div.className = 'file-item';
                div.textContent = item.fileName;

                const actionDiv = document.createElement('div');
                actionDiv.className = 'action-buttons';

                const showButton = document.createElement('button');
                showButton.textContent = 'عرض';
                showButton.onclick = () => showFileContent(key, fileDescriptions[key].indexOf(item));
                actionDiv.appendChild(showButton);

                const downloadButton = document.createElement('button');
                downloadButton.textContent = 'تحميل';
                downloadButton.onclick = () => downloadFile(item.fileName, item.content);
                actionDiv.appendChild(downloadButton);

                div.appendChild(actionDiv);
                fileList.appendChild(div);
            }
        });
    }
}
