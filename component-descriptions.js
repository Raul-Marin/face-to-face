/**
 * Descripciones ampliadas por tipo de componente.
 * Se combinan con la nota del edge para cada par.
 */
window.__COMPONENT_DESCRIPTIONS__ = {
  "action-sheets": {
    ios: "Las Action Sheets de iOS muestran un conjunto de opciones relacionadas con la tarea actual, ancladas desde la parte inferior de la pantalla. Son ideales para acciones secundarias o destructivas.",
    md: "Los Bottom sheets de Material 3 presentan contenido complementario anclado al borde inferior. Pueden ser modales o persistentes, y son el equivalente directo a las Action Sheets de iOS.",
  },
  "alerts": {
    ios: "Los Alerts en iOS comunican información importante y suelen incluir uno o más botones para que el usuario responda. Aparecen como overlay modal centrado.",
    md: "Los Dialogs de Material 3 cumplen la misma función: solicitan atención del usuario con un mensaje y acciones. Pueden ser alertas, confirmaciones o formularios simples.",
  },
  "buttons": {
    ios: "Los Buttons en iOS inician una acción instantánea. El HIG define estilos (filled, tinted, gray, plain) y roles (default, destructive, cancel) que adaptan la apariencia al contexto.",
    md: "Material 3 ofrece varios tipos de botón: Elevated, Filled, Tonal, Outlined y Text. Cada uno transmite un nivel distinto de énfasis visual y jerarquía en la interfaz.",
  },
  "contextual-menus": {
    ios: "Los Contextual Menus aparecen al mantener pulsado un elemento. Proporcionan acciones relevantes al contexto sin ocupar espacio permanente en la pantalla.",
    md: "Los Menus de Material 3 incluyen menús contextuales que se anclan a un elemento y muestran opciones. Pueden ser de selección única, múltiple o con submenús.",
  },
  "lists": {
    ios: "Las Lists en iOS organizan contenido en filas desplazables. Soporta agrupación, encabezados, trailing actions (swipe) y navegación jerárquica.",
    md: "Las Lists de Material 3 presentan filas de contenido con leading/trailing elements, dividers y estados de selección. Son el patrón principal para listas de ítems.",
  },
  "menus": {
    ios: "Los Menus desplegables muestran una lista de opciones tras tocar un control. Pueden incluir iconos, shortcuts de teclado y agrupación lógica.",
    md: "Los Menus de Material 3 se abren desde un ancla (botón, icono) y permiten selección, submenús y comportamiento similar al menú contextual según el disparador.",
  },
  "page-controls": {
    ios: "Los Page Controls (puntos) indican la página actual en una vista paginada horizontal, típicamente en onboarding o carruseles de contenido.",
    md: "El Carousel de Material 3 muestra contenido en diapositivas desplazables. Los indicadores de página pueden integrarse para mostrar la posición en el conjunto.",
  },
  "pickers": {
    ios: "Los Pickers permiten elegir un valor de un conjunto (fecha, hora, lista). En iOS pueden mostrarse como rueda, lista o menú según el contexto.",
    md: "Los Date pickers y Time pickers de Material 3 ofrecen selección de fecha y hora con calendario visual o controles de reloj, equivalentes a las variantes de Picker en iOS.",
  },
  "popovers": {
    ios: "Los Popovers muestran contenido flotante anclado a un elemento. En iPad suelen aparecer como burbuja con flecha; en iPhone se adaptan a sheet.",
    md: "Los Menus anclados o Dialogs pueden servir como popover. Los Tooltips muestran información breve al pasar el cursor o mantener pulsado, más ligeros que un popover completo.",
  },
  "popup-buttons": {
    ios: "Los Pop-up Buttons muestran un menú desplegable al tocar. La opción seleccionada permanece visible en el control cuando está cerrado.",
    md: "El Split button combina una acción primaria con un menú desplegable. Los Menus anclados a un botón ofrecen el mismo patrón de selección desde un control.",
  },
  "progress": {
    ios: "Los Progress Indicators comunican el avance de una tarea. Pueden ser determinados (barra con porcentaje) o indeterminados (spinner) para tareas sin duración conocida.",
    md: "Material 3 incluye Linear progress y Circular progress, ambos con variantes determinadas e indeterminadas. Los Loading indicators cubren estados de carga.",
  },
  "segmented": {
    ios: "Los Segmented Controls permiten elegir entre opciones mutuamente excluyentes en una barra horizontal. Cada segmento muestra texto o icono.",
    md: "Los Segmented buttons de Material 3 agrupan opciones relacionadas. Pueden ser de selección única o múltiple, con estilos filled, outlined o con iconos.",
  },
  "sheets": {
    ios: "Las Sheets presentan contenido modales desde el borde inferior. Pueden tener detents (medio, completo) y expandirse con gestos de arrastre.",
    md: "Los Bottom sheets y Side sheets de Material 3 ofrecen paneles modales o persistentes. El bottom sheet es el equivalente directo; el side sheet para contenido lateral.",
  },
  "sidebars": {
    ios: "Las Sidebars muestran navegación jerárquica en iPad y Mac. Pueden colapsarse y adaptarse a listas en iPhone.",
    md: "El Navigation drawer (panel lateral) y Navigation rail (barra vertical compacta) permiten navegación entre destinos. El rail se usa en tabletas y pantallas anchas.",
  },
  "sliders": {
    ios: "Los Sliders seleccionan un valor dentro de un rango continuo. Incluyen etiquetas opcionales de mínimo/máximo y paso incremental.",
    md: "Los Sliders de Material 3 ofrecen selección de rango con thumb, track y soporte para rangos discretos o continuos, con etiquetas y ticks opcionales.",
  },
  "tab-bars": {
    ios: "El Tab Bar ocupa el borde inferior con iconos y etiquetas para cambiar entre secciones principales de la app. Máximo recomendado: 5 ítems.",
    md: "La Navigation bar de Material 3 cumple la misma función: desplazamiento entre destinos principales con iconos, etiquetas opcionales y FAB opcional en el centro.",
  },
  "text-fields": {
    ios: "Los Text Fields permiten entrada de texto con placeholder, etiqueta, helper text y estados de error. El teclado se adapta al tipo de contenido.",
    md: "Los Text fields de Material 3 incluyen variantes filled, outlined y con soporte para leading/trailing icons, contador de caracteres y estados de validación.",
  },
  "toggles": {
    ios: "Los Toggles (Switch) permiten activar o desactivar una opción. Aparecen como control deslizante con estado on/off explícito.",
    md: "El Switch de Material 3 tiene el mismo propósito: alternar entre dos estados. Incluye variantes con thumb y track, con soporte para estados selected y disabled.",
  },
  "toolbars": {
    ios: "Las Toolbars agrupan acciones en la parte superior o inferior de la pantalla. Los ítems pueden ser botones, títulos o controles de contenido.",
    md: "Las App bars (Top, Bottom) y Toolbars de Material 3 proporcionan la barra superior con título, acciones y navegación. La estructura es equivalente al toolbar de iOS.",
  },
  "notifications": {
    ios: "Las Notifications en iOS incluyen badges en iconos, banners y alertas del sistema. Los badges numéricos indican contenido pendiente en tab bars e iconos de app.",
    md: "Los Badges de Material 3 muestran notificaciones, contadores o estado sobre iconos y elementos de navegación. Cubren el mismo uso que los badges en iOS.",
  },
  "badges": {
    md: "Los Badges muestran notificaciones, contadores o estado sobre iconos y elementos de navegación. Equivalente a los badges numéricos en tab bars de iOS.",
  },
  "bottom-sheets": {
    md: "Los Bottom sheets de Material 3 presentan contenido complementario anclado al borde inferior. Pueden ser modales o persistentes, equivalentes a Action Sheets y Sheets de iOS.",
  },
  "app-bars": {
    md: "Las App bars ocupan la parte superior de la pantalla con título, navegación y acciones. Equivalente a las Toolbars y navigation bars de iOS.",
  },
  "dialogs": { md: "Los Dialogs interrumpen el flujo para pedir confirmación o mostrar información crítica. Equivalente a Alerts en iOS." },
  "loading": { md: "Loading indicators muestran progreso indeterminado durante operaciones asíncronas. Equivalente a ProgressView en modo indeterminado." },
  "nav-bars": { md: "Navigation bars permiten cambiar entre destinos principales. Equivalente al Tab Bar de iOS." },
  "nav-drawer": { md: "El Navigation drawer muestra navegación lateral en pantallas grandes. Equivalente a las Sidebars de iOS." },
  "nav-rail": { md: "Navigation rail es una barra vertical compacta para navegación en tabletas. Alternativa al drawer en layouts adaptativos." },
  "search": { md: "Search bars y campos de búsqueda especializados. En iOS suele implementarse con TextField configurado como búsqueda." },
  "snackbars": { md: "Snackbars muestran mensajes breves en la parte inferior. iOS prefiere toasts o banners; el patrón es análogo pero con diferente duración y posición." },
  "switch": { md: "Switch alterna entre dos estados. Equivalente directo a Toggle en iOS." },
  "tabs": { md: "Tabs organizan contenido en vistas horizontales dentro de una pantalla. Diferenciar de Tab Bar: los Tabs filtran contenido, el Tab Bar cambia secciones." },
  "cards": {
    md: "Las Cards de Material 3 agrupan contenido relacionado en una superficie elevada. En iOS el contenido similar suele presentarse en listas con celdas agrupadas.",
  },
  "carousel": {
    md: "El Carousel muestra contenido desplazable horizontalmente, a menudo con indicadores de página. Equivalente a vistas paginadas con Page Controls en iOS.",
  },
  "icon-buttons": {
    ios: "Los Icon Buttons en iOS son botones que muestran solo un icono, típicamente en toolbars y barras de navegación para acciones secundarias.",
    md: "Los Icon buttons de Material 3 incluyen variantes standard, filled, tonal y outlined. Cumplen la misma función que los botones de solo icono en iOS.",
  },
  "fab": {
    md: "El FAB (Floating Action Button) es un botón circular flotante para la acción primaria. iOS no tiene equivalente nativo; suele usarse un botón destacado en la barra superior.",
  },
};
