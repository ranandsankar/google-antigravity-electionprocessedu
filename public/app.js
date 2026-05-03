// app.js - CivicPath AI Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            navBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-current', 'false');
            });
            views.forEach(v => v.classList.add('hidden'));

            // Add active class to target
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Timeline Builder Logic
    const buildTimelineBtn = document.getElementById('build-timeline-btn');
    const timelineList = document.getElementById('timeline-list');
    const electionTypeSelect = document.getElementById('election-type');

    buildTimelineBtn.addEventListener('click', async () => {
        const type = electionTypeSelect.value;
        timelineList.innerHTML = '<li class="placeholder-text">Loading timeline...</li>';
        
        try {
            const response = await fetch(`/api/timeline?type=${type}`);
            if (!response.ok) throw new Error('Failed to fetch timeline');
            const data = await response.json();
            
            timelineList.innerHTML = ''; // clear
            data.timeline.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                `;
                timelineList.appendChild(li);
            });
        } catch (error) {
            console.error(error);
            timelineList.innerHTML = '<li class="placeholder-text" style="color: var(--error-text)">Error loading timeline. Make sure the server is running.</li>';
        }
    });

    // Chat / Ask AI Logic
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const chatLoading = document.getElementById('chat-loading');

    function appendMessage(data, sender) {
        const bubble = document.createElement('div');
        bubble.classList.add('chat-bubble', sender);
        
        if (sender === 'user') {
            bubble.textContent = data;
        } else {
            // AI response object
            const badgeClass = data.isFallback ? 'badge-fallback' : 'badge-ai';
            const badgeText = data.isFallback ? 'Fallback Mode' : 'Gemini AI';
            
            let html = `<div class="ai-header"><span class="badge ${badgeClass}">${badgeText}</span></div>`;
            
            if (data.aiData.topic) {
                html += `<h4 class="ai-topic">${data.aiData.topic}</h4>`;
            }
            
            if (data.aiData.answer) {
                html += `<div class="ai-answer">${data.aiData.answer.replace(/\\n/g, '<br>')}</div>`;
            }
            
            if (data.aiData.steps && data.aiData.steps.length > 0) {
                html += `<ul class="ai-steps">`;
                data.aiData.steps.forEach(step => {
                    html += `<li>${step}</li>`;
                });
                html += `</ul>`;
            }
            
            if (data.aiData.indiaContext) {
                html += `<div class="ai-india-context"><strong>India Context:</strong> ${data.aiData.indiaContext}</div>`;
            }
            
            if (data.aiData.neutralityNote) {
                html += `<div class="ai-neutrality-note">${data.aiData.neutralityNote}</div>`;
            }
            
            if (data.aiData.officialReminder) {
                html += `<div class="ai-official-reminder"><strong>Important:</strong> ${data.aiData.officialReminder}</div>`;
            }
            
            bubble.innerHTML = html;
        }
        
        chatHistory.appendChild(bubble);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (!message) return;

        appendMessage(message, 'user');
        chatInput.value = '';
        chatLoading.classList.remove('hidden');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            appendMessage(data, 'ai');
        } catch (error) {
            console.error('Chat error:', error);
            appendMessage({
                isFallback: true,
                aiData: {
                    topic: "Connection Error",
                    answer: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
                    indiaContext: "",
                    officialReminder: "Election rules, dates, voter lists, polling stations, and ID requirements can change. Always verify through the Election Commission of India, Voters’ Services Portal, or your official State Chief Electoral Officer website.",
                    neutralityNote: "Nonpartisan Education Only"
                }
            }, 'ai');
        } finally {
            chatLoading.classList.add('hidden');
        }
    });

    // Quiz Logic
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const quizContent = document.getElementById('quiz-content');
    const quizResults = document.getElementById('quiz-results');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const feedbackContainer = document.getElementById('feedback-container');
    const nextBtn = document.getElementById('next-btn');
    const scoreText = document.getElementById('score-text');

    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    async function loadQuiz() {
        try {
            const response = await fetch('/api/quiz');
            if (!response.ok) throw new Error('Failed to fetch quiz');
            const data = await response.json();
            questions = data.questions;
            
            startQuizBtn.classList.add('hidden');
            quizContent.classList.remove('hidden');
            showQuestion();
        } catch (error) {
            console.error(error);
            alert("Error loading quiz. Make sure the server is running.");
        }
    }

    function showQuestion() {
        // Reset state
        feedbackContainer.classList.add('hidden');
        nextBtn.classList.add('hidden');
        optionsContainer.innerHTML = '';
        
        const q = questions[currentQuestionIndex];
        questionText.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}: ${q.question}`;
        
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.textContent = opt;
            btn.addEventListener('click', () => handleAnswer(index));
            optionsContainer.appendChild(btn);
        });
    }

    function handleAnswer(selectedIndex) {
        const q = questions[currentQuestionIndex];
        const buttons = optionsContainer.querySelectorAll('.option-btn');
        
        // Disable all buttons
        buttons.forEach(btn => btn.disabled = true);
        
        const isCorrect = selectedIndex === q.answer;
        if (isCorrect) score++;

        buttons[selectedIndex].classList.add(isCorrect ? 'correct' : 'wrong');
        if (!isCorrect) {
            buttons[q.answer].classList.add('correct'); // Show correct answer
        }

        feedbackContainer.textContent = isCorrect ? `Correct! ${q.explanation}` : `Incorrect. ${q.explanation}`;
        feedbackContainer.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
    }

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    });

    function showResults() {
        quizContent.classList.add('hidden');
        quizResults.classList.remove('hidden');
        scoreText.innerHTML = `You scored <strong>${score}</strong> out of <strong>${questions.length}</strong>!`;
    }

    function resetQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        quizResults.classList.add('hidden');
        startQuizBtn.classList.remove('hidden');
    }

    startQuizBtn.addEventListener('click', loadQuiz);
    restartQuizBtn.addEventListener('click', resetQuiz);
});
