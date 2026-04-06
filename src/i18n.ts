export type Locale = 'en' | 'zh' | 'ja' | 'ko' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ru';

export interface Messages {
  // Chart titles
  statusDist: string;
  resourceTypes: string;
  latency: string;
  httpMethod: string;
  resourceType: string;
  // Table headers
  method: string;
  status: string;
  type: string;
  url: string;
  // Panel misc
  capturedRequests: string;
  noRequestsYet: string;
  latencyTime: string;
  latencyMs: string;
  // Viewer header
  dashboardTitle: string;
  refresh: string;
  close: string;
  // Viewer sidebar
  pages: string;
  noData: string;
  // Viewer main
  selectPage: string;
  capturedApis: string;
  noRequests: string;
  // Theme / locale controls
  darkMode: string;
  lightMode: string;
  // Options page
  optionsTitle: string;
  optionsLoading: string;
  sectionNetwork: string;
  sectionUrl: string;
  sectionMasking: string;
  labelNetworkTypes: string;
  labelHttpMethods: string;
  labelUrlFilter: string;
  helpUrlFilter: string;
  labelMaskingEnabled: string;
  labelMaskingKeys: string;
  helpMaskingKeys: string;
  placeholderUrlFilter: string;
  placeholderMaskingKey: string;
  btnSave: string;
  btnAdd: string;
  toastSaved: string;
}

