const HOST = 'http://exam-2023-1-api.std-900.ist.mospolytech.ru';
const API_KEY = '90c0df04-2bdb-46f3-b872-c10bc12aa70c';

 
let routesData;
let filteredRoutes;
  
const itemsPerPage = 5;
let currentPage = 1;

const HOLIDAYS = [
    "1-1", "1-2", "1-3", "1-4", "1-5", "1-6", "1-7",
    "1-8", "2-23", "3-8", "5-1", "5-9", "6-12", "11-4"
]; 

const orderModal = document.getElementById('orderModal');
const dateField = orderModal.querySelector('#date');
const timeField = orderModal.querySelector('#startTime');
const durationField = orderModal.querySelector('#orderDuration');
const personsField = orderModal.querySelector('#personsCount');
const priceField = orderModal.querySelector('#price');
const studentField = orderModal.querySelector('#isStudent');
const transportField = orderModal.querySelector('#isTransport');


function isThisDayOff(dateString) { // высчитывает день недели
    let date = new Date(dateString);
    let day = date.getDay();
    let MonthDay = (date.getMonth() + 1) + '-' + date.getDate();
    if (day === 0 || day === 6) { // 0 - воскресенье, 6 - суббота
        return 1.5; 
    } else if (holidaysArray.includes(MonthDay)) {
        return 1.5;
    } else {
        return 1;
    }
}

function getTimeExtra(startTime) { // высчитывает время начала
    let time = startTime.split(":");
    let hours = parseInt(time[0]); 

    if (hours >= 9 && hours <= 12) {        
        return 400;
    } else if (hours >= 20 && hours <= 23) { 
        return 1000;
    }

    return 0;
}

function calculateCost(guideCost, duration, date, startTime, 
    personsNumber, students, transport) { // высчитывает общую сумму
    let price = guideCost * duration * isThisDayOff(date);
    price += personsNumber > 5 && personsNumber <= 10 ? 1000 : 0;
    price += personsNumber > 10 && personsNumber <= 20 ? 1500 : 0;
    price *= transport &&  (isThisDayOff(date) == 1.5) ? 1.25 : 1.3;
    price *= students ? 0.85 : 1;
    return Math.floor(price);
}

function calculateOrderCost() { // выводит общую сумму
    const date = dateField.value;
    const time = timeField.value;
    const duration = durationField.value;
    const persons = personsField.value;
                     
    const student = studentField.checked;
    const transport = transportField.checked;

    const cost = calculateCost(orderModal.guide.pricePerHour, duration, date,
        time, persons, student, transport);

    priceField.textContent = cost + ' рублей.';
                                  
    return cost;
}

function clearRoutesTable() {// очистка таблицы с маршрутами
    document.getElementById('routesTableBody').innerHTML = '';
}

function addRoutesToTable(routes) { // загрузка таблицы с маршрутами
    const tableBody = document.getElementById('routesTableBody');
  
    routes.forEach(route => {
        const row = tableBody.insertRow();
        row.insertCell(0).innerHTML = route.name;
        row.insertCell(1).innerHTML = route.description;
        row.insertCell(2).innerHTML = route.mainObject;

        const selectButton = document.createElement('button');
        selectButton.innerText = 'Выбрать';
        selectButton.addEventListener('click', () => guideDownload(route));
        row.insertCell(3).appendChild(selectButton);
    });
}

function highlightSearchResult(searchKeyword) {// поиск и выделение в маршрутах
    const tableBody = document.getElementById('routesTableBody');
    const rows = tableBody.getElementsByTagName('tr');
  
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        const nameCell = cells[0];

        const cellValue = nameCell.innerText;

        const lowerCaseCellValue = cellValue.toLowerCase();
        const lowerCaseSearchKeyword = searchKeyword.toLowerCase();
  
        if (lowerCaseCellValue.includes(lowerCaseSearchKeyword)) {
            const startIndex = lowerCaseCellValue.indexOf(
                lowerCaseSearchKeyword
            );

            const endIndex = startIndex + searchKeyword.length;
  
            const highlightedText = cellValue.substring(0, startIndex) +
          `<span class="search-highlight">${cellValue.substring(startIndex, endIndex)}</span>` +
            cellValue.substring(endIndex);
  
            nameCell.innerHTML = highlightedText;
        }
    }
}

function searchRoutes() {// поиск и выделение в маршрутах на основе чекбокса и строки в таблице маршрутов(пока нигде не вызывается)
    const searchKeyword = document.getElementById('routeNameInput')
        .value.toLowerCase();
    const selectedObject = document.getElementById('mainObjectSelect')
        .value.toLowerCase();
  
    filteredRoutes = routesData.filter(route => 
        route.name.toLowerCase().includes(searchKeyword) &&
        route.mainObject.toLowerCase().includes(selectedObject)
    );
  
    const limitedRoutes = filteredRoutes.slice(0, itemsPerPage);
  
    clearRoutesTable();
    addRoutesToTable(limitedRoutes);
    updatePaginationAfterSearch(filteredRoutes);
    highlightSearchResult(searchKeyword);
}
  
