// script.js
document.addEventListener('DOMContentLoaded', () => {
    // !!! 중요: README.md 파일을 읽고, 배포된 자신의 Google Apps Script 웹 앱 URL로 변경하세요.
    const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxqL1oB8cY_cMHmfCROSIByhW47pFIXPY6Cg1-lzF5LChFT-yn_cUTHGLiyfnwxanE5PQ/exec'; // 이 URL은 그대로 사용하시면 됩니다.

    const recordForm = document.getElementById('record-form');
    const recordsContainer = document.getElementById('records-container');
    const dateInput = document.getElementById('date');
    const exportButton = document.getElementById('export-excel');
    // --- 차트 캔버스 ID 변경 ---
    const dataChartCanvas = document.getElementById('data-chart'); 
    let recordsCache = []; // 데이터 캐싱
    let dataChart; // 차트 변수명 변경

    // 페이지 로드 시 오늘 날짜로 기본 설정
    dateInput.value = new Date().toISOString().split('T')[0];

    // 데이터 로드 및 화면 업데이트
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
            // --- 새로운 차트 렌더링 함수 호출 ---
            renderExpenditureChart();

        } catch (error) {
            console.error('Error loading records:', error);
            recordsContainer.innerHTML = `<p style="color: red;">데이터를 불러오는 데 실패했습니다. README.md 파일을 확인하여 설정을 완료했는지 확인하세요.</p>`;
        }
    };

    // DOM에 기록 목록 행 추가 (완전히 새로운 구조)
    const addRecordToDOM = (record) => {
        const row = document.createElement('div');
        row.classList.add('record-row');

        // --- 새로운 데이터 구조에 맞춰 innerHTML 변경 ---
        row.innerHTML = `
            <div class="record-date">${new Date(record.Date).toLocaleDateString()}</div>
            <div class="record-expenditure">${record.Expenditure || '-'}</div>
            <div class="record-reason" title="${record.Reason}">${record.Reason || '-'}</div>
            <div class="record-factor">${record.Factor || '-'}</div>
            <div class="record-style" title="${record.Style}">${record.Style || '-'}</div>
        `;
        recordsContainer.appendChild(row);
    };

    // 지출 통계 차트 렌더링 (기존 renderMoodChart 대체)
    const renderExpenditureChart = () => {
        // --- 'Expenditure' 필드를 기준으로 데이터 집계 ---
        const expenditureCounts = recordsCache.reduce((acc, record) => {
            const expenditure = record.Expenditure || '미분류';
            acc[expenditure] = (acc[expenditure] || 0) + 1;
            return acc;
        }, {});

        const chartData = {
            labels: Object.keys(expenditureCounts),
            datasets: [{
                label: '지출 구간별 횟수',
                data: Object.values(expenditureCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                hoverOffset: 4
            }]
        };

        if (dataChart) {
            dataChart.destroy(); // 기존 차트 파괴
        }

        dataChart = new Chart(dataChartCanvas, {
            type: 'pie', // 원형 차트
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: {
                        display: true,
                        text: '월 평균 지출 금액 분포' // 차트 제목 변경
                    }
                }
            }
        });
    };

    // 폼 제출 이벤트 처리
    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';

        const formData = new FormData(recordForm);
        // --- 새로운 폼 데이터에 맞춰 전송할 데이터 객체 생성 ---
        const data = {
            date: formData.get('date'),
            expenditure: formData.get('expenditure'),
            factor: formData.get('factor'),
            // 복수 선택 가능한 'style'은 getAll로 배열을 받아 쉼표로 구분된 문자열로 변환
            style: formData.getAll('style').join(', '), 
            channel: formData.get('channel'),
            tendency: formData.get('tendency'),
            reason: formData.get('reason'),
            expectation: formData.get('expectation')
        };

        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                redirect: 'follow',
                body: JSON.stringify(data)
            });

            alert('성공적으로 기록되었습니다!');
            recordForm.reset();
            dateInput.value = new Date().toISOString().split('T')[0];
            loadRecords(); // 데이터 다시 불러오기

        } catch (error) {
            console.error('Error submitting record:', error);
            alert('기록 저장에 실패했습니다. 인터넷 연결을 확인하세요.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '리포트 기록하기';
        }
    });

    // 엑셀 내보내기 이벤트 처리
    exportButton.addEventListener('click', () => {
        if (recordsCache.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(recordsCache);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "패션 소비 기록");

        // --- 엑셀 파일명 변경 ---
        XLSX.writeFile(workbook, "fitter_meter_records.xlsx");
    });

    // 초기 데이터 로드
    loadRecords();
});