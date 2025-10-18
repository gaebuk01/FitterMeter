// script.js
document.addEventListener('DOMContentLoaded', () => {
    // !!! 중요: 이 URL은 사용자 본인의 것이므로 그대로 사용하세요.
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz1rYuVij3Jtm4Kq0oBlasopUECeyW6XJegJ7GzpYjIHCguLXbfV9hAu4fmvlya1RfD3g/exec';

    const recordForm = document.getElementById('record-form');
    const recordsContainer = document.getElementById('records-container');
    const dateInput = document.getElementById('date');
    const exportButton = document.getElementById('export-excel');
    
    // 차트 캔버스 요소 가져오기
    const expenditureChartCanvas = document.getElementById('expenditure-chart');
    const factorChartCanvas = document.getElementById('factor-chart');
    const styleChartCanvas = document.getElementById('style-chart');
    const tendencyChartCanvas = document.getElementById('tendency-chart');
    
    let recordsCache = [];
    let expenditureChart, factorChart, styleChart, tendencyChart; // 차트 인스턴스 변수

    dateInput.value = new Date().toISOString().split('T')[0];

    const loadRecords = async () => {
        try {
            recordsContainer.innerHTML = '<p>데이터를 불러오는 중...</p>';
            const response = await fetch(WEB_APP_URL, { method: 'GET', redirect: 'follow' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            recordsCache = await response.json();
            
            if (!Array.isArray(recordsCache)) {
                console.error("Error data received from Google Apps Script:", recordsCache);
                throw new Error('Google Apps Script에서 에러가 발생했습니다. 개발자 도구(F12)의 Console 탭에서 상세 정보를 확인하세요.');
            }
            
            recordsCache.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
            
            recordsContainer.innerHTML = ''; 
            recordsCache.forEach(addRecordToDOM);

            // 모든 차트 렌더링 함수 호출
            renderExpenditureChart();
            renderFactorChart();
            renderStyleChart();
            renderTendencyChart();

        } catch (error) {
            console.error('Error loading records:', error);
            recordsContainer.innerHTML = `<p style="color: red;">데이터를 불러오는 데 실패했습니다. README.md 파일을 확인하여 설정을 완료했는지 확인하세요.</p>`;
        }
    };

    const addRecordToDOM = (record) => {
        const row = document.createElement('div');
        row.classList.add('record-row');
        row.innerHTML = `
            <div class="record-date">${new Date(record.Date).toLocaleDateString()}</div>
            <div class="record-expenditure">${record.Expenditure || '-'}</div>
            <div class="record-reason" title="${record.Reason}">${record.Reason || '-'}</div>
            <div class="record-factor">${record.Factor || '-'}</div>
            <div class="record-style" title="${record.Style}">${record.Style || '-'}</div>
        `;
        recordsContainer.appendChild(row);
    };

    // 지출 통계 차트 (원형)
    const renderExpenditureChart = () => {
        const dataCounts = recordsCache.reduce((acc, record) => {
            const item = record.Expenditure || '미분류';
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

        if (expenditureChart) expenditureChart.destroy();
        expenditureChart = new Chart(expenditureChartCanvas, {
            type: 'pie',
            data: {
                labels: Object.keys(dataCounts),
                datasets: [{ data: Object.values(dataCounts), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: '월 평균 지출 금액 분포' }}}
        });
    };
    
    // --- ✨ 2. 새로운 차트 렌더링 함수들 추가 ---

    // 고려 요소 차트 (원형)
    const renderFactorChart = () => {
        const dataCounts = recordsCache.reduce((acc, record) => {
            const item = record.Factor || '미분류';
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

        if (factorChart) factorChart.destroy();
        factorChart = new Chart(factorChartCanvas, {
            type: 'pie',
            data: {
                labels: Object.keys(dataCounts),
                datasets: [{ data: Object.values(dataCounts), backgroundColor: ['#FF9F40', '#4BC0C0', '#FFCD56', '#C9CBCF', '#9966FF'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: '구매 시 고려 요소' }}}
        });
    };

    // 선호 스타일 차트 (막대)
    const renderStyleChart = () => {
        const dataCounts = recordsCache.reduce((acc, record) => {
            if (record.Style) {
                const styles = record.Style.split(', '); // 복수 선택된 스타일 분리
                styles.forEach(item => {
                    acc[item] = (acc[item] || 0) + 1;
                });
            }
            return acc;
        }, {});

        if (styleChart) styleChart.destroy();
        styleChart = new Chart(styleChartCanvas, {
            type: 'bar',
            data: {
                labels: Object.keys(dataCounts),
                datasets: [{ label: '선택 횟수', data: Object.values(dataCounts), backgroundColor: '#36A2EB' }]
            },
            options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: '선호 패션 스타일' }}}
        });
    };

    // 소비 성향 차트 (원형)
    const renderTendencyChart = () => {
        const dataCounts = recordsCache.reduce((acc, record) => {
            const item = record.Tendency || '미분류';
            acc[item] = (acc[item] || 0) + 1;
            return acc;
        }, {});

        if (tendencyChart) tendencyChart.destroy();
        tendencyChart = new Chart(tendencyChartCanvas, {
            type: 'pie',
            data: {
                labels: Object.keys(dataCounts),
                datasets: [{ data: Object.values(dataCounts), backgroundColor: ['#9966FF', '#FF6384', '#FF9F40', '#36A2EB'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: '패션 소비 성향' }}}
        });
    };

    // '기타' 옵션 기능 함수
    function setupOtherOptionListeners() {
        const questionsWithOptions = [ { name: 'factor', type: 'radio' }, { name: 'style', type: 'checkbox' }, { name: 'channel', type: 'radio' }, { name: 'tendency', type: 'radio' } ];
        questionsWithOptions.forEach(q => {
            const inputs = document.querySelectorAll(`input[name="${q.name}"]`);
            const otherTextInput = document.getElementById(`${q.name}-other-text`);
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    let otherIsSelected = (q.type === 'radio') ? (document.querySelector(`input[name="${q.name}"]:checked`)?.value === '기타') : (document.querySelector(`input[name="${q.name}"][value="기타"]`)?.checked);
                    otherTextInput.style.display = otherIsSelected ? 'block' : 'none';
                    if (!otherIsSelected) otherTextInput.value = '';
                });
            });
        });
    }

    // --- ✨ 2. 스타일 2개 선택 제한 함수 ---
    function limitStyleChoices() {
        const styleCheckboxes = document.querySelectorAll('input[name="style"]');
        styleCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const checkedCount = document.querySelectorAll('input[name="style"]:checked').length;
                if (checkedCount >= 2) {
                    styleCheckboxes.forEach(cb => {
                        if (!cb.checked) {
                            cb.disabled = true;
                        }
                    });
                } else {
                    styleCheckboxes.forEach(cb => {
                        cb.disabled = false;
                    });
                }
            });
        });
    }

    // 폼 제출 이벤트 처리
    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';
        const formData = new FormData(recordForm);
        let factorValue = formData.get('factor') === '기타' ? formData.get('factor-other') : formData.get('factor');
        const styleValues = formData.getAll('style').filter(val => val !== '기타');
        const styleOtherText = formData.get('style-other').trim();
        if (styleOtherText) styleValues.push(styleOtherText);
        let channelValue = formData.get('channel') === '기타' ? formData.get('channel-other') : formData.get('channel');
        let tendencyValue = formData.get('tendency') === '기타' ? formData.get('tendency-other') : formData.get('tendency');

        const data = {
            date: formData.get('date'),
            expenditure: formData.get('expenditure'),
            factor: factorValue,
            style: styleValues.join(', '),
            channel: channelValue,
            tendency: tendencyValue,
            reason: formData.get('reason'),
            expectation: formData.get('expectation')
        };
        try {
            await fetch(WEB_APP_URL, { method: 'POST', mode: 'no-cors', cache: 'no-cache', redirect: 'follow', body: JSON.stringify(data) });
            alert('성공적으로 기록되었습니다!');
            recordForm.reset();
            dateInput.value = new Date().toISOString().split('T')[0];
            document.querySelectorAll('.other-input').forEach(input => input.style.display = 'none');
            document.querySelectorAll('input[name="style"]').forEach(cb => cb.disabled = false);
            loadRecords();
        } catch (error) {
            console.error('Error submitting record:', error);
            alert('기록 저장에 실패했습니다. 인터넷 연결을 확인하세요.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '리포트 기록하기';
        }
    });

    exportButton.addEventListener('click', () => {
        if (recordsCache.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(recordsCache);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "패션 소비 기록");
        XLSX.writeFile(workbook, "fitter_meter_records.xlsx");
    });
    
    // 페이지 로드 시 기능 활성화
    setupOtherOptionListeners();
    limitStyleChoices();
    loadRecords();
});