const messages: Record<Locale, Messages> = {
  en: {
    statusDist: 'Status Code Distribution',
    resourceTypes: 'Resource Types',
    latency: 'Request Latency (ms)',
    httpMethod: 'HTTP Method Distribution',
    resourceType: 'Resource Types',
    method: 'Method',
    status: 'Status',
    type: 'Type',
    url: 'URL',
    capturedRequests: 'Captured Network Requests',
    noRequestsYet: 'No requests captured yet.',
    latencyTime: 'Time',
    latencyMs: 'Latency',
    dashboardTitle: 'Easy API Collector — Realtime Dashboard',
    refresh: 'Refresh',
    close: 'Close',
    pages: 'Captured Pages',
    noData: 'No data yet',
    selectPage: 'Select a page from the left to view data',
    capturedApis: 'Captured API Endpoints',
    noRequests: 'No requests matched the filter rules on this page',
    darkMode: '🌙 Dark',
    lightMode: '☀️ Light',
    optionsTitle: 'Easy API Collector — Filter & Masking Settings',
    optionsLoading: 'Loading...',
    sectionNetwork: '🌐 Network Type & HTTP Method Filter',
    sectionUrl: '🔍 URL Path Regex Filter',
    sectionMasking: '🔒 Privacy Masking Configuration',
    labelNetworkTypes: 'Monitored network types (transport):',
    labelHttpMethods: 'Monitored HTTP methods:',
    labelUrlFilter: 'URL filter (regex):',
    helpUrlFilter:
      'If set, only requests whose URL matches this regex will be captured. Leave empty to capture all.',
    labelMaskingEnabled: 'Enable field-level auto-masking for Payload and Headers',
    labelMaskingKeys:
      'Keys to mask (any Header or JSON body key matching the list will be replaced with ***):',
    helpMaskingKeys:
      'During interception, if a JSON or request header key (case-insensitive) matches any item in the list, its value will be replaced with `***`.',
    placeholderUrlFilter: 'e.g. .*api\\.github\\.com.* or ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'Type a key and press Enter...',
    btnSave: 'Save Options',
    btnAdd: 'Add',
    toastSaved: 'Settings saved!'
  },
  zh: {
    statusDist: '状态码分布',
    resourceTypes: '资源类型',
    latency: '请求耗时 (ms)',
    httpMethod: 'HTTP 方法比重',
    resourceType: '资源拦截类别',
    method: '方法',
    status: '状态',
    type: '类型',
    url: 'URL',
    capturedRequests: '已捕获网络请求',
    noRequestsYet: '暂无捕获的请求',
    latencyTime: '时间',
    latencyMs: '耗时',
    dashboardTitle: 'Easy API Collector 实时大屏雷达',
    refresh: '手动刷新',
    close: '关闭',
    pages: '抓包来源页面',
    noData: '暂无数据',
    selectPage: '请先在左侧选择一个捕获的页面来源',
    capturedApis: '已捕获端点 API',
    noRequests: '在该网页下暂未命中过滤规则的数据',
    darkMode: '🌙 深色',
    lightMode: '☀️ 浅色',
    optionsTitle: 'Easy API Collector - 过滤与脱敏配置',
    optionsLoading: '加载中...',
    sectionNetwork: '🌐 拦截类型与方法黑白名单机制',
    sectionUrl: '🔍 URL 路径正则过滤配置',
    sectionMasking: '🔒 隐私脱敏模式配置',
    labelNetworkTypes: '监听的网络类型 (请求载体)：',
    labelHttpMethods: '监听的 HTTP Method 动作：',
    labelUrlFilter: 'URL 过滤条件 (正则表达式)：',
    helpUrlFilter: '如果填写，则仅抓取 URL 能够匹配该正则表达式的请求。留空表示拦截所有。',
    labelMaskingEnabled: '开启 Payload 和 Headers 字段级自动脱敏',
    labelMaskingKeys:
      '模糊处理的关键字列表 (无论 Header 还是 JSON 体只要键名匹配就会被 *** 打码)：',
    helpMaskingKeys:
      '拦截时如果 JSON 或请求头属性名（无视大小写）等于列表中任何一个词，将替换为 `***` 脱敏字样。',
    placeholderUrlFilter: '例如: .*api\\.github\\.com.* 或者 ^https:\\/\\/.*\\/v1\\/.*',
    placeholderMaskingKey: '输入新关键字后回车...',
    btnSave: '保存当前配置 (Save Options)',
    btnAdd: '添加',
    toastSaved: '配置已保存生效！'
  },
  ja: {
    statusDist: 'ステータスコード分布',
    resourceTypes: 'リソースタイプ',
    latency: 'レイテンシ (ms)',
    httpMethod: 'HTTPメソッド分布',
    resourceType: 'リソースタイプ',
    method: 'メソッド',
    status: 'ステータス',
    type: 'タイプ',
    url: 'URL',
    capturedRequests: 'キャプチャしたリクエスト',
    noRequestsYet: 'リクエストはまだキャプチャされていません',
    latencyTime: '時刻',
    latencyMs: 'レイテンシ',
    dashboardTitle: 'Easy API Collector リアルタイムダッシュボード',
    refresh: '更新',
    close: '閉じる',
    pages: 'キャプチャページ',
    noData: 'データなし',
    selectPage: '左側からページを選択してください',
    capturedApis: 'キャプチャした API',
    noRequests: 'フィルタ条件に一致するデータがありません',
    darkMode: '🌙 ダーク',
    lightMode: '☀️ ライト',
    optionsTitle: 'Easy API Collector - フィルター & マスク設定',
    optionsLoading: '読み込み中...',
    sectionNetwork: '🌐 ネットワークタイプ・HTTPメソッドフィルター',
    sectionUrl: '🔍 URL 正規表現フィルター',
    sectionMasking: '🔒 プライバシーマスク設定',
    labelNetworkTypes: '監視するネットワークタイプ：',
    labelHttpMethods: '監視する HTTP メソッド：',
    labelUrlFilter: 'URL フィルター (正規表現)：',
    helpUrlFilter:
      '設定した場合、URL が正規表現に一致するリクエストのみ取得します。空の場合はすべて取得します。',
    labelMaskingEnabled: 'Payload と Headers のフィールド自動マスクを有効にする',
    labelMaskingKeys:
      'マスクするキー一覧 (Header または JSON 本文のキーが一致した場合、*** に置換されます)：',
    helpMaskingKeys:
      '傍受時に JSON またはリクエストヘッダーのキー名（大文字小文字を無視）がリストの項目と一致した場合、値を `***` に置換します。',
    placeholderUrlFilter: '例: .*api\\.github\\.com.* または ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'キーワードを入力して Enter を押す...',
    btnSave: '設定を保存',
    btnAdd: '追加',
    toastSaved: '設定が保存されました！'
  },
  ko: {
    statusDist: '상태 코드 분포',
    resourceTypes: '리소스 유형',
    latency: '요청 지연 (ms)',
    httpMethod: 'HTTP 메서드 분포',
    resourceType: '리소스 유형',
    method: '메서드',
    status: '상태',
    type: '유형',
    url: 'URL',
    capturedRequests: '캡처된 네트워크 요청',
    noRequestsYet: '캡처된 요청이 없습니다',
    latencyTime: '시간',
    latencyMs: '지연',
    dashboardTitle: 'Easy API Collector 실시간 대시보드',
    refresh: '새로고침',
    close: '닫기',
    pages: '캡처된 페이지',
    noData: '데이터 없음',
    selectPage: '왼쪽에서 페이지를 선택하세요',
    capturedApis: '캡처된 API 엔드포인트',
    noRequests: '이 페이지에서 필터 조건에 맞는 데이터가 없습니다',
    darkMode: '🌙 다크',
    lightMode: '☀️ 라이트',
    optionsTitle: 'Easy API Collector - 필터 및 마스킹 설정',
    optionsLoading: '로딩 중...',
    sectionNetwork: '🌐 네트워크 유형 및 HTTP 메서드 필터',
    sectionUrl: '🔍 URL 정규식 필터',
    sectionMasking: '🔒 개인정보 마스킹 설정',
    labelNetworkTypes: '모니터링할 네트워크 유형:',
    labelHttpMethods: '모니터링할 HTTP 메서드:',
    labelUrlFilter: 'URL 필터 (정규식):',
    helpUrlFilter:
      '설정 시 URL이 정규식과 일치하는 요청만 캡처합니다. 비워두면 모든 요청을 캡처합니다.',
    labelMaskingEnabled: 'Payload 및 Headers 필드 자동 마스킹 활성화',
    labelMaskingKeys: '마스킹할 키 목록 (Header 또는 JSON 본문의 키가 일치하면 ***로 대체):',
    helpMaskingKeys:
      '요청 차단 시 JSON 또는 요청 헤더의 키 이름(대소문자 무시)이 목록과 일치하면 `***`로 대체됩니다.',
    placeholderUrlFilter: '예: .*api\\.github\\.com.* 또는 ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: '키워드를 입력하고 Enter를 누르세요...',
    btnSave: '설정 저장',
    btnAdd: '추가',
    toastSaved: '설정이 저장되었습니다!'
  },
  es: {
    statusDist: 'Distribución de Códigos de Estado',
    resourceTypes: 'Tipos de Recurso',
    latency: 'Latencia de Solicitudes (ms)',
    httpMethod: 'Distribución de Métodos HTTP',
    resourceType: 'Tipos de Recurso',
    method: 'Método',
    status: 'Estado',
    type: 'Tipo',
    url: 'URL',
    capturedRequests: 'Solicitudes de Red Capturadas',
    noRequestsYet: 'Aún no se han capturado solicitudes.',
    latencyTime: 'Tiempo',
    latencyMs: 'Latencia',
    dashboardTitle: 'Easy API Collector — Panel en Tiempo Real',
    refresh: 'Actualizar',
    close: 'Cerrar',
    pages: 'Páginas Capturadas',
    noData: 'Sin datos',
    selectPage: 'Selecciona una página de la izquierda para ver los datos',
    capturedApis: 'Endpoints API Capturados',
    noRequests: 'Ninguna solicitud coincidió con las reglas de filtrado',
    darkMode: '🌙 Oscuro',
    lightMode: '☀️ Claro',
    optionsTitle: 'Easy API Collector — Configuración de Filtros y Enmascaramiento',
    optionsLoading: 'Cargando...',
    sectionNetwork: '🌐 Filtro de Tipos de Red y Métodos HTTP',
    sectionUrl: '🔍 Filtro de URL por Expresión Regular',
    sectionMasking: '🔒 Configuración de Enmascaramiento de Privacidad',
    labelNetworkTypes: 'Tipos de red monitorizados (transporte):',
    labelHttpMethods: 'Métodos HTTP monitorizados:',
    labelUrlFilter: 'Filtro de URL (expresión regular):',
    helpUrlFilter:
      'Si se establece, solo se capturan las solicitudes cuya URL coincida con esta expresión. Dejar vacío para capturar todas.',
    labelMaskingEnabled: 'Habilitar enmascaramiento automático de campos en Payload y Headers',
    labelMaskingKeys:
      'Claves a enmascarar (cualquier clave de Header o cuerpo JSON que coincida será reemplazada por ***):',
    helpMaskingKeys:
      'Durante la interceptación, si el nombre de una clave JSON o de cabecera (sin distinción de mayúsculas) coincide con algún elemento de la lista, su valor será reemplazado por `***`.',
    placeholderUrlFilter: 'ej. .*api\\.github\\.com.* o ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'Escribe una clave y pulsa Intro...',
    btnSave: 'Guardar configuración',
    btnAdd: 'Añadir',
    toastSaved: '¡Configuración guardada!'
  },
  pt: {
    statusDist: 'Distribuição de Códigos de Status',
    resourceTypes: 'Tipos de Recurso',
    latency: 'Latência das Requisições (ms)',
    httpMethod: 'Distribuição de Métodos HTTP',
    resourceType: 'Tipos de Recurso',
    method: 'Método',
    status: 'Status',
    type: 'Tipo',
    url: 'URL',
    capturedRequests: 'Requisições de Rede Capturadas',
    noRequestsYet: 'Nenhuma requisição capturada ainda.',
    latencyTime: 'Tempo',
    latencyMs: 'Latência',
    dashboardTitle: 'Easy API Collector — Painel em Tempo Real',
    refresh: 'Atualizar',
    close: 'Fechar',
    pages: 'Páginas Capturadas',
    noData: 'Sem dados',
    selectPage: 'Selecione uma página à esquerda para ver os dados',
    capturedApis: 'Endpoints de API Capturados',
    noRequests: 'Nenhuma requisição correspondeu às regras de filtro nesta página',
    darkMode: '🌙 Escuro',
    lightMode: '☀️ Claro',
    optionsTitle: 'Easy API Collector — Configurações de Filtro e Mascaramento',
    optionsLoading: 'Carregando...',
    sectionNetwork: '🌐 Filtro de Tipos de Rede e Métodos HTTP',
    sectionUrl: '🔍 Filtro de URL por Expressão Regular',
    sectionMasking: '🔒 Configuração de Mascaramento de Privacidade',
    labelNetworkTypes: 'Tipos de rede monitorados (transporte):',
    labelHttpMethods: 'Métodos HTTP monitorados:',
    labelUrlFilter: 'Filtro de URL (expressão regular):',
    helpUrlFilter:
      'Se definido, apenas as requisições cuja URL corresponda à expressão serão capturadas. Deixe vazio para capturar todas.',
    labelMaskingEnabled: 'Ativar mascaramento automático de campos em Payload e Headers',
    labelMaskingKeys:
      'Chaves a mascarar (qualquer chave de Header ou corpo JSON que corresponda será substituída por ***):',
    helpMaskingKeys:
      'Durante a interceptação, se o nome de uma chave JSON ou de cabeçalho (sem distinção de maiúsculas) corresponder a algum item da lista, seu valor será substituído por `***`.',
    placeholderUrlFilter: 'ex: .*api\\.github\\.com.* ou ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'Digite uma chave e pressione Enter...',
    btnSave: 'Salvar configurações',
    btnAdd: 'Adicionar',
    toastSaved: 'Configurações salvas!'
  },
  fr: {
    statusDist: 'Distribution des Codes de Statut',
    resourceTypes: 'Types de Ressources',
    latency: 'Latence des Requêtes (ms)',
    httpMethod: 'Distribution des Méthodes HTTP',
    resourceType: 'Types de Ressources',
    method: 'Méthode',
    status: 'Statut',
    type: 'Type',
    url: 'URL',
    capturedRequests: 'Requêtes Réseau Capturées',
    noRequestsYet: "Aucune requête capturée pour l'instant.",
    latencyTime: 'Temps',
    latencyMs: 'Latence',
    dashboardTitle: 'Easy API Collector — Tableau de Bord en Temps Réel',
    refresh: 'Actualiser',
    close: 'Fermer',
    pages: 'Pages Capturées',
    noData: 'Pas de données',
    selectPage: 'Sélectionnez une page à gauche pour afficher les données',
    capturedApis: 'Endpoints API Capturés',
    noRequests: 'Aucune requête ne correspond aux règles de filtrage sur cette page',
    darkMode: '🌙 Sombre',
    lightMode: '☀️ Clair',
    optionsTitle: 'Easy API Collector — Paramètres de Filtres et Masquage',
    optionsLoading: 'Chargement...',
    sectionNetwork: '🌐 Filtre de Types de Réseau et Méthodes HTTP',
    sectionUrl: "🔍 Filtre d'URL par Expression Régulière",
    sectionMasking: '🔒 Configuration du Masquage de Confidentialité',
    labelNetworkTypes: 'Types de réseau surveillés (transport) :',
    labelHttpMethods: 'Méthodes HTTP surveillées :',
    labelUrlFilter: "Filtre d'URL (expression régulière) :",
    helpUrlFilter:
      "Si renseigné, seules les requêtes dont l'URL correspond à cette expression seront capturées. Laisser vide pour tout capturer.",
    labelMaskingEnabled: 'Activer le masquage automatique des champs dans Payload et Headers',
    labelMaskingKeys:
      'Clés à masquer (toute clé de Header ou corps JSON correspondante sera remplacée par ***) :',
    helpMaskingKeys:
      "Lors de l'interception, si le nom d'une clé JSON ou d'un en-tête (insensible à la casse) correspond à un élément de la liste, sa valeur sera remplacée par `***`.",
    placeholderUrlFilter: 'ex : .*api\\.github\\.com.* ou ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'Entrez un mot-clé puis appuyez sur Entrée...',
    btnSave: 'Enregistrer les paramètres',
    btnAdd: 'Ajouter',
    toastSaved: 'Paramètres enregistrés !'
  },
  de: {
    statusDist: 'Statuscode-Verteilung',
    resourceTypes: 'Ressourcentypen',
    latency: 'Anfrage-Latenz (ms)',
    httpMethod: 'HTTP-Methoden-Verteilung',
    resourceType: 'Ressourcentypen',
    method: 'Methode',
    status: 'Status',
    type: 'Typ',
    url: 'URL',
    capturedRequests: 'Erfasste Netzwerkanfragen',
    noRequestsYet: 'Noch keine Anfragen erfasst.',
    latencyTime: 'Zeit',
    latencyMs: 'Latenz',
    dashboardTitle: 'Easy API Collector — Echtzeit-Dashboard',
    refresh: 'Aktualisieren',
    close: 'Schließen',
    pages: 'Erfasste Seiten',
    noData: 'Keine Daten',
    selectPage: 'Wählen Sie links eine Seite aus, um Daten anzuzeigen',
    capturedApis: 'Erfasste API-Endpunkte',
    noRequests: 'Keine Anfragen entsprachen den Filterregeln auf dieser Seite',
    darkMode: '🌙 Dunkel',
    lightMode: '☀️ Hell',
    optionsTitle: 'Easy API Collector — Filter- und Maskierungseinstellungen',
    optionsLoading: 'Wird geladen...',
    sectionNetwork: '🌐 Netzwerktyp- und HTTP-Methodenfilter',
    sectionUrl: '🔍 URL-Filter per regulärem Ausdruck',
    sectionMasking: '🔒 Datenschutz-Maskierungskonfiguration',
    labelNetworkTypes: 'Überwachte Netzwerktypen (Transport):',
    labelHttpMethods: 'Überwachte HTTP-Methoden:',
    labelUrlFilter: 'URL-Filter (regulärer Ausdruck):',
    helpUrlFilter:
      'Falls angegeben, werden nur Anfragen erfasst, deren URL diesem Ausdruck entspricht. Leer lassen für alle Anfragen.',
    labelMaskingEnabled: 'Automatische Feldmaskierung für Payload und Headers aktivieren',
    labelMaskingKeys:
      'Zu maskierende Schlüssel (jeder Header- oder JSON-Schlüssel, der übereinstimmt, wird durch *** ersetzt):',
    helpMaskingKeys:
      'Bei der Erfassung wird der Wert eines JSON- oder Anfrage-Header-Schlüssels (Groß-/Kleinschreibung ignoriert), der einem Listeneintrag entspricht, durch `***` ersetzt.',
    placeholderUrlFilter: 'z.B. .*api\\.github\\.com.* oder ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'Schlüsselwort eingeben und Enter drücken...',
    btnSave: 'Einstellungen speichern',
    btnAdd: 'Hinzufügen',
    toastSaved: 'Einstellungen gespeichert!'
  },
  it: {
    statusDist: 'Distribuzione dei Codici di Stato',
    resourceTypes: 'Tipi di Risorsa',
    latency: 'Latenza delle Richieste (ms)',
    httpMethod: 'Distribuzione dei Metodi HTTP',
    resourceType: 'Tipi di Risorsa',
    method: 'Metodo',
    status: 'Stato',
    type: 'Tipo',
    url: 'URL',
    capturedRequests: 'Richieste di Rete Catturate',
    noRequestsYet: 'Nessuna richiesta catturata ancora.',
    latencyTime: 'Tempo',
    latencyMs: 'Latenza',
    dashboardTitle: 'Easy API Collector — Dashboard in Tempo Reale',
    refresh: 'Aggiorna',
    close: 'Chiudi',
    pages: 'Pagine Catturate',
    noData: 'Nessun dato',
    selectPage: 'Seleziona una pagina a sinistra per visualizzare i dati',
    capturedApis: 'Endpoint API Catturati',
    noRequests: 'Nessuna richiesta ha corrisposto alle regole di filtro su questa pagina',
    darkMode: '🌙 Scuro',
    lightMode: '☀️ Chiaro',
    optionsTitle: 'Easy API Collector — Impostazioni di Filtro e Mascheramento',
    optionsLoading: 'Caricamento...',
    sectionNetwork: '🌐 Filtro Tipi di Rete e Metodi HTTP',
    sectionUrl: '🔍 Filtro URL per Espressione Regolare',
    sectionMasking: '🔒 Configurazione Mascheramento Privacy',
    labelNetworkTypes: 'Tipi di rete monitorati (trasporto):',
    labelHttpMethods: 'Metodi HTTP monitorati:',
    labelUrlFilter: 'Filtro URL (espressione regolare):',
    helpUrlFilter:
      'Se impostato, verranno acquisite solo le richieste il cui URL corrisponde a questa espressione. Lasciare vuoto per acquisire tutte.',
    labelMaskingEnabled: 'Abilita mascheramento automatico dei campi in Payload e Headers',
    labelMaskingKeys:
      'Chiavi da mascherare (qualsiasi chiave di Header o corpo JSON corrispondente sarà sostituita con ***):',
    helpMaskingKeys:
      "Durante l'intercettazione, se il nome di una chiave JSON o di un'intestazione (senza distinzione di maiuscole) corrisponde a un elemento della lista, il suo valore verrà sostituito con `***`.",
    placeholderUrlFilter: 'es. .*api\\.github\\.com.* oppure ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'Digita una chiave e premi Invio...',
    btnSave: 'Salva impostazioni',
    btnAdd: 'Aggiungi',
    toastSaved: 'Impostazioni salvate!'
  },
  ru: {
    statusDist: 'Распределение кодов состояния',
    resourceTypes: 'Типы ресурсов',
    latency: 'Задержка запросов (мс)',
    httpMethod: 'Распределение HTTP-методов',
    resourceType: 'Типы ресурсов',
    method: 'Метод',
    status: 'Статус',
    type: 'Тип',
    url: 'URL',
    capturedRequests: 'Захваченные сетевые запросы',
    noRequestsYet: 'Запросы ещё не захвачены.',
    latencyTime: 'Время',
    latencyMs: 'Задержка',
    dashboardTitle: 'Easy API Collector — Дашборд в реальном времени',
    refresh: 'Обновить',
    close: 'Закрыть',
    pages: 'Захваченные страницы',
    noData: 'Нет данных',
    selectPage: 'Выберите страницу слева для просмотра данных',
    capturedApis: 'Захваченные API-эндпоинты',
    noRequests: 'Ни один запрос не соответствует правилам фильтрации на этой странице',
    darkMode: '🌙 Тёмная',
    lightMode: '☀️ Светлая',
    optionsTitle: 'Easy API Collector — Настройки фильтров и маскировки',
    optionsLoading: 'Загрузка...',
    sectionNetwork: '🌐 Фильтр типов сети и HTTP-методов',
    sectionUrl: '🔍 Фильтр URL по регулярному выражению',
    sectionMasking: '🔒 Настройка маскировки конфиденциальных данных',
    labelNetworkTypes: 'Отслеживаемые типы сети (транспорт):',
    labelHttpMethods: 'Отслеживаемые HTTP-методы:',
    labelUrlFilter: 'Фильтр URL (регулярное выражение):',
    helpUrlFilter:
      'Если указано, будут захвачены только запросы, URL которых соответствует выражению. Оставьте пустым для захвата всех.',
    labelMaskingEnabled: 'Включить автоматическую маскировку полей Payload и Headers',
    labelMaskingKeys:
      'Ключи для маскировки (любой ключ заголовка или тела JSON, совпадающий со списком, будет заменён на ***):',
    helpMaskingKeys:
      'При перехвате, если имя ключа JSON или заголовка запроса (без учёта регистра) совпадает с элементом списка, его значение будет заменено на `***`.',
    placeholderUrlFilter: 'напр. .*api\\.github\\.com.* или ^https://.*\\/v1\\/.*',
    placeholderMaskingKey: 'Введите ключевое слово и нажмите Enter...',
    btnSave: 'Сохранить настройки',
    btnAdd: 'Добавить',
    toastSaved: 'Настройки сохранены!'
  }
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'ru', label: 'Русский' }
];
