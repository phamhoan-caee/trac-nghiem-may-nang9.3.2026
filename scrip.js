// --- CẤU HÌNH HỆ THỐNG ---
const EXAM_TIME_MINUTES = 20; // Thời gian thi (phút)
const TOTAL_QUESTIONS_TO_SHOW = 30; // Số câu hỏi mỗi đề
const PASS_SCORE = 25; // Số câu đúng để đạt
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyFfsbggthMpC4mCJJAVjVgiVbbPG1SaquMKDhZZlbWXa0H9hAz4-6YPnFBA0zxtgQ0/exec";

// --- BIẾN TOÀN CỤC ---
let examQuestions = [];
let currentIndex = 0;
let userScore = 0;
let timerInterval;
let timeLeft = EXAM_TIME_MINUTES * 60;
let studentName = "";

// 1. Hàm bắt đầu thi
function startExam() {
    studentName = document.getElementById('student-name').value.trim();
    if (!studentName) {
        alert("Thầy/Cô vui lòng yêu cầu học viên nhập Họ và Tên!");
        return;
    }

    // Trộn toàn bộ ngân hàng câu hỏi và lấy 30 câu
    examQuestions = shuffleArray([...questionBank]).slice(0, TOTAL_QUESTIONS_TO_SHOW);
    
    // Chuyển màn hình
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');

    renderQuestion();
    startTimer();
}

// 2. Thuật toán trộn mảng (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 3. Hiển thị câu hỏi
function renderQuestion() {
    const q = examQuestions[currentIndex];
    document.getElementById('progress').innerText = `Câu ${currentIndex + 1}/${TOTAL_QUESTIONS_TO_SHOW}`;
    document.getElementById('question-text').innerText = q.question;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(opt, q.answer);
        optionsDiv.appendChild(btn);
    });
}

// 4. Xử lý khi chọn đáp án
function handleAnswer(selected, correct) {
    if (selected === correct) {
        userScore++;
    }

    currentIndex++;
    if (currentIndex < TOTAL_QUESTIONS_TO_SHOW) {
        renderQuestion();
    } else {
        finishExam();
    }
}

// 5. Đồng hồ đếm ngược
function startTimer() {
    timerInterval = setInterval(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        document.getElementById('timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishExam();
        }
        timeLeft--;
    }, 1000);
}

// 6. Kết thúc và Gửi kết quả
function finishExam() {
    clearInterval(timerInterval);
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');

    const status = userScore >= PASS_SCORE ? "ĐẠT" : "TRƯỢT";
    document.getElementById('score-display').innerText = `${userScore}/${TOTAL_QUESTIONS_TO_SHOW}`;
    document.getElementById('score-display').style.color = status === "ĐẠT" ? "green" : "red";

    // Hiển thị phần giải thích
    let reviewHtml = "<h3>Hướng dẫn giải thích:</h3>";
    examQuestions.forEach((q, index) => {
        reviewHtml += `
            <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                <strong>Câu ${index + 1}: ${q.question}</strong><br>
                <span style="color: #0056b3;">➜ Đáp án: ${q.answer}</span><br>
                <small><i>${q.explain}</i></small>
            </div>`;
    });
    document.getElementById('review-area').innerHTML = reviewHtml;

    // Tự động gửi dữ liệu về Google Sheets
    sendDataToGoogle(studentName, userScore, status);
}

// 7. Hàm gửi API
function sendDataToGoogle(name, score, status) {
    if (WEB_APP_URL === "DÁN_URL_WEB_APP_GOOGLE_SHEETS_CỦA_THẦY_VÀO_ĐÂY") return;

    const data = {
        name: name,
        score: score,
        status: status
    };

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(() => console.log("Đã gửi điểm thành công!"))
    .catch(error => console.error("Lỗi gửi dữ liệu:", error));
}