function resetSearch() {// сброс параметров поиска таблицы маршрутов(пока нигде не вызывается)
    document.getElementById('routeNameInput').value = '';
    document.getElementById('mainObjectSelect').value = '';
    filteredRoutes = null;
    updateTable();
}

function getoptionforselect(q) {// удаляет из массива все повторяющиеся переменные
    return [... new Set(q)];    
}

function clearLanguageOptions(selectElement) {// отвечает за чекбокс с языками экскурсии
    const select = document.getElementById('selectedLanguge');
    select.innerHTML = '';

    const option = document.createElement('option');
    option.value = "";
    option.innerHTML = "Язык экскурсии";
    select.appendChild(option);
}

function updateLanguageSelect(languages) {// отвечает за чекбокс с языками экскурсии
    const select = document.getElementById('selectedLanguge');
    for (let i in languages) {
        const option = document.createElement('option');
        option.value = i;
        option.innerHTML = languages[i];
        select.appendChild(option);
    }  
}

function guideDownload(route) { // загрузка таблицы с гидами
    let guideTable = document.querySelector('#guideTable');
    let arr = [];
    fetch(`${HOST}/api/routes/${route.id}/guides?api_key=${API_KEY}`)
        .then(response => response.json())
        .then(response => {
            arr = [];
            clearLanguageOptions();
            guideTable.innerHTML = '';
            for (let item of response) {
                const row = guideTable.insertRow();

                const guidePhoto = document.createElement('img');
                guidePhoto.src = './images/profile.png';
                guidePhoto.style.height = '34px';
                guidePhoto.style.width = '34px';
                guidePhoto.alt = 'Фото профиля';
                
                row.insertCell(0).appendChild(guidePhoto);
                row.insertCell(1).textContent = item.name;
                row.insertCell(2).textContent = item.language;
                row.insertCell(3).textContent = item.workExperience;
                row.insertCell(4).textContent = item.pricePerHour;

                const selectButton = document.createElement('button');

                selectButton.setAttribute('data-bs-toggle', 'modal');
                selectButton.setAttribute('data-bs-target', '#orderModal');
                selectButton.textContent = 'Выбрать';

                selectButton.addEventListener('click', () => {
                    setModalWindow(route, item);
                });
                row.insertCell(5).appendChild(selectButton);

                const fromExperiense = document.getElementById('guideFromExperiense').value;

                const toExperiense = document.getElementById('guideToExperiense').value;

                const selectedLanguage = document.getElementById('selectedLanguge').value;

                if ((fromExperiense !== '') &&
                    (fromExperiense > item.workExperience) ||
                    (toExperiense !== '') &&
                    (toExperiense < item.workExperience) &&
                    selectedLanguage === item.language) {
                    row.classList.add("none");
                }
                guideTable.append(row);
                arr.push(item.language);
            } 
            updateLanguageSelect(getoptionforselect(arr));
        });
}

function guideOptions() {// фильтрует таблицу гидов
    let list = document.querySelectorAll('#guideTable tr');
    let from = Number(document.getElementById('guideFromExperiense').value);
    let to = Number(document.getElementById('guideToExperiense').value);

    const selectedLanguage = document.getElementById('selectedLanguge');
    for (let i in list) {
        if ((from == 0 || from <= list[i].cells[3].innerHTML) &&
        (to == 0 || to >= list[i].cells[3].innerHTML) &&
        (selectedLanguage)
            .options[selectedLanguage.selectedIndex]
            .innerHTML === 'Язык экскурсии' ||
        (selectedLanguage)
            .options[selectedLanguage.selectedIndex]
            .innerHTML === list[i].cells[2].innerHTML) {

            list[i].classList.remove("none");
        } else {
            list[i].classList.add("none");
        }
    }
}

function setModalWindow(route, guide) {// установка окна заявки
    orderModal.guide = guide;

    orderModal.querySelector('#routeName').value = route.name;
    orderModal.querySelector('#guideFullName').value = guide.name;

    calculateOrderCost();

    orderModal.querySelector('#sendData').onclick = async () => {
        const formData = new FormData();

        formData.append("route_id", route.id);
        formData.append("guide_id", guide.id);
        formData.append("date", dateField.value);
        formData.append("time", timeField.value);
        formData.append("duration", durationField.value);
        formData.append("persons", personsField.value);
        formData.append("optionFirst", Number(studentField.checked));
        formData.append("optionSecond", Number(transportField.checked));

        const price = calculateOrderCost();

        formData.append("price", price);

        console.log(formData);

        const requestOptions = {
            method: 'POST',
            body: formData,
            redirect: 'follow'
        };

        let response = await fetch(
            `${HOST}/api/orders?api_key=${API_KEY}`,
            requestOptions
        ).then(response => response.json()); 

    };
}

