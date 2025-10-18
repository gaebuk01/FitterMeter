// script.js
document.addEventListener('DOMContentLoaded', () => {
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwdkuw2ut_51AeO-TPu08Lh1ex4vNOhA5Hos64ROuXx3M-hMP5pBAhhU6tuR-yulzekEg/exec';

    const recordForm = document.getElementById('record-form');
    const recordsContainer = document.getElementById('records-container');
    const dateInput = document.getElementById('date');
    const exportButton = document.getElementById('export-excel');

    const expenditureChartCanvas = document.getElementById('expenditure-chart');
    const factorChartCanvas = document.getElementById('factor-chart');
    const styleChartCanvas = document.getElementById('style-chart');
    const tendencyChartCanvas = document.getElementById('tendency-chart');

    let recordsCache = [];
    let expenditureChart, factorChart, styleChart, tendencyChart;

    const chartColors = {
        mediumPink: '#FFB6C1', softPink: '#FFDAE9', rosePink: '#FFC0CB',
        paleViolet: '#DB7093', lightOrchid: '#E6E6FA', mediumOrchid: '#DDA0DD',
    };
    const pieColors1 = [chartColors.mediumPink, chartColors.rosePink, chartColors.paleViolet, chartColors.lightOrchid, chartColors.mediumOrchid];
    const pieColors2 = [chartColors.rosePink, chartColors.lightOrchid, chartColors.paleViolet, chartColors.mediumOrchid, chartColors.mediumPink];
    const pieColors3 = [chartColors.lightOrchid, chartColors.mediumPink, chartColors.paleViolet, chartColors.rosePink];

    // --- ✨ 6. 기본 날짜 설정 확인 ---
    dateInput.value = new Date().toISOString().split('T')[0];

    const loadRecords = async () => { try { recordsContainer.innerHTML = '<p>데이터를 불러오는 중...</p>'; const response = await fetch(WEB_APP_URL, { method: 'GET', redirect: 'follow' }); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); recordsCache = await response.json(); if (!Array.isArray(recordsCache)) { console.error("Error data:", recordsCache); throw new Error('Apps Script Error.'); } recordsCache.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp)); recordsContainer.innerHTML = ''; recordsCache.forEach(addRecordToDOM); renderExpenditureChart(); renderFactorChart(); renderStyleChart(); renderTendencyChart(); } catch (error) { console.error('Error loading records:', error); recordsContainer.innerHTML = `<p style="color: red;">데이터 로딩 실패. 설정을 확인하세요.</p>`; } };

    // --- ✨ 5. 테이블 내용 순서 변경 ---
    const addRecordToDOM = (record) => {
        const row = document.createElement('div');
        row.classList.add('record-row');
        // 순서: Nickname, Style, Reason, Factor, Date
        row.innerHTML = `
            <div class="record-nickname">${record.Nickname || '-'}</div>
            <div class="record-style" title="${record.Style || '-'}">${record.Style || '-'}</div>
            <div class="record-reason" title="${record.Reason || '-'}">${record.Reason || '-'}</div>
            <div class="record-factor">${record.Factor || '-'}</div>
            <div class="record-date">${new Date(record.Date).toLocaleDateString()}</div>
        `;
        recordsContainer.appendChild(row);
    };

    // 지출 통계 차트 (원형)
    const renderExpenditureChart = () => { const dataCounts = recordsCache.reduce((acc, record) => { const item = record.Expenditure || '미분류'; acc[item] = (acc[item] || 0) + 1; return acc; }, {}); if (expenditureChart) expenditureChart.destroy(); expenditureChart = new Chart(expenditureChartCanvas, { type: 'pie', data: { labels: Object.keys(dataCounts), datasets: [{ data: Object.values(dataCounts), backgroundColor: pieColors1 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: '월 평균 지출 금액 분포' }}} }); };
    // 고려 요소 차트 (원형)
    const renderFactorChart = () => { const dataCounts = recordsCache.reduce((acc, record) => { const item = record.Factor || '미분류'; acc[item] = (acc[item] || 0) + 1; return acc; }, {}); if (factorChart) factorChart.destroy(); factorChart = new Chart(factorChartCanvas, { type: 'pie', data: { labels: Object.keys(dataCounts), datasets: [{ data: Object.values(dataCounts), backgroundColor: pieColors2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: '구매 시 고려 요소' }}} }); };
    // 선호 스타일 차트 (막대)
    const renderStyleChart = () => { const baseStyleLabels = ["미니멀", "스트릿", "꾸안꾸", "빈티지", "클래식", "페미닌"]; let finalStyleLabels = [...baseStyleLabels]; const recordedCounts = recordsCache.reduce((acc, record) => { if (record.Style) { const styles = record.Style.split(', '); styles.forEach(item => { acc[item] = (acc[item] || 0) + 1; if (!baseStyleLabels.includes(item) && item && !finalStyleLabels.includes('기타')) { finalStyleLabels.push('기타'); } }); } return acc; }, {}); const chartDataValues = finalStyleLabels.map(label => recordedCounts[label] || 0); if (styleChart) styleChart.destroy(); styleChart = new Chart(styleChartCanvas, { type: 'bar', data: { labels: finalStyleLabels, datasets: [{ label: '선택 횟수', data: chartDataValues, backgroundColor: chartColors.softPink }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: '선호 패션 스타일' }}, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } }); };
    // 소비 성향 차트 (원형)
    const renderTendencyChart = () => { const dataCounts = recordsCache.reduce((acc, record) => { const item = record.Tendency || '미분류'; acc[item] = (acc[item] || 0) + 1; return acc; }, {}); if (tendencyChart) tendencyChart.destroy(); tendencyChart = new Chart(tendencyChartCanvas, { type: 'pie', data: { labels: Object.keys(dataCounts), datasets: [{ data: Object.values(dataCounts), backgroundColor: pieColors3 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: '패션 소비 성향' }}} }); };

    // '기타' 옵션 기능 함수
    function setupOtherOptionListeners() { const questionsWithOptions = [ { name: 'factor', type: 'radio' }, { name: 'style', type: 'checkbox' }, { name: 'channel', type: 'radio' }, { name: 'tendency', type: 'radio' } ]; questionsWithOptions.forEach(q => { const inputs = document.querySelectorAll(`input[name="${q.name}"]`); const otherTextInput = document.getElementById(`${q.name}-other-text`); inputs.forEach(input => { input.addEventListener('change', () => { let otherIsSelected = (q.type === 'radio') ? (document.querySelector(`input[name="${q.name}"]:checked`)?.value === '기타') : (document.querySelector(`input[name="${q.name}"][value="기타"]`)?.checked); otherTextInput.style.display = otherIsSelected ? 'block' : 'none'; if (!otherIsSelected) otherTextInput.value = ''; }); }); }); }
    // 스타일 2개 선택 제한 함수
    function limitStyleChoices() { const styleCheckboxes = document.querySelectorAll('input[name="style"]'); styleCheckboxes.forEach(checkbox => { checkbox.addEventListener('change', () => { const checkedCount = document.querySelectorAll('input[name="style"]:checked').length; if (checkedCount >= 2) { styleCheckboxes.forEach(cb => { if (!cb.checked) { cb.disabled = true; } }); } else { styleCheckboxes.forEach(cb => { cb.disabled = false; }); } }); }); }

    // 폼 제출 이벤트 처리
    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true; submitButton.textContent = '저장 중...';
        const formData = new FormData(recordForm);
        // --- ✨ 4. 닉네임 데이터 가져오기 ---
        const nickname = formData.get('nickname');
        let factorValue = formData.get('factor') === '기타' ? formData.get('factor-other') : formData.get('factor');
        const styleValues = formData.getAll('style').filter(val => val !== '기타');
        const styleOtherText = formData.get('style-other').trim(); if (styleOtherText) styleValues.push(styleOtherText);
        let channelValue = formData.get('channel') === '기타' ? formData.get('channel-other') : formData.get('channel');
        let tendencyValue = formData.get('tendency') === '기타' ? formData.get('tendency-other') : formData.get('tendency');

        const data = {
            // --- ✨ 4. 닉네임 데이터 추가 ---
            nickname: nickname,
            date: formData.get('date'), expenditure: formData.get('expenditure'),
            factor: factorValue, style: styleValues.join(', '), channel: channelValue,
            tendency: tendencyValue, reason: formData.get('reason'), expectation: formData.get('expectation')
        };
        try {
            await fetch(WEB_APP_URL, { method: 'POST', mode: 'no-cors', cache: 'no-cache', redirect: 'follow', body: JSON.stringify(data) });
            alert('성공적으로 기록되었습니다!'); recordForm.reset(); dateInput.value = new Date().toISOString().split('T')[0];
            document.querySelectorAll('.other-input').forEach(input => input.style.display = 'none');
            document.querySelectorAll('input[name="style"]').forEach(cb => cb.disabled = false);
            loadRecords();
        } catch (error) { console.error('Error submitting record:', error); alert('기록 저장에 실패했습니다. 인터넷 연결을 확인하세요.');
        } finally { submitButton.disabled = false; submitButton.textContent = '리포트 기록하기'; }
    });
    // 엑셀 내보내기 이벤트 처리
    exportButton.addEventListener('click', () => { if (recordsCache.length === 0) { alert('내보낼 데이터가 없습니다.'); return; } const worksheet = XLSX.utils.json_to_sheet(recordsCache); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "패션 소비 기록"); XLSX.writeFile(workbook, "fitter_meter_records.xlsx"); });

    setupOtherOptionListeners();
    limitStyleChoices();
    loadRecords();
});