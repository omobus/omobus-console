/* -*- JavaScript -*- */
/* Copyright (c) 2006 - 2022 omobus-console authors, see the included COPYRIGHT file. */

var lang = {
    __code: "ru",
    englishName: "Russian",
    nativeName: "Русский",
    calendar: {
	firstDay: 1,
	lastDay: 7,
	days: {
	    names: ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота",/*7:*/"воскресенье"],
	    namesAbbr: ["Вс","Пн","Вт","Ср","Чт","Пт","Сб",/*7:*/"Вс"]
	},
	months: {
	    names: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
	    namesAbbr: ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"]
	},
	monthsGenitive: {
	    names: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
	    namesAbbr: ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"]
	}
    },
    dateFormat: {
	time: "HH:MM",
	longtime: "HH:MM:ss",
	date: "dd.mm.yyyy",
	longdate: "dddd, d MMMM yyyy",
	datetime: "dd.mm.yyyy HH:MM:ss",
	longdatetime: "dddd, dd MMMM yyyy HH:MM:ss 'GMT'o",
	longmonth: "mmmm, yyyy",
	longday: "dddd, d MMMM"
    },
    numberFormat: {
	currency_precision: 2,
	thousand_delimiter: " "
    },
    personFormat: "{surname} {name} {patronymic}",

    /* String resources: */

    a_code: "Код клиента",
    a_name: "Клиент",
    abort: "прервать", 
    activity_type: "Вид активности",
    activity_type_everything: "Все виды активности",
    add: "Добавить",
    additions: {
	title: "Заявки на регистрацию нового клиента",
	types: "Тип нового клиента",
	everything: "Все типы нового клиента",
	accept: "Подтвердить регистрацию нового клиента",
	reject: "Отклонить регистрацию нового клиента",
	accepted: ["{0} подтвердил(-а) регистрацию нового клиента", "Регистрация нового клиента подтверждена"],
	rejected: "Регистрация нового клиента отклонена"
    },
    address: "Адрес",
    advt: {
	title: "Наличие рекламных материалов",
	title1: "Наличие рекламных материалов за"
    },
    agency: "Агентство",
    amount: "Сумма",
    analitics: "<div><b>АНАЛИТИЧЕСКИЕ ОТЧЕТЫ</b></div><div>Отчеты за весь временной интервал хранения данных в системе OMOBUS с периодом обновления не реже одного раза в час.</div>",
    apks: "<a href='/apk/'>Инструкция</a> по установке мобильного приложения OMOBUS.",
    archives: "<div><b>АРХИВНЫЕ ДАННЫЕ</b></div><div>Отчеты предоставляющие доступ к данным, размещенным в специализированном архивном хранилище OMOBUS.</div>",
    area: "Территория",
    asp_type: "Вид ДМП",
    asp_type_everything: "Все виды ДМП",
    attributes: "Дополнительные параметры",
    audits: {
	title: "Аудиты размещения продукции",
	title1: "Аудиты размещения продукции за"
    },
    author: "Автор",
    availability: "Наличие продукции",
    city_everything: "Все адм.-территор. образования",
    code: "Код",
    connecting: "Подключение...",
    back: "Назад",
    blob_size: "Размер, КБ",
    bonus: "Бонус",
    brand: "Бренд",
    brand_everything: "Все бренды",
    canceling_type_everything: "Все причины отмены р/дня",
    cancellations: {
	title: "Отмененные рабочие дни",
	add: "Отмена рабочего дня",
	type: "Причина отмены",
	msg0: "Сотрудник не задан. Определите сотрудника, для которого осуществляется отмена рабочего дня.",
	msg1: "Неверная дата отмены рабочего дня. Дата начала отмены не должна быть больше даты окончания отмены.",
	msg2: "Причина отмены рабочего дня не задана.",
	notice: "Обратите внимание на то, что отмена рабочего дня автоматичски аннулируется в случае выполнения плановой активноски."
    },
    canceled: "Отм.",
    categ_name: "Категория продукта",
    categ_everything: "Все категории продукта",
    chan_name: "Канал рынка",
    chan_everything: "Все каналы рынка",
    checkups: {
	title: "Осмотр торгового зала",
	title1: "Осмотр т/зала за"
    },
    closed: "Вып.",
    cohort: "Категория контакта",
    cohort_everything: "Все категории контактов",
    comments: {
	title: "Комментарии",
	title1: "Комментарии за",
	type: "Вид комментария",
	everything: "Все виды комментариев"
    },
    confirmations: {
	title: "Подтверждения задач",
	title1: "Подтверждения задач за",
	type: "Вид подтверждения",
	everything: "Все виды подтверждений"
    },
    contact: "Контакт",
    contact_everything: "Все контакты",
    contacts: {
	title: "Контакты",
	footnote0: "Контакт временно не работает",
	consents: {
	    abbr: ["ПД","Ин."],
	    name: ["Согласие на сбор и обработку персональных данных","Согласине на получение информационных сообщений"],
	    group: "Согласие",
	    timestamp: "Дата подписания согласия"
	}
    },
    cookie: "Метка",
    country: "Страна",
    country_everything: "Все страны",
    created_date: "Дата создания",
    created_time: "Время создания",
    dash: "-",
    data_ts: "Данные от",
    date: "Дата",
    daterange: {
	end_of_week: "до конца недели",
	end_of_month: "до конца месяца",
	end_of_quarter: "до конца квартала",
	end_of_year: "до конца года",
	next_month: "весь следующий месяц",
	next_quarter: "весь следующий квартал",
	next_year: "весь следующий год"
    },
    days: "Дней",
    deletions: {
	title: "Заявки на удаление клиента",
	accept: "Подтвердить удаление клиента",
	reject: "Отклонить удаление клиента",
	accepted: ["{0} подтвердил(-а) удаление клиента", "Удаление клиента подтверждено"],
	rejected: "Удаление клиента отклонено"
    },
    delivery_date: "Дата доставки",
    delivery_types_everything: "Все виды доставки",
    department: "Подразделение",
    departmentAbbr: "Подр.",
    department_everything: "Все подразделения",
    dev_login: "Login в OMOBUS",
    dev_id: "Уникальный код устройства",
    discount: "Скидка",
    discard_types_everything: "Все причины исключения из маршрута",
    discards: {
	title: "Заявки на исключение клиента из маршрута",
	type:  "Причина исключения из маршрута",
	accept: "Подтвердить исключение активности из маршрута",
	reject: "Отклонить исключение активности из маршрута",
	accepted: ["{0} подтвердил(-а) исключение активности из маршрута", "Исключение активности из маршрута подтверждено"],
	rejected: "Исключение активности из маршрута отклонено"
    },
    dist: "Расст., м.",
    distributor: "Дистрибьютор",
    distributors_everything: "Все дистрибьюторы",
    doc_no: "№ документа",
    doctypes: {
	addition: "Новый клиент",
	advt: "Наличие рекламных материалов",
	audit: "Аудит размещения продукции",
	canceling: "Отмена рабочего дня",
	checkup: "Осмотр торгового зала",
	comment: "Комментарий",
	confirmation: "Подтверждение выполнения задачи",
	contact: "Регистрация/изменение контакта клиента",
	deletion: "Заявка на удаление клиента",
	discard: "Заявка на исключение клиента из маршрута",
	dismiss: "Скрыть напоминание",
	equipment: "Регистрация/изменение оборудования",
	location: "Фиксация положение клиента",
	quest: "Анкетирование",
	oos: "Выявление причин Out-of-Stock",
	order: "Заказ продукции",
	pending: "Отложить посещение",
	photo: "Фотография торгового места",
	posm: "Мониторинг PoS/PoP материалов",
	presence: "Представленность продукции на полке",
	presentation: "Презентация продукции",
	price: "Мониторинг цен",
	profile: "Редактирование профиля клиента",
	promo: "Мониторинг промо активности конкурентов",
	rating: "Оценка работы сотрудника",
	reclamation: "Возврат продукции",
	review: "Итоги совместного маршрута",
	revoke: "Отзыв документа",
	shelf: "Доля полки / доля в ассортименте",
	stock: "Ревизия складских остатков",
	target: "Новая задача",
	training: "Обучение контакта (персонала клиента)",
	unsched: "Внеплановое действие",
	wish: "Заявка на включение клиента в маршрут"
    },
    dumps: "Дампы данных",
    dumps_notice: {
	everything: "В данном разделе приводятся снимки информации в формате CSV в кодировке UTF-8 (дампы) за весь период хранения данных в системе OMOBUS. Информация обновляется не менее одного раза в сутки. Открыть дампы в Microsoft Excel можно с помощью <a target='_blank' href='https://support.office.com/ru-ru/article/%D0%9C%D0%B0%D1%81%D1%82%D0%B5%D1%80-%D0%B8%D0%BC%D0%BF%D0%BE%D1%80%D1%82%D0%B0-%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0-c5b02af6-fda1-4440-899f-f78bafe41857'>мастера импорта текста</a>.",
	limited: "В данном разделе приводятся снимки информации в формате CSV в кодировке UTF-8 (дампы) начиная с <b>{0}</b>. Информация обновляется не менее одного раза в сутки. Открыть дампы в Microsoft Excel можно с помощью <a target='_blank' href='https://support.office.com/ru-ru/article/%D0%9C%D0%B0%D1%81%D1%82%D0%B5%D1%80-%D0%B8%D0%BC%D0%BF%D0%BE%D1%80%D1%82%D0%B0-%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0-c5b02af6-fda1-4440-899f-f78bafe41857'>мастера импорта текста</a>."
    },
    dumps_empty: "Дампы отсутствуют",
    dumps_denied: "Доступ к дампам запрещен",
    dumps_names: {
	"access-log": "Подключения к web-console ({0})",
	accounts: "Журнал клиентов ({0})",
	"action-log": "Журнал операций ({0})",
	advt: "Наличие рекламных материалов ({0})",
	audits: "Аудиты размещения продукции ({0})",
	checkups: "Результаты осмотра т/зала ({0})",
	confirmations: "Подтверждения задач ({0})",
	contacts: "Журнал контактов ({0})",
	equipments: "Журнал т/оборудования ({0})",
	"locstate-log": "Журнал состояния датчика местоположения ({0})",
	"Out-of-Stock": "Отсутствие товарного запаса ({0})",
	orders: "Заказы ({0})",
	presences: "Представленность на полке ({0})",
	presentations: "Презентации продукции ({0})",
	prices: "Мониторинг цен ({0})",
	promo: "Мониторинг промо активности конкурентов ({0})",
	quests: "Результаты анкетирования ({0})",
	reclamations: "Возвраты ({0})",
	routes: "Маршруты ({0})",
	"Share-of-Shelf": "Доля полки / доля в ассортименте ({0})",
	stocks: "Ревизия складских остатков ({0})",
	trainings: "Обучение контакта (персонала клиента) ({0})"
    },
    duration: "Длит.",
    email: "Электронная почта",
    empty: "<< НЕТ ДАННЫХ >>",
    errors: {
	auth: {
	    msg0: "Необходимо задать имя пользователя и пароль",
	    msg1: "Имя пользователя содержит недопустимые символы",
	    msg2: "Неверные учетные данные",
	    msg3: "Сессия не действительна",
	    msg4: "Сессия устарела",
	    msg5: "Браузер не поддерживает требуемый набор спецификаций W3C"
	},
	not_found: "Запрашиваемый ресурс не существует.",
	not_permitted: "Отсутствуют привилегии, необходимые для выполненния операции.",
	remark: {
	    note: "<b>Детальное описание</b> причины изменения статуса подтверждения выполнения задачи <b>не задано</b>. Введите описание причины изменения статуса и повторите попытку.",
	    exist: "Изменение состояния не выполнено. Повторная установка одного и того же состояния запрещена."
	},
	runtime: "Ошибка выполнения запроса на сервере.",
	target: {
	    sub: "<b>Название</b> задачи <b>не задано</b>. Введите название задачи и повторите попытку.",
	    body: "<b>Детальное описание</b> задачи <b>не задано</b>. Введите описание задаи и повторите попытку.",
	    type: "<b>Тип</b> задачи <b>не задан</b>. Определите тип задачи и повторите попытку.",
	    date: "Дата начала действия не должна превышать дату окончания действия задачи",
	    exist: "На основе данного документа уже сформирована задача. Повторная постановка задачи запрещена."
	},
	xlsx: "Ошибка создания XLSX файла с данными.",
	zstatus: {
	    note: "<b>Детальное описание</b> причины изменения статуса выполненной активности <b>не задано</b>. Введите описание причины изменения статуса и повторите попытку.",
	    exist: "Изменение состояния не выполнено. Повторная установка одного и того же состояния запрещена."
	}
    },
    exist: "В наличии",
    exit: "Выход",
    export: { 
	photo: "Скачать фото", progress: "Скачено {0} из {1}",
	xlsx: "Экспорт данных"
    },
    failure: "<< ОШИБКА ЗАГРУЗКИ ДАННЫХ >>",
    facing: "Лицом к покупателю",
    fix_date: "Дата фиксации на устройстве",
    fix_time: "Время фиксации на устройстве",
    geosearch: "Поиск адреса или объекта",
    head_name: "Руководитель",
    info_material: "Информационный материал",
    info_materials: {
	title: "Информационные материалы",
	caption: "Редактирование информационного материала #{0}",
	add: "Добавить информационный материал",
	msg0: "Загрузка файла [{0}] <i>отклонена</i>! Поддерживаются только файлы в формате PDF, MP4 или JPEG.",
	msg1: "Размер файла с информационным материалом [{0}] не должен превышать {1} МБ.",
	msg2: "<b>Название</b> информационного материала <b>не задано</b>. Введите название информационного материала и повторите попытку.",
	msg3: "<b>Страна</b>, в которой действует информационный материал <b>не задана</b>. Выберите страну из выпадающего списка и повторите попытку.",
	notice: "Обратите внимание на то, что название информационного материала должно однозначно идентифицировать данный материал.",
	placeholder: "Введите название информационного материала"
    },
    intotal: "Итого",
    job_title: "Должность",
    job_title_everything: "Все должности",
    joint_routes: {
	title: "Совместные маршруты",
	title1: "Совместные маршруты за",
	v: "Посещ.",
	duration: "Факт",
	note0: "Сильные стороны",
	note1: "Области для развития",
	note2: "Рекомендации для развития",
	notice0: "Начата повторная оценка работы сотрудника.",
	notice1: "Начата повторная оценка работы сотрудника. Текущие оценки и результаты совместного маршрута могут претерпеть изменения. Обратите внимание на то, что измененные оценки выделены красным цветом."
    },
    ka_type: "Тип сети",
    kilometers: "{0} км.",
    loyalty_level: "Уровень лояльности",
    loyalty_level_everything: "Все уровни лояльности",
    managment: "<div><b>УПРАВЛЯЮЩИЕ ОТЧЕТЫ</b></div><div>Отчеты управления позволяют вносить изменения в исходные данные, используемые в ходе работы OMOBUS.</div>",
    matrixAbbr: "М",
    matrix: "Согласованный ассортимент (матрица)",
    mileageAbbr: "Пробег, км.",
    mileageTotal: "Общий пробег за весь день",
    mileageTotalAbbr: "Пробег за день, км.",
    minutes: "{0} мин.",
    mobile: "Мобильный телефон",
    modified: "Последнее изменение",
    more_meter: ">{0} м.",
    more_min: ">{0} мин.",
    my: "Активная клиентская база",
    myAbbr: "АКБ",
    no: "Нет",
    no_results: "Нет результатов для \"{0}\"",
    none: "нет",
    not_specified: "--- не задано ---",
    note: "Примечание",
    note_placeholder: "Введите дополнительную информацию",
    notices: {
	document: {deleted: "Документ {0} удалён {1}.", closed: "Документ {0} закрыт {1}."},
	remark: "Изменение статуса подтверждения выполнения задачи используется в том случае, если необходимо дать обратную связь сотруднику по сформированному сотрудником подтверждению. В случае <i>отклонения подтверждения</i>, необходимо в обязательном порядке внести <i>детальное описание</i> причины отрицательной обратной связи.",
	target: "Задача начинает действовать с текущего дня. Продолжительность действия задачи рассчитывается автоматически в момент регистрации задачи. Обратите особое внимание на то, что название и описание должны однозначно идентифицировать задачу.",
	zstatus: ["Подтверждение выполненной активности не требует обязательного задания причины изменения статуса.","В случае отклонения выполненной активности необходимо обязательно указать причину изменения статуса."],
	clipboard: "Данные скопированы в буфер обмена"
    },
    num: "№",
    num_of_days: "{0} д.",
    latest: "Только последние",
    less_min: "<{0} мин.",
    login: "Вход в систему",
    oos_type: "Причина Out-of-Stock",
    oos_type_everything: "Все причины Out-of-Stock",
    oos: {
	title: "Выявление причин Out-of-Stock",
	title1: "Выявление причин Out-of-Stock за"
    },
    order_type: "Вид заказа",
    order_types_everything: "Все виды заказа",
    orders: {
	title: "Заказы продукции",
	title1: "Заказы продукции за",
	caption: "Заказ №{0} / {1}"
    },
    pack: "Упак.",
    payment: "Оплата",
    payment_delay: "Отсрочка",
    payment_methods_everything: "Все методы оплаты",
    participants: "Участников",
    password: "Пароль:",
    pending: "Отлож.",
    performer_name: "Исполнитель",
    phone: "Городской телефон",
    photo: "Фото",
    photos: {
	title: "Фотографии т/мест",
	title1: "Фотографии т/мест за",
	type: "Вид фотографии",
	everything: "Все виды фотографий"
    },
    photos_archive: {
	title: "Архив фотографий т/мест",
	title1: "Архив фотографий т/мест за"
    },
    placement: "Место размещения",
    placement_everything: "Все места размещения",
    planogram: "Планограмма",
    planograms: {
	title: "Планограммы",
	caption: "Редактирование планограммы #{0}",
	add: "Добавить планограмму",
	msg0: "Загрузка файла [{0}] <i>отклонена</i>! Поддерживаются только файлы в формате JPEG или PDF.",
	msg1: "Размер файла с планограммой [{0}] не должен превышать {1} МБ.",
	msg2: "<b>Название</b> планограммы <b>не задано</b>. Введите название планограммы и повторите попытку.",
	msg3: "<b>Страна</b>, в которой действует планограмма <b>не задана</b>. Выберите страну из выпадающего списка и повторите попытку.",
	msg4: "Список брендов, которые приведены на планограмме <b>не задан</b>. Выберите как минимум один бренд и повторите попытку.",
	notice: "Обратите внимание на то, что название планограммы должно однозначно идентифицировать содержимое изображения.",
	placeholder: "Введите название планограммы"
    },
    plugins: "Дополнительные отчеты",
    plus: "+",
    pos_material: "POS/POP материал",
    pos_material_everything: "Все POS/POP материалы",
    pos_materials: {
	title: "PoS/PoP материалы",
	caption: "Редактирование PoS/PoP материала #{0}",
	add: "Добавить PoS/PoP материал",
	msg0: "Загрузка файла [{0}] <i>отклонена</i>! Поддерживаются только файлы в формате JPEG или PDF.",
	msg1: "Размер файла с PoS/PoP материалом [{0}] не должен превышать {1} МБ.",
	msg2: "<b>Название</b> PoS/PoP материала <b>не задано</b>. Введите название POS/POP материала и повторите попытку.",
	msg3: "<b>Страна</b>, в которой действует PoS/PoP материал <b>не задана</b>. Выберите страну из выпадающего списка и повторите попытку.",
	msg4: "Список брендов, которые представляет PoS/PoP материала <b>не задан</b>. Выберите как минимум один бренд и повторите попытку.",
	notice: "Обратите внимание на то, что название PoS/PoP материала должно однозначно идентифицировать данный материал.",
	placeholder: "Введите название PoS/PoP материала"
    },
    posms: {
	title: "Мониторинг PoS/PoP материалов",
	title1: "Мониторинг PoS/PoP материалов за"
    },
    poten: "Категория клиента",
    poten_everything: "Все категории клиентов",
    presences: {
	title: "Представленность продукции на полке",
	title1: "Представленность на полке за"
    },
    presentations: {
	title: "Презентации продукции",
	title1: "Презентации продукции за"
    },
    price: "Цена",
    prices: {
	title: "Мониторинг цен",
	title1: "Мониторинг цен за"
    },
    p_code: "Код продукта",
    prod_name: "Продукт",
    prod_everything: "Все продукты",
    promo: "Промо",
    promos: {
	title: "Мониторинг активности конкурентов",
	title1: "Мониторинг активности конкурентов за",
	type: "Вид промо механики",
	type_everything: "Все промо механики",
	value: "Детали промо механики",
	value_everything: "Все детали промо механики"
    },
    qty: "Кол-во",
    qname: "Название анкеты",
    qname_everything: "Все названия анкет",
    qpath: "Раздел анкеты",
    qrow: "Вопрос анкеты",
    qrow_everything: "Все вопросы анкет",
    qvalue: "Значение",
    quests: {
	title: "Результаты анкетирования",
	title1: "Результаты анкетирования за"
    },
    received_ts: "Получено",
    region: "Регион",
    region_everything: "Все регионы",
    remark: {
	caption: "Изменение статуса подтверждения задачи",
	placeholder: "Введите причину изменения статуса подтверждения задачи",
	accept: "Принять подтверждение",
	reject: "Отклонить подтверждение",
	accepted: "Выполнение задачи принято",
	rejected: "Выполнение задачи отклонено",
	unchecked: "Только непроверенные"
    },
    rc_name: "Торговая сеть",
    rc_everything: "Все торговые сети",
    reclamation_type: "Причина возврата",
    reclamations: {
	title: "Возвраты продукции",
	title1: "Возвраты продукции за",
	caption: "Возврат №{0} / {1}"
    },
    refresh: "обновить",
    reports: {
	daily: "<div><b>ЕЖЕДНЕВНЫЕ ОТЧЕТЫ</b></div><div>Ежедневные детализированные отчеты по данным, собираемым с помощью мобильных терминалов. Оперативность данных 5-10 минут.</div>",
	monthly: "<div><b>ЕЖЕМЕСЯЧНЫЕ ОТЧЕТЫ</b></div><div>Сводные отчеты за месяц с периодом обновления не реже двух раз в час.</div>"
    },
    repentance: "Объяснение",
    restore: "Восстановить",
    return_date: "Дата возврата",
    revoke: "Аннулировать",
    role: "Сотрудник <b>{0}</b> подключен с IP:<b>{1}</b>.<br />Login: {2}. Role: {3}.",
    route: "Плановый маршрут",
    route_compliance: {
	title: "Выполнение планового маршрута",
	title1: "Выполнение маршрута за",
	wd: "Рабочий день по маршруту",
	none: "Нет планового маршрута",
	power: "Заряд батареи в теч. дня"
    },
    route_mileage: "Пробег по маршруту",
    routes: {
	title: "Редактирование маршрутов",
	title1: "Маршрут на",
	cycle: "{0} цикл {1} года",
	weeks: "Неделя цикла",
	days: "День недели",
	map: "На карте",
	route: "Только маршрут",
	msg0: "Предварительно необходимо выбрать сотрудника, для которого формируется маршрут. Для этого нажмите на [Все сотрудники] и выберите интересующего Вас сотрудника.",
	msg1: "Данный клиент был ранее удален из маршрута. Нажмите на [Восстановить] для возврашения клиента в маршрут.",
	msg2: "Данного клиента нет в маршруте. Нажмите [Добавить] для вставки клиента в маршрут.",
	msg3: "Нельзя определить плановые посещения для заблокированного или удаленного клиента.",
	msg4: "Действующие в текущий момент правила формирования маршрутов запрещают установку посещения на этот день недели.",
	msg5: "Действующие в текущий момент правила формирования маршрутов запрещают установку посещения на эту неделю цикла."
    },
    rrp: "РРЦ",
    save: "Сохранить",
    scheduler: {
	title: "Планировщик рабочего времени",
	types: {
	    "office": "Офисная работа",
	    "account": "Встреча с клиентом",
	    "audit": "Аудит",
	    "coaching": "Полевое обучение"
	},
	caption: "{2} с {0} по {1}",
	notice: "Запланируйте активность, которая будет выполняться в период с {0} по {1}. Для этого, выберите тип активности и дополнительные параметры активности.",
	commit: "Сохранить активность",
	placeholder: "Введите название клиента",
	ignored: "Сохранение параметров активности проигнорировано сервером OMOBUS. Данные остались без изменений. Рекомендуется обновть данные, отображаемые в планировщике.",
	myself: "Мой календарь",
	office_work: "Офисная работа",
	field_work: "Полевая работа",
	total_work: "Рабочего времени запланировано"
    },
    scheduled: "План",
    search: "Задайте параметры поиска",
    seconds: "{0} сек.",
    shared: "Разрешено распространение материала",
    shelf_stock: "Остаток на полке",
    shelfs: {
	title: "Доля полки / доля в ассортименте",
	title1: "Доля полки за",
	warn: "Цель: {0}. Выполена на: {1}."
    },
    shipment: "Отгрузка",
    shortage: "мало",
    specialization: "Специализация",
    specialization_everything: "Все специализации",
    status: "Статус",
    stock: "Остаток",
    stocks: {
	title: "Ревизия складских остатков",
	title1: "Ревизия складских остатков за"
    },
    success: {
	remark: "Статус подтверждения выполнения задачи успешно изменен.",
	target: "Задача успешно поставлена. Передача на устройства сотрудников будет выполнена в рамках ближайшего сеанса обмена данными.",
	zstatus: "Статус выполненной активности успешно изменен."
    },
    support: "Техническая поддержка",
    support_notice: "<div>При обращении в службу технической поддержки и/или поддержки пользователей необходимо указать:<div>1. Название компании, в которой Вы работаете (производитель, агентство, дистрибьютор).</div><div>2. Номер маршрута (логин в системе OMOBUS) и ФИО.</div><div>3. Детальное описание проблемы. Не прикладывайте каких-либо вложений к письму. Запросы с вложениями <b>игнорируются</b>!</div></div>",
    support_warning: "<div style='color:rgb(255,0,0)'><b>ВНИМАНИЕ: не сообщайте никому, даже сотрудникам технической поддержки OMOBUS, свой пароль учетной записи.</b></div>",
    targets_compliance: {
	title: "Журнал задач",
	confirmations: "Подтверждение выполнения задачи",
	inprogress: "Только активные",
	myself: "Задача только самому себе",
	more: "ПОКАЗАТЬ остальные подтверждения",
	less: "СКРЫТЬ остальные подтверждения"
    },
    taskboard: "Действие",
    tech: {
	title: "Технический&nbspотчёт&nbsp;",
	title1: "Технический&nbspотчёт&nbsp;за",
	active_devices: "Только активные устройства",
	total: "Всего",
	time: "Послед.",
	exchange: {sync: "Синхронизаций (успешных)", docs: "Отправка документов"},
	acts: {title: "Активностей"},
	docs: {title: "Документов"},
	pause: "Пауза, дн.",
	a_list: {title: "Телеметрия", descr: "Описание"},
	route: {
	    title0: "Маршрут",
	    title1: "На карте",
	    duration: "Прод., мин.",
	    unsched: "<i>ВНЕПЛАНОВОЕ ДЕЙСТВИЕ</i>:",
	    addition: "<i>НОВЫЙ КЛИЕНТ</i>:",
	    pending: "Отложено: {0}.",
	    discard: "Подана заявка на исключение из маршрута: {0}.",
	    deletion: "Подана заявка на удаление клиента",
	    joint: {b:"СОВМЕСТНЫЙ МАРШРУТ с {0}: <i>начало</i>",e:"СОВМЕСТНЫЙ МАРШРУТ с {0}: <i>окончание</i>"},
	    map: {
		start: "Начало перемещений в {0}",
		finish: "Завершение перемещений в {0}. Пройденное расстояние: {1} м.",
		trace: "Перемещения сотрудника (трасса). Пройденное расстояние: {0} м.",
		dist: "До торговой точки {0} м.",
		closed: "<b>{0}</b> продолжительностью <b>{3}&nbsp;мин.</b> ({5}&nbsp;м.). Выполнено {4} с {1} по {2}.",
		canceled: "<b>{0}</b>: отменено",
		account: "{0} (нажмите на маркере для просмотра дополнительной информации)",
		activity: "Момент начала активности в {0} (нажмите на маркере для просмотра дополнительной информации)",
		unsched: "Внеплановое действие в {0}",
		addition: "Регистрация нового клиента в {0}",
		button0: "Только маршрут"
	    },
	    packets: {title: "Создано пакетов", value: "{0}<br/>(последний в {1})"},
	    positions: {title: "Зафиксировано позиций", value: "{0} в {1} пак.<br/>(последняя в {2})"},
	    traffics: {omobus: "Трафик omobus (мобильный и WiFi)", total: "Трафик устройства (мобильный и WiFi)", mobile: "Трафик устройства (только мобильный)"},
	    power: "Уровень заряда АКБ на {0}",
	    chargings: "Количество зарядок АКБ с {0} по {1}",
	    exchange: {
		sync: "Синхронизаций справочников (успешных / ошибочных)",
		downloaded: "Загружено справочников (всего / поврежденных)",
		docs: "Процедур передачи документов (успешных / ошибочных)",
		uploaded: "Отправлено документов"
	    },
	    not_delivered: "не доставлено",
	    cancellation: "Отмена рабочего дня",
	    docs: "Список созданных документов",
	    photo: "нажмите для просмотра приложенной фотографии",
	    more1: "Результаты работы сотрудника",
	    more2: "Журнал созданных документов"
	}
    },
    time: {
	title: "Журнал рабочего времени",
	title1: "Журнал рабочего времени за",
	uncovered: "Только непосещенные",
	coverage: "Количество клиентов, которые были посещены хотя бы один раз в течение месяца",
	accepted: "Количество активностей, подтвержденных ответственным сотрудником",
	rejected: "Количество активностей, отклоненных ответственным сотрудником",
	timing: "Время, проведенное сотрудником непосредственно у клиента",
	violations: "В скобках указано количество активностей, выполненных с нарушением регламента посещения",
	discarded: "В скобках указано количество плановых активностей исключенных из маршрута",
	other: "В скобках указано количество активностей, выполненных внепланово (включая выполнение отложенных плановых активностей)"
    },
    time_spent: "Трудозатраты на ввод данных",
    training_type: "Вид обучения",
    training_type_everything: "Все виды обучений",
    training_material: "Обучающий материал",
    training_material_everything: "Все обучающие материалы",
    training_materials: {
	title: "Обучающие материалы",
	caption: "Редактирование обучающего материала #{0}",
	add: "Добавить обучающий материал",
	msg0: "Загрузка файла [{0}] <i>отклонена</i>! Поддерживаются только файлы в формате PDF, MP4 или JPEG.",
	msg1: "Размер файла с обучающим материалом [{0}] не должен превышать {1} МБ.",
	msg2: "<b>Название</b> обучающего материала <b>не задано</b>. Введите название обучающего материала и повторите попытку.",
	msg3: "<b>Страна</b>, в которой действует обучающий материал <b>не задана</b>. Выберите страну из выпадающего списка и повторите попытку.",
	notice: "Обратите внимание на то, что название обучающего материала должно однозначно идентифицировать данный материал.",
	placeholder: "Введите название обучающего материала"
    },
    trainings: {
	title: "Обучение контакта (персонала клиента)",
	title1: "Обучение контакта (персонала клиента) за"
    },
    ttd: {
	unknown: "Ожидает доставку до точки обмена",
	delivered: "Доставлен до точки обмена",
	accepted: "Подтверждено получение документа"
    },
    u_code: "Код",
    u_name: "Сотрудник",
    u_everyone: "Все сотрудники",
    unlink: "Удалить",
    unsched: {
	title: "Внеплановые действия",
	title1: "Внеплановые действия за",
	type: "Вид внепланового действия",
	everything: "Все виды внеплановых действий"
    },
    username: "Имя пользователя:",
    validity: "Период действия",
    view: "Посмотреть",
    violations: {
	_caption: "Список зафиксированных нарушений",
	gps: "Отключение датчика местоположения",
	tm: "Перевод времени",
	oom: "Недостаточно свободного места"
    },
    wdays: "Рабочие дни (график работы)",
    whereis: {
	title: "Поиск продукта"
    },
    wishes: {
	title: "Заявки на включение клиента в маршрут",
	accept: "Подтвердить заявку на включение в маршрут",
	reject: "Отклонить заявку на включение в маршрут",
	accepted: ["{0} подтвердил(-а) включение клиента в маршрут", "Включение клиента в маршрут подтверждено"],
	rejected: "Включение клиента в маршрут отклонено"
    },
    without_restrictions: "без ограничений",
    workday: "Рабочий день по OMOBUS",
    working_hours: "Режим работы",
    yes: "Да",
    zstatus: {
	caption: "Изменение статуса активности",
	placeholder: "Введите причину изменения статуса активности",
	accept: "Принять активность",
	reject: "Отклонить активность",
	accepted: "{0} принял(-а) {1}",
	rejected: "{0} отклонил(-а) {1}"
    },





//--------------------- OBSOLETE: 

	    /* OBSOLETE: */everything: "все данные без ограничений",
//    msgs: {
more: "Для просмотра остальных данных измените параметры фильтрации",
//usercode: "№ маршрута: {0}, код: {1} [{2}].",

    manuf: "Производитель",
	u_placeholder: "Выберите сотрудника",
		outlet: "Торговая точка",
    city: "Город/область/регион",
    inserted_ts: "Обработано на сервере",
    satellite_dt: "Дата фиксации по спутнику (UTC)",
	latitude: "Широта",
	longitude: "Долгота",
	extra_info: "Дополнительная информация",
	facing: "Лицом к покупателю",
	shelf_stock: "Остаток на полке",
	assortment: "Уникальных единиц",
	doc_id: "UID",
	delivery: "Доставка",
    b_date: "Начало",
    e_date: "Оконч.",
	own: "Свои",
	other: "Остальные",
	sla: {result: "SLA", criteria: "Критерий", score: "Оценка", ratings: "Выставленные оценки"},
	sos: "Доля полки",
	soa: "Доля в ассортименте",
soe: "Доля доп/места",




	remove: { ref: "Удалить", /*targets:*/cap: "Удалено" },

	date_unlimited: "Действует без ограничений",
	dep_everyone: "Действует для всех подразделений",
	country_everyone: "Действует для всех стран",
	rc_everyone: "Действует для всех торговых сетей",
	brand_everyone: "Действует для всех брендов",

    targets: {
	    title: "Постановка задач",
	    title1: "Новая задача",
	    title2: "Постановка новой задачи",
	    title3: "Редактирование задачи #{0}",
	subject: { caption: "Задача", placeholder: "Введите название задачи" },
	body: { caption: "Описание задачи", placeholder: "Введите детальное описание задачи" },
	type: "Тип задачи",
	everything: "Все типы задач",
	    accounts: { caption: "Действует в т/точках", total: "<span style='color: #bd1515;'>Всего <b>{0}</b> т/т.</span>"},
	    notice: "Обратите внимание на то, что после начала действия задачи редактирование её параметров будет запрещено.",
	    ref0: "не задан индивидуальный набор т/т",
	    ref1: "индивидуально для {0} т/т",
	    strict: "при подтверждении задачи <b>требуется</b> фотография",
	    urgent: "срочное посещение клиента для устранения выявленных проблем"
    },




// *** issue-tracking subsystem ***
	tickets: {
	    title: "Обращения в службу п/пользователей",
	    title1: "Новая заявка",
	    title2: "Регистрация новой заявки",
	    title3: "Резолюция на заявку #{0}",
	    title4: "Текущие обращения в службу п/пользователей",
	    //hint: "Журнал зарегистрированных заявок в службу поддержки пользователей (issue-tracking subsystem).",
	    ticket_id: "#",
	    issue: "Проблема",
	    issue_placeholder: "Выберите причину обращения (проблему)",
	    resolution: "Резолюция",
	    resolution_placeholder: "Введите текст резолюции",
	    date: "Зарегистрировано",
	    status0: "Открыто",
	    status1: "Закрыто",
	    closed: "Решено",
	    closed_hint: "Заявка отмечается как [<i>Решенная</i>] в случае, если не требуется вмешательство технического персонала или проблема идентифицирована и ответственный сотрудник уведомлен о наличии проблемы.",
	    note_placeholder: "Введите детальное описание проблемы",
	    msg0: "Ошибка загрузки данных",
	    msg1: "Сотрудник не задан. Идентифицируйте сотрудника, который обратился в службу поддержки пользователей.",
	    msg2: "Причина обращения (проблема) не задана. Определите причину обращения сотрудника в службу поддержки пользователей.",
msg3: "Ошибка выполнения запроса на сервере.",
	    msg4: "Резолюция должна быть не менее {0} символов."
	}

//    }
};