function fetchRoutesFromApi() {// получает данные из api о маршрутах
    fetch(
        `${HOST}/api/routes?api_key=${API_KEY}`
    )
        .then(response => response.json())
        .then(data => {
            routesData = data;
            updateTable();
        })
        .catch(error => console.error('Error fetching route data:', error));
}

function updateTable() { // управляет обновлением и отображением данных о маршрутах
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRoutes = filteredRoutes ?
        filteredRoutes.slice(startIndex, endIndex) :
        routesData.slice(startIndex, endIndex);
  
    clearRoutesTable();
    addRoutesToTable(currentRoutes);
    updatePagination();
    
    const searchKeyword = document.getElementById('routeNameInput')
        .value.toLowerCase();

    if (searchKeyword) {
        highlightSearchResult(searchKeyword);
    }
}
  
function handlePageClick(pageNumber) {// вызывает разные значения в соответствии со страницей
    currentPage = pageNumber;
    updateTable();
}

function createPaginationItem(text, pageNumber) {
    const pageItem = document.createElement('li');
    pageItem.className = 'page-item';
  
    const pageLink = document.createElement('a');
    pageLink.className = 'page-link';
    pageLink.href = 'javascript:void(0)';
    pageLink.innerText = text;
  
    if (
        (text === 'Предыдущий' && currentPage === 1) ||
        (text === 'Следующий' && 
            currentPage === Math.ceil((filteredRoutes ? 
                filteredRoutes.length : routesData.length) / itemsPerPage)
        )) {
        pageItem.classList.add('disabled');
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            handlePageClick(pageNumber);
        });
    } else {
        pageLink.addEventListener('click', () => handlePageClick(pageNumber));
    }
 
    if (pageNumber === currentPage) {
        pageItem.classList.add('active');
    }
  
    pageItem.appendChild(pageLink);
  
    return pageItem;
}

function updatePaginationAfterSearch(filteredRoutes) {// обновляет элементы пагинации на основе фильтрации
    const paginationElement = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  
    paginationElement.innerHTML = '';
  
    const prevItem = createPaginationItem('Previous', currentPage - 1);
    paginationElement.appendChild(prevItem);
  
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = createPaginationItem(i, i);
        paginationElement.appendChild(pageItem);
    }
  
    const nextItem = createPaginationItem('Next', currentPage + 1);
    paginationElement.appendChild(nextItem);
}
  
function updatePagination() {// обновлении таблицы на основе пагинации
    const paginationElement = document.getElementById('pagination');
    const totalPages = Math.ceil((filteredRoutes ?
        filteredRoutes.length : 
        routesData.length) / itemsPerPage);
  
    paginationElement.innerHTML = '';
  
    const prevItem = createPaginationItem('Previous', currentPage - 1);
    paginationElement.appendChild(prevItem);
  
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = createPaginationItem(i, i);
        paginationElement.appendChild(pageItem);
    }
  
    const nextItem = createPaginationItem('Next', currentPage + 1);
    paginationElement.appendChild(nextItem);
}  

function clickHandler(event) {// обработка событий
    const screen = document.querySelector('.screen');
    const target = event.target;
    const row = document.querySelectorAll('th');
    let id = 0;
    if (target.classList.contains('choose')) {
        for (let i = 6; i < row.length; i++) {
            if (target.id == row[i].id) {
                row[i].classList.add('table-success');
                id = row[i].getAttribute('name');
            } else {
                row[i].classList.remove('table-success');
            }
        }
    }
}

window.onload = function() {
    dateField.addEventListener('change', calculateOrderCost);
    timeField.addEventListener('change', calculateOrderCost); 
    durationField.addEventListener('change', calculateOrderCost);
    personsField.addEventListener('change', calculateOrderCost);
    priceField.addEventListener('change', calculateOrderCost); 
    studentField.addEventListener('change', calculateOrderCost);
    transportField.addEventListener('change', calculateOrderCost);
    document.getElementById('guideFromExperiense').oninput = guideOptions;
    document.getElementById('guideToExperiense').oninput = guideOptions;
    document.getElementById('selectedLanguge').onchange = guideOptions;
    const table = document.querySelector('.table');
    table.addEventListener('click', clickHandler);
    fetchRoutesFromApi();
};
