
document.addEventListener("DOMContentLoaded", () => {
    const reportKey = "interview_report";

    const report = JSON.parse(
        sessionStorage.getItem(reportKey) || "null"
    );

    // If no interview report exists
    if (!report) {
        document.querySelector("#overall-score").textContent = "--";
        return;
    }

    const questions = report.questions || [];
    const results = report.results || [];

    const criteria = ["relevance", "specificity", "structure"];

    const safeScore = (value) => {
        const number = Number(value);

        return Number.isFinite(number) && number >= 0 && number <= 2
            ? number
            : null;
    };

    const formatScore = (value) =>
        value === null ? "--" : value;

    // Calculate overall and individual criterion scores
    let overallScore = 0;
    const criterionTotals = {
        relevance: 0,
        specificity: 0,
        structure: 0
    };

    let scoredQuestions = 0;

    results.forEach((item) => {
        if (!item || !item.feedback) return;

        const feedback = item.feedback;
        let questionTotal = 0;
        let complete = true;

        criteria.forEach((criterion) => {
            const value = safeScore(feedback[criterion]);

            if (value === null) {
                complete = false;
            } else {
                criterionTotals[criterion] += value;
                questionTotal += value;
            }
        });

        if (complete) {
            overallScore += questionTotal;
            scoredQuestions++;
        }
    });

    // Overall score: maximum 18
    const maximumScore = questions.length * 6;
    const percentage = maximumScore
        ? Math.round((overallScore / maximumScore) * 100)
        : 0;

    document.querySelector("#overall-score").textContent =
        scoredQuestions ? overallScore : "--";

    document.querySelector("#score-percentage").textContent =
        scoredQuestions ? percentage + "%" : "--";

    // Skill scores: maximum 6 each for three questions
    criteria.forEach((criterion) => {
        const scoreElement = document.getElementById(
            criterion + "-score"
        );

        const barElement = document.getElementById(
            criterion + "-bar"
        );

        const total = criterionTotals[criterion];

        if (scoreElement) {
            scoreElement.textContent = scoredQuestions
                ? formatScore(total)
                : "--";
        }

        if (barElement) {
            barElement.style.width = scoredQuestions
                ? (total / (questions.length * 2)) * 100 + "%"
                : "0%";
        }
    });

    // Performance level
    const level = document.querySelector("#performance-level");

    if (level) {
        if (!scoredQuestions) {
            level.textContent = "Not scored";
        } else if (percentage >= 75) {
            level.textContent = "Strong performance";
        } else if (percentage >= 50) {
            level.textContent = "Developing performance";
        } else {
            level.textContent = "Needs improvement";
        }
    }

    // Question-wise results
    questions.forEach((question, index) => {
        const item = results[index] || {};
        const feedback = item.feedback || {};

        const number = index + 1;

        const questionElement = document.getElementById(
            `question-${number}-text`
        );

        const answerElement = document.getElementById(
            `question-${number}-answer`
        );

        const feedbackElement = document.getElementById(
            `question-${number}-feedback`
        );

        const scoreElement = document.getElementById(
            `question-${number}-score`
        );

        const total = ["relevance", "specificity", "structure"]
            .map((key) => safeScore(feedback[key]))
            .every((value) => value !== null)
            ? ["relevance", "specificity", "structure"]
                .reduce((sum, key) => sum + feedback[key], 0)
            : null;

        if (questionElement) {
            questionElement.textContent = question;
        }

        if (answerElement) {
            answerElement.textContent =
                item.answer || "No answer submitted.";
        }

        if (scoreElement) {
            scoreElement.textContent =
                total === null ? "--" : total + "/6";
        }

        if (feedbackElement) {
            feedbackElement.textContent = feedback.tip ||
                "No improvement feedback available.";
        }
    });

    // Strongest and weakest criteria
    const ranked = criteria
        .map((key) => ({
            name: key,
            score: criterionTotals[key]
        }))
        .sort((a, b) => b.score - a.score);

    const strongest = document.querySelector("#strongest-area");
    const weakest = document.querySelector("#weakest-area");

    if (scoredQuestions && strongest) {
        strongest.textContent = ranked[0].name;
    }

    if (scoredQuestions && weakest) {
        weakest.textContent = ranked[ranked.length - 1].name;
    }

    // Navigation
    document.querySelector("#dashboard-button")
        ?.addEventListener("click", () => {
            window.location.href = "/applicant";
        });

    document.querySelector("#practice-again-button")
        ?.addEventListener("click", () => {
            sessionStorage.removeItem(reportKey);
            window.location.href = "/interview";
        });
});
