// 1. Cấu hình - Link Web App từ Google Sheets của thầy
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzRe6p2BHUlBsFM95U-3OCXx4CvmJ0-An25SMnTLhcsAUJhy4RBkNNUEZEwLsp8mx72/exec";

let allQuestions = [];
let selectedQuestions = [];
let userAnswers = {}; 
let currentQuestionIndex = 0; 
let timeLeft = 1200; 
let timerInterval;

// 2. Hàm Bắt đầu thi (Thầy cần hàm này để ứng dụng chạy)
async function startQuiz() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentID').value.trim();

    if (!name || !id) {
        alert("Vui lòng nhập đủ Họ tên và Khóa!");
        return;
    }

    // Hiệu ứng chờ tải đề
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('quiz-screen').style.display = 'block';
    document.getElementById('quiz-content').innerHTML = "<p class='text-center p-5'>Đang lấy đề thi từ hệ thống CAEE...</p>";

    try {
        const response = await fetch(WEB_APP_URL);
        allQuestions = await response.json();
        
        // Lấy ngẫu nhiên 30 câu
        selectedQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 30);

        showQuestion(0);
        startTimer();
    } catch (error) {
        alert("Lỗi kết nối! Thầy kiểm tra lại quyền truy cập của Google Sheets nhé.");
        location.reload();
    }
}

// 3. Hàm hiển thị câu hỏi (Giữ nguyên giao diện đẹp của thầy)
function showQuestion(index) {
    currentQuestionIndex = index;
    const q = selectedQuestions[index];
    const container = document.getElementById('quiz-content');
    
    const imageHtml = q["HINHANH"] ? `<div class="text-center mb-3"><img src="${q["HINHANH"]}" class="img-fluid rounded border shadow-sm" style="max-height:250px;"></div>` : "";
    const isSelected = (opt) => userAnswers[index] === opt ? "checked" : "";

    container.innerHTML = `
        <div class="question-page p-3 bg-white rounded shadow-sm">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="badge bg-primary px-3 py-2">Câu hỏi ${index + 1} / 30</span>
                <span class="text-muted small">Mã đề: CAEE-2026</span>
            </div>
            <h5 class="mb-4 text-dark font-weight-bold">${q["Nội dung câu hỏi"]}</h5>
            ${imageHtml}
            <div class="options-list mt-3">
                ${['A', 'B', 'C', 'D'].map(opt => `
                    <div class="form-check mb-3 p-2 border rounded hover-shadow">
                        <input class="form-check-input ms-1" type="radio" name="quizOption" id="opt${opt}" value="${opt}" 
                            ${isSelected(opt)} onchange="saveAnswer(${index}, '${opt}')">
                        <label class="form-check-label w-100 ps-4" for="opt${opt}">
                            <strong>${opt}.</strong> ${q["Đáp án " + opt]}
                        </label>
                    </div>
                `).join('')}
            </div>
            <div class="navigation-btns d-flex justify-content-between mt-5">
                <button class="btn btn-outline-secondary px-4" onclick="prevQuestion()" ${index === 0 ? 'disabled' : ''}>Trước</button>
                ${index === 29 ? 
                    `<button class="btn btn-success px-4" onclick="confirmSubmit()">Nộp bài</button>` : 
                    `<button class="btn btn-primary px-4" onclick="nextQuestion()">Tiếp theo</button>`
                }
            </div>
        </div>`;
}

// 4. Các hàm xử lý
function saveAnswer(index, value) { userAnswers[index] = value; }
function nextQuestion() { if (currentQuestionIndex < 29) showQuestion(currentQuestionIndex + 1); }
function prevQuestion() { if (currentQuestionIndex > 0) showQuestion(currentQuestionIndex - 1); }

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let min = Math.floor(timeLeft / 60);
        let sec = timeLeft % 60;
        document.getElementById('timer').innerText = `Thời gian: ${min}:${sec < 10 ? '0' : ''}${sec}`;
        if (timeLeft <= 0) submitQuiz();
    }, 1000);
}

function confirmSubmit() {
    if (confirm("Học viên chắc chắn muốn nộp bài?")) submitQuiz();
}

// 5. Chốt nộp bài gửi về Sheets (Đã sửa lỗi bảo mật và link)
async function submitQuiz() {
    clearInterval(timerInterval);
    let score = 0;
    selectedQuestions.forEach((q, i) => {
        if (userAnswers[i] === q["Đáp án đúng"]) score++;
    });

    const status = score >= 24 ? "ĐẠT" : "KHÔNG ĐẠT";
    const payload = {
        name: document.getElementById('studentName').value,
        id: document.getElementById('studentID').value,
        score: score,
        status: status
    };

    document.getElementById('quiz-screen').innerHTML = `<div class="text-center p-5"><h4>Đang lưu điểm của thầy về Excel...</h4></div>`;

    try {
        await fetch(WEB_APP_URL, { 
            method: "POST", 
            mode: "no-cors",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) 
        });
        alert(`Kết quả: ${score}/30 câu - ${status}`);
    } catch (e) {
        alert("Có lỗi gửi điểm, hãy chụp màn hình kết quả!");
    }
    location.reload();
}
