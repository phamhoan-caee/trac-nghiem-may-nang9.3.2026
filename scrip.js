// 1. Cấu hình
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwxGySySYeE0wsg-41K5lTQUYgL_beTxmCGagDfwQO1AUxLs_l8K4iGMgz-jKE9sxc/exec";

let allQuestions = [];
let selectedQuestions = [];
let userAnswers = {}; // Lưu trữ đáp án học viên chọn
let currentIdx = 0;   // Chỉ số câu hỏi hiện tại
let timeLeft = 1200; 
let timerInterval;

// 2. Hàm bắt đầu thi
async function startQuiz() {
    const name = document.getElementById('studentName').value.trim();
    const id = document.getElementById('studentID').value.trim();

    if (!name || !id) {
        alert("Thầy nhắc học viên nhập đủ Họ tên và Mã số nhé!");
        return;
    }

    document.getElementById('start-screen').innerHTML = `
        <div class="card-body text-center">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Đang lấy đề thi từ hệ thống CAEE...</p>
        </div>`;

    try {
        const response = await fetch(WEB_APP_URL);
        allQuestions = await response.json();
        selectedQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 30);

        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('quiz-screen').style.display = 'block';

        showQuestion(0); // Hiển thị câu đầu tiên
        startTimer();
    } catch (error) {
        alert("Lỗi kết nối! Thầy kiểm tra lại link Web App hoặc quyền chia sẻ nhé.");
        location.reload();
    }
}

// 3. Hàm hiển thị TỪNG câu hỏi (Thay thế renderQuestions cũ)
function showQuestion(index) {
    currentIdx = index;
    const q = selectedQuestions[index];
    const container = document.getElementById('quiz-content');
    
    const imageHtml = q["HINHANH"] ? `<div class="text-center"><img src="${q["HINHANH"]}" class="img-fluid rounded border mb-3 shadow-sm" style="max-height:250px;"></div>` : "";
    
    // Kiểm tra đáp án đã chọn trước đó để tích lại
    const getChecked = (opt) => userAnswers[index] === opt ? "checked" : "";

    container.innerHTML = `
        <div class="question-box p-4 bg-white rounded shadow-sm">
            <div class="d-flex justify-content-between mb-3 border-bottom pb-2">
                <span class="badge bg-primary px-3 py-2">Câu ${index + 1} / 30</span>
                <span class="text-muted small">Mã đề: CAEE-2026</span>
            </div>
            
            <h5 class="text-dark mb-4">${q["Nội dung câu hỏi"]}</h5>
            ${imageHtml}
            
            <div class="options-group">
                ${['A', 'B', 'C', 'D'].map(opt => `
                    <div class="form-check mb-3 p-2 border rounded ${userAnswers[index] === opt ? 'bg-light border-primary' : ''}">
                        <input class="form-check-input ms-1" type="radio" name="quizOption" id="opt${opt}" value="${opt}" 
                            ${getChecked(opt)} onchange="saveAnswer(${index}, '${opt}')">
                        <label class="form-check-label w-100 ps-4 cursor-pointer" for="opt${opt}">
                            <strong>${opt}.</strong> ${q["Đáp án " + opt]}
                        </label>
                    </div>
                `).join('')}
            </div>

            <div class="navigation-buttons d-flex justify-content-between mt-4 border-top pt-3">
                <button class="btn btn-outline-secondary px-4" onclick="prevQuestion()" ${index === 0 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Câu trước
                </button>
                
                ${index === 29 ? 
                    `<button class="btn btn-success px-4" onclick="confirmSubmit()">NỘP BÀI <i class="fas fa-paper-plane"></i></button>` : 
                    `<button class="btn btn-primary px-4" onclick="nextQuestion()">Câu tiếp <i class="fas fa-chevron-right"></i></button>`
                }
            </div>
        </div>`;
}

// 4. Lưu đáp án (CHỈ LƯU - TUYỆT ĐỐI KHÔNG CHUYỂN CÂU)
function saveAnswer(index, value) {
    userAnswers[index] = value;
    // Thầy lưu ý: Chỗ này không gọi hàm showQuestion nữa nên máy sẽ đứng im tại chỗ.
}

function nextQuestion() {
    if (currentIdx < 29) showQuestion(currentIdx + 1);
}

function prevQuestion() {
    if (currentIdx > 0) showQuestion(currentIdx - 1);
}

// 5. Đồng hồ & Gửi kết quả
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let min = Math.floor(timeLeft / 60);
        let sec = timeLeft % 60;
        document.getElementById('timer').innerText = `Thời gian còn lại: ${min}:${sec < 10 ? '0' : ''}${sec}`;
        if (timeLeft <= 0) submitQuiz();
    }, 1000);
}

function confirmSubmit() {
    const answered = Object.keys(userAnswers).length;
    if(confirm(`Bạn đã làm ${answered}/30 câu. Chắc chắn muốn nộp bài?`)) submitQuiz();
}

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

    document.getElementById('quiz-screen').innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-grow text-success" role="status"></div>
            <h3>Đang gửi kết quả về bảng điểm CAEE...</h3>
        </div>`;

    try {
        await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(payload)
        });
        alert(`Chúc mừng! Bạn đúng ${score}/30 câu. Kết quả: ${status}`);
    } catch (e) {
        alert("Lỗi mạng! Thầy nhắc học viên chụp màn hình kết quả này!");
    }
    location.reload();
}
