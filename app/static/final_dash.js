/* ============================================================
   Results dashboard renderer — matches final_dash.html / final_dash.css
   Reads sessionStorage['interview_report'] written by interview.js.

   The previous version queried IDs that do not exist in the page
   (#score-percentage, question-N-*, strongest-area, dashboard-button)
   and threw a TypeError on load, which is why nothing rendered.
   This version targets the markup that actually exists and builds
   the question cards and recommendation list itself.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const REPORT_KEY = 'interview_report';

    const CRITERIA = ['relevance', 'specificity', 'structure'];

    const LABEL = {
        relevance: 'Relevance',
        specificity: 'Specificity',
        structure: 'Structure'
    };

    const ADVICE = {
        relevance:
            'Answer the question that was asked, in the first sentence. If the question asks for an example, lead with the example — not with background.',
        specificity:
            'Name the project, the tool and the number. "Built a FastAPI service that cut report time from 20 minutes to 30 seconds" beats "worked on backend stuff".',
        structure:
            'Use claim, then evidence, then result. One idea per sentence, and stop talking when the answer is finished.'
    };

    /* ---------- read the report ---------- */

    let report = null;
    try {
        report = JSON.parse(sessionStorage.getItem(REPORT_KEY) || 'null');
    } catch (error) {
        report = null;
    }

    const questions = Array.isArray(report?.questions) ? report.questions : [];
    const results = Array.isArray(report?.results) ? report.results : [];

    const emptyState = document.getElementById('empty-state');
    const root = document.getElementById('results-root');

    /* ---------- helpers ---------- */

    const score = (value) => {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 && number <= 2
            ? number
            : null;
    };

    const text = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    /* ---------- assemble the numbers ---------- */

    const totals = { relevance: 0, specificity: 0, structure: 0 };

    let overall = 0;
    let scoredCount = 0;

    const perQuestion = results.map((item, index) => {
        const feedback = item?.feedback || null;
        const values = feedback ? CRITERIA.map((key) => score(feedback[key])) : [];
        const complete = values.length === 3 && values.every((v) => v !== null);
        const total = complete ? values.reduce((sum, v) => sum + v, 0) : null;

        if (complete) {
            overall += total;
            scoredCount += 1;
            CRITERIA.forEach((key, i) => { totals[key] += values[i]; });
        }

        return {
            index,
            question: questions[index] || `Question ${index + 1}`,
            answer: item?.answer || '',
            feedback,
            total
        };
    });

    /* ---------- empty state ---------- */

    const hasAnything = questions.length > 0 && scoredCount > 0;

    if (!hasAnything) {
        if (root) root.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
    }

    if (root) root.hidden = false;
    if (emptyState) emptyState.hidden = true;

    const maximum = questions.length * 6;          // 18 for three questions
    const skillMaximum = questions.length * 2;     // 6 per skill
    const percentage = maximum ? Math.round((overall / maximum) * 100) : 0;

    /* ---------- hero ---------- */

    text('completion-status',
        scoredCount === questions.length
            ? 'Interview completed'
            : `${scoredCount} of ${questions.length} answers scored`);

    text(
        'hero-copy',
        `${scoredCount} of ${questions.length} answers were scored against the evidence in your resume. Treat this as a practice estimate, not a verdict.`
    );

    /* ---------- overall panel ---------- */

    text('overall-score', String(overall));
    text('overall-max', `/ ${maximum}`);
    text('overall-percent', `${percentage}%`);

    // Ring circumference is 364.42 in the CSS.
    const ring = document.getElementById('ring-fill');
    if (ring) {
        const circumference = 364.42;
        const fraction = maximum ? Math.min(overall / maximum, 1) : 0;
        ring.style.strokeDashoffset = String(circumference * (1 - fraction));
    }

    const values = CRITERIA.map((key) => totals[key]);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);

    const strongestLabel = highest === lowest
        ? 'Even across all three'
        : CRITERIA.filter((key) => totals[key] === highest).map((key) => LABEL[key]).join(' / ');

    const weakestLabel = highest === lowest
        ? 'Even across all three'
        : CRITERIA.filter((key) => totals[key] === lowest).map((key) => LABEL[key]).join(' / ');

    const weakest = CRITERIA.reduce(
        (acc, key) => (totals[key] < totals[acc] ? key : acc),
        CRITERIA[0]
    );

    const summary =
        percentage >= 75
            ? 'Most of your answers landed with concrete evidence. Keep the same shape and slow down on the weakest skill.'
            : percentage >= 50
                ? 'Half or more of your marks came from answers that were clear but thin. Add one concrete detail to each answer.'
                : 'The answers were short on evidence. Before the next attempt, write down two projects from your resume and one number for each.';

    text('overall-summary', summary);
    text('stat-strongest', strongestLabel);
    text('stat-weakest', weakestLabel);

    /* ---------- skill cards ---------- */

    CRITERIA.forEach((key) => {
        const value = totals[key];
        text(`skill-${key}`, String(value));

        const bar = document.getElementById(`bar-${key}`);
        if (bar) {
            bar.style.width = `${skillMaximum ? Math.round((value / skillMaximum) * 100) : 0}%`;
        }

        const meter = document.getElementById(`meter-${key}`);
        if (meter) {
            meter.setAttribute('aria-valuenow', String(value));
            meter.setAttribute('aria-valuetext', `${value} out of ${skillMaximum}`);
        }
    });

    /* ---------- question cards ---------- */

    const list = document.getElementById('questions-list');

    if (list) {
        list.textContent = '';

        perQuestion.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'card question';

            const head = document.createElement('div');
            head.className = 'q-head';

            const title = document.createElement('div');
            title.className = 'q-title';

            const index = document.createElement('span');
            index.className = 'q-index';
            index.textContent = String(item.index + 1);
            index.setAttribute('aria-hidden', 'true');

            const questionText = document.createElement('h3');
            questionText.className = 'q-text';
            questionText.textContent = item.question;

            title.append(index, questionText);

            const badge = document.createElement('p');
            badge.className = 'q-score';
            if (item.total === null) {
                badge.dataset.state = 'unscored';
                badge.textContent = 'Not scored';
            } else {
                badge.append(document.createTextNode(String(item.total)));
                const small = document.createElement('small');
                small.textContent = '/6';
                badge.append(small);
            }

            head.append(title, badge);

            const answerBox = document.createElement('p');
            answerBox.className = 'q-answer';
            if (item.answer) {
                answerBox.textContent = item.answer;
            } else {
                answerBox.dataset.empty = 'true';
                answerBox.textContent = 'No answer submitted.';
            }

            const feedbackGrid = document.createElement('div');
            feedbackGrid.className = 'q-feedback';

            const block = (className, heading, body) => {
                const wrap = document.createElement('div');
                wrap.className = `fb ${className}`;

                const h4 = document.createElement('h4');
                h4.textContent = heading;

                wrap.append(h4);

                if (Array.isArray(body)) {
                    const ul = document.createElement('ul');
                    body.forEach((entry) => {
                        const li = document.createElement('li');
                        li.textContent = entry;
                        ul.append(li);
                    });
                    wrap.append(ul);
                } else {
                    const p = document.createElement('p');
                    p.textContent = body;
                    wrap.append(p);
                }

                return wrap;
            };

            const feedback = item.feedback;

            if (feedback) {
                feedbackGrid.append(
                    block('fb-evidence', 'Evidence from your resume',
                        feedback.evidence || 'Not listed in your profile.')
                );

                const claims = Array.isArray(feedback.unsupported_claims)
                    ? feedback.unsupported_claims.filter(Boolean)
                    : [];

                feedbackGrid.append(
                    block('fb-claims', 'Claims your resume does not support',
                        claims.length ? claims : ['None found.'])
                );

                feedbackGrid.append(
                    block('fb-tip', 'What to fix',
                        feedback.tip || 'Add one concrete detail next time.')
                );
            } else {
                feedbackGrid.append(
                    block('fb-tip', 'What to fix',
                        'This answer was not evaluated, so there is no feedback for it.')
                );
            }

            card.append(head, answerBox, feedbackGrid);
            list.append(card);
        });
    }

    /* ---------- recommendations ---------- */

    const insightList = document.getElementById('insights-recommendations');

    if (insightList) {
        insightList.textContent = '';

        const items = [ADVICE[weakest]];

        perQuestion.forEach((item) => {
            const tip = item.feedback?.tip;
            if (tip && !items.includes(tip)) items.push(tip);
        });

        const unscored = perQuestion.filter((item) => item.total === null).length;
        if (unscored) {
            items.push(
                `${unscored} ${unscored === 1 ? 'answer was' : 'answers were'} not scored. Retype or re-record ${unscored === 1 ? 'it' : 'them'} so the percentage reflects every question.`
            );
        }

        items.slice(0, 3).forEach((entry, i) => {
            const li = document.createElement('li');
            li.dataset.step = String(i + 1);
            li.textContent = entry;
            insightList.append(li);
        });
    }

    /* ---------- actions ---------- */

    const practiceAgain = document.getElementById('practice-again');
    if (practiceAgain) {
        practiceAgain.addEventListener('click', () => {
            sessionStorage.removeItem(REPORT_KEY);
        });
    }
});
