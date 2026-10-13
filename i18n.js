// i18n.js - Módulo de Internacionalização (Espanhol e Português)
// Sistema de Gestão Airbnb Control (JB • VN • HN)

(function(root) {
  'use strict';

  const STORAGE_LANG_KEY = 'AIRBNB_CONTROL_LANG_V1';
  const DEFAULT_LANG = 'es'; // Espanhol é o idioma padrão / inicial

  const TRANSLATIONS = {
    es: {
      // Gate Screen / Login
      'gate.location': 'VALÈNCIA • ESPAÑA',
      'gate.title': 'AIRBNB CONTROL',
      'gate.subtitle': 'Gestión de Stock y Turnos',
      'gate.btnGoogle': 'Continuar con Google',
      'gate.restricted': 'Acceso restringido para equipo y gestor',
      'gate.connecting': 'Conectando con Google...',
      'gate.deniedTitle': 'Acceso No Autorizado',
      'gate.deniedDesc': 'Tu cuenta de Google no está en la lista de acceso autorizada.',
      'gate.tryAnother': 'Entrar con otra cuenta Google',
      'gate.footerHint': 'Autenticación Oficial Google • València',
      'gate.langLabel': 'Idioma',

      // Topbar
      'topbar.greeting': 'Hola,',
      'topbar.roleStaff': 'Equipo Operativo',
      'topbar.roleOwner': 'Propietario / Gestor',
      'topbar.logout': 'Cerrar Sesión',
      'topbar.userTeam': 'Equipo',
      'topbar.userManager': 'Gestor',

      // Navigation (Bottom Dock)
      'nav.products': 'Productos',
      'nav.inventory': 'Stock',
      'nav.notes': 'Notas',
      'nav.calendar': 'Turnos',
      'nav.owner': 'Gestión',

      // Property Tabs
      'prop.all': 'Todos',
      'prop.allTooltip': 'Ver todos los apartamentos',
      'prop.jb': 'JB',
      'prop.vn': 'VN',
      'prop.hn': 'HN',

      // Aba 1: Produtos (Catálogo)
      'products.headerTitle': 'Catálogo de Productos',
      'products.headerSub': 'Gestiona datos, catálogo y recuperación de productos',
      'products.btnNew': 'Nuevo Producto',
      'products.subtabActive': 'Productos Activos',
      'products.subtabTrash': 'Papelera (30 días)',
      'products.searchPlaceholder': 'Buscar en catálogo por nombre o marca...',
      'products.trashBanner': 'Los productos eliminados se guardan durante <strong>30 días</strong>. Puedes restaurarlos con 1 clic para devolverlos al stock.',
      'products.emptyTitle': 'Ningún producto encontrado',
      'products.emptySubSearch': 'Prueba a buscar con otros términos.',
      'products.emptySubNew': 'Toca en "+ Nuevo Producto" para dar de alta.',
      'products.btnEdit': 'Editar',
      'products.btnDelete': 'Eliminar',
      'products.btnRestore': 'Restaurar',
      'products.btnPermanentDelete': 'Eliminar Definitivo',
      'products.badgeTrashRemaining': '{days} días restantes',
      'products.trashEmptyTitle': 'Papelera vacía',
      'products.trashEmptyDesc': 'Cuando elimines productos del catálogo, se guardarán aquí durante 30 días para restaurarlos cuando quieras.',

      // Aba 2: Estoque (Inventario)
      'inventory.kicker': 'STOCK ACTUAL',
      'inventory.allPropsTitle': 'Todos los Inmuebles',
      'inventory.allPropsSubtitle': 'Visión Consolidada: JB • VN • HN',
      'inventory.stockedTitle': 'Stock Abastecido',
      'inventory.stockedDesc': 'Ningún producto está agotado o escaseando en este momento.',
      'inventory.stockQty': 'Stock',
      'inventory.btnBuy': 'Comprar',
      'inventory.statFalta': 'Falta',
      'inventory.statAtencao': 'Atención',
      'inventory.statSuficiente': 'Suficiente',
      'inventory.quickBuyTitle': 'Registrar Nueva Compra',
      'inventory.quickBuySub': 'Subir ticket y reponer stock',
      'inventory.countBadge': '{count} productos',
      'inventory.countBadgeSingular': '1 producto',
      'inventory.whatsappPill': 'Lista en WhatsApp',
      'inventory.searchPlaceholder': 'Buscar producto, marca o categoría...',
      'inventory.catAll': 'Todos ({count})',
      'inventory.catLimpeza': 'Limpieza',
      'inventory.catAmenities': 'Amenities',
      'inventory.catComida': 'Alimentos y Bebidas',
      'inventory.btnCardNote': '+ Nota',
      'inventory.btnCardBuy': 'Registrar Compra',
      'inventory.emptyTitle': 'Ningún producto encontrado',
      'inventory.emptySub': 'Prueba a cambiar los términos de búsqueda o selecciona otra categoría.',
      'inventory.zoom': 'Zoom',
      'inventory.ruleFalta': '🔴 Falta (hasta {n})',
      'inventory.ruleAtencao': '🟡 Atención ({from}-{to})',
      'inventory.ruleSuficiente': '🟢 Suficiente (≥ {n})',

      // Aba 3: Recados (Notas)
      'notes.title': 'Dejar Nota para el Inmueble',
      'notes.placeholder': 'Ej: Grifo goteando, huésped pidió toallas extra, reposición hecha...',
      'notes.btnPost': 'Publicar Nota',
      'notes.empty': 'Ninguna nota registrada para este inmueble. ¡Deja un mensaje arriba!',
      'notes.reopen': 'Reabrir',
      'notes.markDone': 'Marcar Resuelto',
      'notes.delete': 'Eliminar',
      'notes.alertEmpty': 'Escribe un mensaje antes de publicar.',
      'notes.authorOwner': 'Gestor',
      'notes.authorStaff': 'Equipo',

      // Aba 4: Escalas / Calendario
      'calendar.title': 'Turnos y Limpiezas',
      'calendar.subtitle': 'Cronograma operativo y control de estancias',
      'calendar.btnNew': '+ Programar',
      'calendar.emptyDay': 'Ningún turno programado para esta fecha.',
      'calendar.emptyMonth': 'No hay eventos agendados para este mes.',
      'calendar.filterAll': 'Ver todos los eventos del mes',
      'calendar.filterDay': 'Viendo eventos del {date}',
      'calendar.btnDelete': 'Eliminar Evento',
      'calendar.typeLimpeza': 'Limpieza',
      'calendar.typeChecking': 'Check-in',
      'calendar.typeCheckout': 'Check-out',
      'calendar.typeManutencao': 'Mantenimiento',
      'calendar.typeCompras': 'Compras',
      'calendar.done': '✓ Concluido',
      'calendar.markDone': 'Marcar Hecho',
      'calendar.noEventsMonth': 'Ningún próximo turno este mes',
      'calendar.noEventsMonthSub': 'Los turnos anteriores ya han pasado. Toca en una fecha anterior en el calendario para consultar el historial de ese día.',
      'calendar.noEventsAny': 'Ningún turno este mes',
      'calendar.noEventsAnySub': 'Toca en "+ Programar" para crear un nuevo checking, checkout o limpieza.',
      'calendar.scheduleDay': '+ Programar Turno para este día',
      'calendar.scheduleMonth': '+ Programar Turno',
      'calendar.noEventsDayTitle': 'Ningún turno programado para {date}',
      'calendar.noEventsDaySub': 'El inmueble está sin actividades programadas en este día.',
      'calendar.todayBtn': 'Hoy',
      'calendar.shiftSingle': 'turno',
      'calendar.shiftPlural': 'turnos',
      'calendar.upcomingShiftSingle': 'próximo turno',
      'calendar.upcomingShiftPlural': 'próximos turnos',
      'calendar.viewMonthFull': 'Visualizando Mes Completo',
      'calendar.viewDaySelected': 'Día Seleccionado ({weekday})',
      'calendar.seeMonth': 'Ver Mes ✕',
      'calendar.legendChecking': 'Checking',
      'calendar.legendCheckout': 'Checkout',
      'calendar.legendLimpeza': 'Limpieza',
      'calendar.legendManutencao': 'Mantenimiento',
      'calendar.legendCompras': 'Compras',
      'calendar.weekdaysShort': ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],

      // Aba 5: Gestão (Perfil, Idioma, Horas, Finanças, Equipe, Compras)
      'owner.profileName': 'Equipo',
      'owner.profileRole': 'Colaboradora',
      'owner.btnEditProfile': 'Editar Perfil',
      'owner.langSettingsTitle': 'Idioma del Sistema',
      'owner.langSettingsSub': 'Selecciona el idioma de la aplicación para tu sesión',
      'owner.langEs': 'Español',
      'owner.langPt': 'Português',
      'owner.langDefault': 'Predeterminado',

      // Horas (Timesheet)
      'timesheet.titleStaff': 'Mis Horas',
      'timesheet.subStaff': 'Registra inicio, pausa y fin de tu jornada de trabajo',
      'timesheet.titleOwner': 'Horas del Equipo',
      'timesheet.subOwner': 'Toca en la colaboradora para consultar los horarios',
      'timesheet.btnAdd': 'Registrar Día',
      'timesheet.emptyStaff': 'Ninguna jornada registrada todavía',
      'timesheet.emptyStaffSub': 'Haz clic en "Registrar Día" arriba para marcar inicio, pausa y fin de tu jornada.',
      'timesheet.emptyOwner': 'Ningún empleado registrado',
      'timesheet.emptyOwnerSub': 'Registra colaboradoras en la sección inferior para ver sus horarios.',
      'timesheet.allPaid': 'Todas las Horas Pagadas',
      'timesheet.toReceive': 'Total por Cobrar (Pendiente)',
      'timesheet.pendingCount': '{count} jornada(s) pendiente(s)',
      'timesheet.noPending': 'Ningún valor pendiente',
      'timesheet.statusPaid': 'Horas Pagadas',
      'timesheet.statusUnpaid': 'No Pagadas',
      'timesheet.inProgress': 'En curso',
      'timesheet.noBreak': 'Sin pausa',
      'timesheet.break': 'Pausa: {time}',
      'timesheet.start': 'Inicio',
      'timesheet.end': 'Fin',
      'timesheet.totalWorked': 'Total trabajado',
      'timesheet.exportWhatsApp': 'Exportar WhatsApp',
      'timesheet.btnEdit': 'Editar',
      'timesheet.btnDelete': 'Eliminar',
      'timesheet.allPaidShort': 'Todo pagado',
      'timesheet.toPayShort': '{hours} por pagar',
      'timesheet.noPendingShort': 'Sin pendientes',

      // Modal Manager Timesheet
      'managerTimesheet.tapDay': 'Toca en el día para consultar',
      'managerTimesheet.pending': 'Pendientes',
      'managerTimesheet.pendingRecords': 'Expedientes Pendientes',
      'managerTimesheet.workedHours': 'Horas trabajadas',
      'managerTimesheet.statusPaidTitle': 'Estado: Horas Pagadas',
      'managerTimesheet.statusPaidDesc': 'La colaboradora marcó esta jornada como pagada.',
      'managerTimesheet.statusUnpaidTitle': 'Estado: No Pagada (Pendiente)',
      'managerTimesheet.statusUnpaidDesc': 'La colaboradora aún no ha marcado esta jornada como pagada.',
      'managerTimesheet.totalToPay': 'Total a Pagar (No Pagado)',
      'managerTimesheet.btnViewPending': 'Ver Pendientes',
      'managerTimesheet.btnBackCalendar': 'Volver al calendario',
      'managerTimesheet.btnChooseOtherDay': 'Elegir otro día',
      'managerTimesheet.noPendingTitle': 'Ninguna jornada pendiente',
      'managerTimesheet.noPendingSub': '¡Todas las horas de {name} están confirmadas como pagadas!',
      'managerTimesheet.noDayTitle': 'Ningún horario registrado',
      'managerTimesheet.noDaySub': '{name} no registró horas el {date}.',

      // Equipe (Staff)
      'staff.suspended': 'Suspendida',
      'staff.active': 'Acceso Activo',
      'staff.noGoogleEmail': 'Sin correo Google',

      // Comprovantes Recentes
      'purchases.title': 'Comprobantes Recientes',
      'purchases.countBadge': '{count} compras',
      'purchases.empty': 'Ninguna compra registrada en este período.',
      'purchases.paidBy': 'Comprado por {name}',
      'purchases.total': 'Total: {val}',
      'purchases.units': '{count} artículos',
      'purchases.allMonths': 'Todos los meses...',
      'purchases.singleCount': 'compra',
      'purchases.pluralCount': 'compras',
      'purchases.emptyPeriod': 'Ninguna compra registrada para el período seleccionado.',
      'purchases.receiptTag': 'Factura / Ticket',
      'purchases.filterAll': 'Todas las compras registradas',
      'purchases.filterToday': 'Compras de Hoy',
      'purchases.filterYesterday': 'Compras de Ayer',
      'purchases.filterWeek': 'Compras de esta Semana',
      'purchases.filterMonth': 'Compras de este Mes',
      'purchases.filterSpecificMonth': 'Compras de {month}',
      'timesheet.inProgress': 'En curso',
      'timesheet.noBreak': 'Sin pausa',
      'timesheet.break': 'Pausa: {time}',
      'timesheet.start': 'Inicio',
      'timesheet.end': 'Fin',
      'timesheet.totalWorked': 'Total trabajado',
      'timesheet.exportWhatsApp': 'Exportar WhatsApp',
      'timesheet.allPaidShort': 'Todo pagado',
      'timesheet.toPayShort': '{hours} por pagar',
      'timesheet.noPendingShort': 'Sin pendientes',

      // Finanças / Gastos
      'finance.title': 'Rendición de Cuentas y Gastos',
      'finance.btnShareReport': 'Copiar Informe',
      'finance.filterAll': 'Todas',
      'finance.filterToday': 'Hoy',
      'finance.filterYesterday': 'Ayer',
      'finance.filterWeek': 'Esta Semana',
      'finance.filterMonth': 'Este Mes',
      'finance.filterMonthLabel': 'Filtrar por mes:',
      'finance.filterAllMonths': 'Todos los meses...',
      'finance.summaryInfo': 'Mostrando todas las compras',
      'finance.summaryInfoFiltered': 'Compras del período seleccionado',
      'finance.totalConsolidated': 'Gasto Total Consolidado',

      // Gestão de Equipe
      'staff.title': 'Colaboradoras',
      'staff.btnNew': '+ Nueva Colaboradora',
      'staff.description': 'Registra los correos Google de las colaboradoras para darles acceso seguro al sistema.',
      'staff.suspended': 'Suspendida',
      'staff.active': 'Acceso Activo',
      'staff.noGoogleEmail': 'Sin correo Google',

      // Comprovantes Recentes
      'purchases.title': 'Comprobantes Recientes',
      'purchases.countBadge': '{count} compras',
      'purchases.empty': 'Ninguna compra registrada en este período.',
      'purchases.paidBy': 'Comprado por {name}',
      'purchases.total': 'Total: {val}',
      'purchases.units': '{count} artículos',

      // Modais
      // Modal Registrar Compra
      'modalPurchase.title': 'Registrar Compra',
      'modalPurchase.propertyLabel': 'Apartamento de Destino',
      'modalPurchase.itemsLabel': 'Productos Comprados en el Ticket',
      'modalPurchase.itemTag': 'Artículo {n}',
      'modalPurchase.qtyLabel': 'Cant. Añadida',
      'modalPurchase.btnAddItem': '+ Añadir Otro Producto al Ticket',
      'modalPurchase.costLabel': 'Total del Ticket (€)',
      'modalPurchase.dateLabel': 'Fecha de Compra',
      'modalPurchase.buyerLabel': 'Registrado / Comprado por',
      'modalPurchase.receiptLabel': 'Comprobante / Ticket de Compra (Opcional)',
      'modalPurchase.receiptUpload': 'Tomar Foto o Subir Ticket',
      'modalPurchase.notesLabel': 'Observación (Opcional)',
      'modalPurchase.notesPlaceholder': 'Ej: Mercadona Centro - Caja 3',
      'modalPurchase.btnSubmit': 'Guardar Compra y Actualizar Stock',

      // Modal Ver Compra
      'modalViewPurchase.title': 'Detalles de la Compra',
      'modalViewPurchase.totalPaid': 'Total Pagado',
      'modalViewPurchase.purchaseDate': 'Fecha de Compra',
      'modalViewPurchase.buyer': 'Comprado por',
      'modalViewPurchase.property': 'Inmueble de Destino',
      'modalViewPurchase.totalItems': 'Cant. Total Artículos',
      'modalViewPurchase.productsInReceipt': 'Productos en el Ticket',
      'modalViewPurchase.notes': 'Observaciones',
      'modalViewPurchase.receipt': 'Comprobante / Ticket Fiscal',
      'modalViewPurchase.noReceipt': 'Sin comprobante adjunto.',
      'modalViewPurchase.btnClose': 'Cerrar Detalles',

      // Modal Zoom
      'modalZoom.title': 'Foto del Producto',

      // Modal Nota do Produto
      'modalNote.title': 'Nota del Producto',
      'modalNote.label': 'Anotación / Observación Operativa',
      'modalNote.placeholder': 'Ej: Priorizar compra sin perfume, guardar en armario alto...',
      'modalNote.btnSave': 'Guardar Nota',
      'modalNote.btnRemove': 'Eliminar',

      // Modal Adicionar Produto
      'modalAddProduct.title': 'Registrar Nuevo Producto',
      'modalAddProduct.nameLabel': 'Nombre del Producto',
      'modalAddProduct.namePlaceholder': 'Ej: Papel de Cocina Jumbo (2 rollos)',
      'modalAddProduct.brandLabel': 'Marca',
      'modalAddProduct.brandPlaceholder': 'Ej: Bosque Verde',
      'modalAddProduct.catLabel': 'Categoría',
      'modalAddProduct.catLimpeza': 'Limpieza',
      'modalAddProduct.catAmenities': 'Amenities',
      'modalAddProduct.catComida': 'Alimentos y Bebidas',
      'modalAddProduct.propLabel': 'Registrar en el Inmueble',
      'modalAddProduct.propCurrent': 'Inmueble Actual',
      'modalAddProduct.propAll': 'Todos los Inmuebles (JB, VN, HN)',
      'modalAddProduct.propJB': 'Solo JB',
      'modalAddProduct.propVN': 'Solo VN',
      'modalAddProduct.propHN': 'Solo HN',
      'modalAddProduct.unitLabel': 'Unidad',
      'modalAddProduct.unitPlaceholder': 'Ej: un, paq, bote...',
      'modalAddProduct.qtyLabel': 'Cant. Inicial',
      'modalAddProduct.rulesTitle': 'Reglas del Semáforo',
      'modalAddProduct.rulesSub': 'Cantidades para cambiar de color',
      'modalAddProduct.faltaLabel': '🔴 Falta (hasta)',
      'modalAddProduct.atencaoLabel': '🟡 Atención (hasta)',
      'modalAddProduct.suficienteLabel': '🟢 Suficiente (≥)',
      'modalAddProduct.photoLabel': 'Foto del Producto (Opcional)',
      'modalAddProduct.photoUpload': 'Tomar Foto o Elegir Imagen',
      'modalAddProduct.noteLabel': 'Nota Operativa Inicial (Opcional)',
      'modalAddProduct.notePlaceholder': 'Ej: Lugar donde se guarda, aviso...',
      'modalAddProduct.btnSubmit': 'Registrar Producto en el Stock',

      // Modal Editar Produto
      'modalEditProduct.title': 'Editar Producto',
      'modalEditProduct.photoLabel': 'Foto del Producto',
      'modalEditProduct.photoChange': 'Cambiar Foto del Producto',
      'modalEditProduct.btnSubmit': 'Guardar Cambios del Producto',

      // Modal Regras do Semáforo
      'modalThresholds.title': 'Reglas del Semáforo',
      'modalThresholds.sub': 'Define las cantidades para cada estado',
      'modalThresholds.currentStock': 'Stock Actual: {qty}',
      'modalThresholds.applyAll': 'Aplicar estas reglas a <strong>todos los inmuebles</strong> (JB, VN, HN)',
      'modalThresholds.btnSubmit': 'Guardar Reglas de Cantidad',

      // Modal Nova/Editar Colaboradora
      'modalStaff.titleNew': 'Nueva Colaboradora',
      'modalStaff.titleEdit': 'Editar Colaboradora',
      'modalStaff.nameLabel': 'Nombre de la Colaboradora',
      'modalStaff.namePlaceholder': 'Ej: Ana Silva',
      'modalStaff.emailLabel': 'Correo Google de la Colaboradora',
      'modalStaff.emailHint': 'La colaboradora usará este correo para iniciar sesión segura con Google.',
      'modalStaff.btnSubmitNew': 'Guardar y Autorizar Acceso',
      'modalStaff.statusLabel': 'Estado de Acceso al Sistema',
      'modalStaff.statusActive': 'Acceso Activo',
      'modalStaff.statusSuspended': 'Acceso Suspendido',
      'modalStaff.statusHint': 'Cuando está suspendido, el acceso a la app queda bloqueado.',
      'modalStaff.btnSubmitEdit': 'Guardar Cambios',
      'modalStaff.btnDelete': 'Eliminar Colaboradora',

      // Modal Agendar Evento
      'modalEvent.title': 'Programar Turno o Limpieza',
      'modalEvent.propertyLabel': 'Inmueble',
      'modalEvent.titleLabel': 'Título de la Actividad',
      'modalEvent.titlePlaceholder': 'Ej: Limpieza Post Check-out Familia Rossi',
      'modalEvent.dateLabel': 'Fecha',
      'modalEvent.timeLabel': 'Hora de Inicio',
      'modalEvent.typeLabel': 'Tipo de Tarea',
      'modalEvent.staffLabel': 'Responsable Asignada',
      'modalEvent.notesLabel': 'Indicaciones Especiales',
      'modalEvent.notesPlaceholder': 'Ej: Cambio de sábanas y dejar llave en cajetín',
      'modalEvent.btnSubmit': 'Confirmar Programación',

      // Modal Registro de Horas (Timesheet)
      'modalTs.title': 'Registrar Horas del Día',
      'modalTs.dateLabel': 'Día trabajado',
      'modalTs.timesLabel': 'Horarios',
      'modalTs.startLabel': 'Inicio de la jornada',
      'modalTs.startHint': 'Obligatorio',
      'modalTs.breakStartLabel': 'Inicio de la pausa',
      'modalTs.breakStartHint': 'Opcional',
      'modalTs.breakEndLabel': 'Fin de la pausa',
      'modalTs.breakEndHint': 'Opcional',
      'modalTs.endLabel': 'Fin de la jornada',
      'modalTs.endHint': 'Se puede completar después',
      'modalTs.totalWorked': 'Total trabajado',
      'modalTs.paymentStatus': 'Estado de Pago de las Horas',
      'modalTs.unpaid': 'No Pagadas',
      'modalTs.paid': 'Horas Pagadas',
      'modalTs.btnSubmit': 'Guardar Registro',
      'modalTs.btnDelete': 'Eliminar este registro',

      // Modal Time Picker
      'modalTimePicker.title': 'Seleccionar Horario',
      'modalTimePicker.hour': 'Hora',
      'modalTimePicker.min': 'Min',
      'modalTimePicker.now': 'Ahora',
      'modalTimePicker.clear': 'Borrar horario',
      'modalTimePicker.confirm': 'Confirmar Horario',

      // Modal Consulta Gestor (Manager Timesheet)
      'modalMgrTs.subtitle': 'Toca en el día para consultar',
      'modalMgrTs.changeDate': 'Cambiar fecha',
      'modalMgrTs.today': 'Hoy',
      'modalMgrTs.yesterday': 'Ayer',
      'modalMgrTs.noRecord': 'Sin horas registradas en esta fecha.',

      // Modal Editar Perfil
      'modalProfile.title': 'Editar Mi Perfil',
      'modalProfile.choosePhoto': 'Elegir Foto',
      'modalProfile.removePhoto': 'Eliminar Foto',
      'modalProfile.photoHint': 'Tu foto aparecerá en tus notas, registros de horas y compras.',
      'modalProfile.nameLabel': 'Nombre Completo',
      'modalProfile.namePlaceholder': 'Tu nombre',
      'modalProfile.btnCancel': 'Cancelar',
      'modalProfile.btnSave': 'Guardar Cambios',

      // Diálogos de Confirmação & Alertas
      'dialog.confirmTitle': 'Confirmar Acción',
      'dialog.confirmBtn': 'Confirmar',
      'dialog.cancelBtn': 'Cancelar',
      'dialog.saveBtn': 'Guardar',
      'dialog.logoutConfirm': '¿Realmente deseas cerrar sesión en tu cuenta?',
      'dialog.confirmLogoutTitle': 'Cerrar Sesión',
      'dialog.confirmLogoutMessage': '¿Realmente deseas salir y volver a la pantalla de inicio?',
      'dialog.confirmLogoutBtn': 'Salir Ahora',
      'dialog.confirmLogoutCancel': 'Cancelar',
      'dialog.deleteProductConfirm': '¿Mover "{name}" a la papelera durante 30 días?',
      'dialog.deleteTrashConfirm': '¿Eliminar definitivamente "{name}" de la papelera? Esta acción no se puede deshacer.',
      'dialog.deleteNoteConfirm': '¿Realmente deseas eliminar esta nota?',
      'dialog.deleteEventConfirm': '¿Deseas eliminar este turno programado?',
      'dialog.deleteStaffConfirm': '¿Eliminar a la colaboradora "{name}"? Sus registros permanecerán en el sistema.',
      'dialog.deleteTimesheetConfirm': '¿Realmente deseas eliminar este registro de horas?',

      // Toasts & Notificações
      'toast.langChanged': 'Idioma cambiado a Español',
      'toast.purchaseSaved': '¡Compra registrada y stock actualizado!',
      'toast.productSaved': '¡Producto dado de alta en el stock!',
      'toast.productUpdated': '¡Producto actualizado correctamente!',
      'toast.productMovedTrash': 'Producto movido a la papelera (disponible 30 días).',
      'toast.productRestored': '¡Producto restaurado con éxito!',
      'toast.productDeletedPerm': 'Producto eliminado definitivamente.',
      'toast.noteSaved': '¡Nota publicada con éxito!',
      'toast.eventSaved': '¡Turno programado con éxito!',
      'toast.timesheetSaved': '¡Jornada de horas guardada!',
      'toast.profileSaved': '¡Perfil actualizado con éxito!',
      'toast.staffSaved': '¡Colaboradora guardada!',
      'toast.reportCopied': '¡Informe copiado al portapapeles!',
      'toast.whatsappExported': '¡Registro exportado a WhatsApp!',
      'toast.rulesSaved': '¡Reglas de semáforo guardadas!',

      // Meses e Dias da Semana
      'months': [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ],
      'weekdaysShort': ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      'weekdaysFull': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    },

    pt: {
      // Gate Screen / Login
      'gate.location': 'VALÈNCIA • ESPANHA',
      'gate.title': 'AIRBNB CONTROL',
      'gate.subtitle': 'Gestão de Estoque & Escalas',
      'gate.btnGoogle': 'Continuar com o Google',
      'gate.restricted': 'Acesso restrito para equipe e gestor',
      'gate.connecting': 'Conectando ao Google...',
      'gate.deniedTitle': 'Acesso Não Autorizado',
      'gate.deniedDesc': 'Sua conta Google não está na lista de acesso autorizada.',
      'gate.tryAnother': 'Entrar com outra conta Google',
      'gate.footerHint': 'Autenticação Oficial Google • València',
      'gate.langLabel': 'Idioma',

      // Topbar
      'topbar.greeting': 'Olá,',
      'topbar.roleStaff': 'Equipe Operacional',
      'topbar.roleOwner': 'Proprietário / Gestor',
      'topbar.logout': 'Sair',
      'topbar.userTeam': 'Equipe',
      'topbar.userManager': 'Gestor',

      // Navigation (Bottom Dock)
      'nav.products': 'Produtos',
      'nav.inventory': 'Estoque',
      'nav.notes': 'Recados',
      'nav.calendar': 'Escalas',
      'nav.owner': 'Gestão',

      // Property Tabs
      'prop.all': 'Todos',
      'prop.allTooltip': 'Ver todos os imóveis',
      'prop.jb': 'JB',
      'prop.vn': 'VN',
      'prop.hn': 'HN',

      // Aba 1: Produtos (Catálogo)
      'products.headerTitle': 'Catálogo de Produtos',
      'products.headerSub': 'Gerencie dados, cadastro e recuperação de produtos',
      'products.btnNew': 'Novo Produto',
      'products.subtabActive': 'Produtos Ativos',
      'products.subtabTrash': 'Lixeira (30 dias)',
      'products.searchPlaceholder': 'Buscar no catálogo por nome ou marca...',
      'products.trashBanner': 'Produtos excluídos ficam guardados por <strong>30 dias</strong>. Você pode restaurá-los com 1 clique para voltarem imediatamente aos estoques.',
      'products.emptyTitle': 'Nenhum produto encontrado',
      'products.emptySubSearch': 'Tente buscar com outros termos.',
      'products.emptySubNew': 'Toque em "+ Novo Produto" para cadastrar.',
      'products.btnEdit': 'Editar',
      'products.btnDelete': 'Excluir',
      'products.btnRestore': 'Restaurar',
      'products.btnPermanentDelete': 'Excluir Definitivo',
      'products.badgeTrashRemaining': '{days} dias restantes',
      'products.trashEmptyTitle': 'Lixeira vazia',
      'products.trashEmptyDesc': 'Quando você excluir produtos do catálogo, eles ficarão guardados aqui por 30 dias para você restaurar quando quiser.',

      // Aba 2: Estoque (Inventario)
      'inventory.kicker': 'ESTOQUE ATUAL',
      'inventory.allPropsTitle': 'Todos os Imóveis',
      'inventory.allPropsSubtitle': 'Visão Consolidada: JB • VN • HN',
      'inventory.stockedTitle': 'Estoque Abastecido',
      'inventory.stockedDesc': 'Nenhum produto está em falta ou acabando neste momento.',
      'inventory.stockQty': 'Estoque',
      'inventory.btnBuy': 'Comprar',
      'inventory.statFalta': 'Falta',
      'inventory.statAtencao': 'Atenção',
      'inventory.statSuficiente': 'Suficiente',
      'inventory.quickBuyTitle': 'Registrar Nova Compra',
      'inventory.quickBuySub': 'Lançar comprovante e repor estoque',
      'inventory.countBadge': '{count} produtos',
      'inventory.countBadgeSingular': '1 produto',
      'inventory.whatsappPill': 'Lista no WhatsApp',
      'inventory.searchPlaceholder': 'Buscar produto, marca ou categoria...',
      'inventory.catAll': 'Todos ({count})',
      'inventory.catLimpeza': 'Limpeza',
      'inventory.catAmenities': 'Amenities',
      'inventory.catComida': 'Alimentos & Bebidas',
      'inventory.btnCardNote': '+ Nota',
      'inventory.btnCardBuy': 'Registrar Compra',
      'inventory.emptyTitle': 'Nenhum produto encontrado',
      'inventory.emptySub': 'Tente alterar os termos da busca ou selecionar outra categoria.',
      'inventory.zoom': 'Zoom',
      'inventory.ruleFalta': '🔴 Falta (até {n})',
      'inventory.ruleAtencao': '🟡 Atenção ({from}-{to})',
      'inventory.ruleSuficiente': '🟢 Suficiente (≥ {n})',

      // Aba 3: Recados (Notas)
      'notes.title': 'Deixar Recado para o Imóvel',
      'notes.placeholder': 'Ex: Torneira gotejando, hóspede pediu toalhas extras, reposição feita...',
      'notes.btnPost': 'Publicar Recado',
      'notes.empty': 'Nenhum recado cadastrado para este imóvel. Deixe uma mensagem acima!',
      'notes.reopen': 'Reabrir',
      'notes.markDone': 'Marcar Resolvido',
      'notes.delete': 'Excluir',
      'notes.alertEmpty': 'Digite uma mensagem antes de publicar.',
      'notes.authorOwner': 'Gestor',
      'notes.authorStaff': 'Equipe',

      // Aba 4: Escalas / Calendário
      'calendar.title': 'Escalas e Limpezas',
      'calendar.subtitle': 'Cronograma operacional e controle de diárias',
      'calendar.btnNew': '+ Agendar',
      'calendar.emptyDay': 'Nenhuma escala agendada para esta data.',
      'calendar.emptyMonth': 'Nenhum evento agendado para este mês.',
      'calendar.filterAll': 'Ver todos os eventos do mês',
      'calendar.filterDay': 'Exibindo eventos de {date}',
      'calendar.btnDelete': 'Excluir Evento',
      'calendar.typeLimpeza': 'Limpeza',
      'calendar.typeChecking': 'Checking',
      'calendar.typeCheckout': 'Checkout',
      'calendar.typeManutencao': 'Manutenção',
      'calendar.typeCompras': 'Compras',
      'calendar.done': '✓ Concluído',
      'calendar.markDone': 'Marcar Feito',
      'calendar.noEventsMonth': 'Nenhuma próxima escala neste mês',
      'calendar.noEventsMonthSub': 'As escalas anteriores já passaram. Toque em uma data anterior no calendário para consultar o histórico desse dia.',
      'calendar.noEventsAny': 'Nenhuma escala neste mês',
      'calendar.noEventsAnySub': 'Toque em "+ Agendar" para criar um novo checking, checkout ou limpeza.',
      'calendar.scheduleDay': '+ Agendar Escala para este dia',
      'calendar.scheduleMonth': '+ Agendar Escala',
      'calendar.noEventsDayTitle': 'Nenhuma escala agendada para {date}',
      'calendar.noEventsDaySub': 'O imóvel está sem atividades programadas neste dia.',
      'calendar.todayBtn': 'Hoje',
      'calendar.shiftSingle': 'escala',
      'calendar.shiftPlural': 'escalas',
      'calendar.upcomingShiftSingle': 'próxima escala',
      'calendar.upcomingShiftPlural': 'próximas escalas',
      'calendar.viewMonthFull': 'Visualizando Mês Completo',
      'calendar.viewDaySelected': 'Dia Selecionado ({weekday})',
      'calendar.seeMonth': 'Ver Mês ✕',
      'calendar.legendChecking': 'Checking',
      'calendar.legendCheckout': 'Checkout',
      'calendar.legendLimpeza': 'Limpeza',
      'calendar.legendManutencao': 'Manutenção',
      'calendar.legendCompras': 'Compras',
      'calendar.weekdaysShort': ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],

      // Aba 5: Gestão (Perfil, Idioma, Horas, Finanças, Equipe, Compras)
      'owner.profileName': 'Equipe',
      'owner.profileRole': 'Colaboradora',
      'owner.btnEditProfile': 'Editar Perfil',
      'owner.langSettingsTitle': 'Idioma do Sistema',
      'owner.langSettingsSub': 'Escolha o idioma do aplicativo para a sua sessão',
      'owner.langEs': 'Español',
      'owner.langPt': 'Português',
      'owner.langDefault': 'Padrão',

      // Horas (Timesheet)
      'timesheet.titleStaff': 'Minhas Horas',
      'timesheet.subStaff': 'Registre início, pausa e fim do seu dia de trabalho',
      'timesheet.titleOwner': 'Horas da Equipe',
      'timesheet.subOwner': 'Toque no funcionário para consultar os horários',
      'timesheet.btnAdd': 'Registrar Dia',
      'timesheet.emptyStaff': 'Nenhuma hora registrada ainda',
      'timesheet.emptyStaffSub': 'Clique em "Registrar Dia" acima para marcar o início, pausa e fim do seu serviço.',
      'timesheet.emptyOwner': 'Nenhum funcionário cadastrado',
      'timesheet.emptyOwnerSub': 'Cadastre funcionários na seção de equipe abaixo para visualizar os horários.',
      'timesheet.allPaid': 'Todas as Horas Pagas',
      'timesheet.toReceive': 'Total a Receber (Não Pago)',
      'timesheet.pendingCount': '{count} expediente(s) pendente(s)',
      'timesheet.noPending': 'Nenhum valor pendente',
      'timesheet.statusPaid': 'Horas Pagas',
      'timesheet.statusUnpaid': 'Não Pagas',
      'timesheet.inProgress': 'Em andamento',
      'timesheet.noBreak': 'Sem pausa',
      'timesheet.break': 'Pausa: {time}',
      'timesheet.start': 'Início',
      'timesheet.end': 'Fim',
      'timesheet.totalWorked': 'Total trabalhado',
      'timesheet.exportWhatsApp': 'Exportar WhatsApp',
      'timesheet.btnEdit': 'Editar',
      'timesheet.btnDelete': 'Excluir',
      'timesheet.allPaidShort': 'Tudo pago',
      'timesheet.toPayShort': '{hours} a pagar',
      'timesheet.noPendingShort': 'Nenhuma pendência',

      // Modal Manager Timesheet
      'managerTimesheet.tapDay': 'Toque no dia para consultar',
      'managerTimesheet.pending': 'Pendientes',
      'managerTimesheet.pendingRecords': 'Expedientes Pendentes',
      'managerTimesheet.workedHours': 'Horas trabalhadas',
      'managerTimesheet.statusPaidTitle': 'Status: Horas Pagas',
      'managerTimesheet.statusPaidDesc': 'A colaboradora marcou este expediente como pago.',
      'managerTimesheet.statusUnpaidTitle': 'Status: Não Pago (Pendente)',
      'managerTimesheet.statusUnpaidDesc': 'A colaboradora ainda não marcou este expediente como pago.',
      'managerTimesheet.totalToPay': 'Total a Pagar (Não Pago)',
      'managerTimesheet.btnViewPending': 'Ver Pendentes',
      'managerTimesheet.btnBackCalendar': 'Voltar ao calendário',
      'managerTimesheet.btnChooseOtherDay': 'Escolher outro dia',
      'managerTimesheet.noPendingTitle': 'Nenhuma pendência',
      'managerTimesheet.noPendingSub': 'Todas as horas de {name} estão confirmadas como pagas!',
      'managerTimesheet.noDayTitle': 'Nenhum horário registrado',
      'managerTimesheet.noDaySub': '{name} não registrou horas em {date}.',

      // Finanças / Gastos
      'finance.title': 'Prestação de Contas & Gastos',
      'finance.btnShareReport': 'Copiar Relatório',
      'finance.filterAll': 'Todas',
      'finance.filterToday': 'Hoje',
      'finance.filterYesterday': 'Ontem',
      'finance.filterWeek': 'Esta Semana',
      'finance.filterMonth': 'Este Mês',
      'finance.filterMonthLabel': 'Filtrar por mês:',
      'finance.filterAllMonths': 'Todos os meses...',
      'finance.summaryInfo': 'Exibindo todas as compras',
      'finance.summaryInfoFiltered': 'Compras do período selecionado',
      'finance.totalConsolidated': 'Gasto Total Consolidado',

      // Gestão de Equipe
      'staff.title': 'Colaboradoras',
      'staff.btnNew': '+ Nova Colaboradora',
      'staff.description': 'Cadastre os e-mails Google das colaboradoras para liberar acesso seguro ao sistema.',
      'staff.suspended': 'Suspensa',
      'staff.active': 'Acesso Ativo',
      'staff.noGoogleEmail': 'Sem e-mail Google',

      // Comprovantes Recentes
      'purchases.title': 'Comprovantes Recentes',
      'purchases.countBadge': '{count} compras',
      'purchases.empty': 'Nenhuma compra registrada neste período.',
      'purchases.paidBy': 'Comprado por {name}',
      'purchases.total': 'Total: {val}',
      'purchases.units': '{count} itens',
      'purchases.allMonths': 'Todos os meses...',
      'purchases.singleCount': 'compra',
      'purchases.pluralCount': 'compras',
      'purchases.emptyPeriod': 'Nenhuma compra registrada para o período selecionado.',
      'purchases.receiptTag': 'Nota Fiscal',
      'purchases.filterAll': 'Todas as compras cadastradas',
      'purchases.filterToday': 'Compras de Hoje',
      'purchases.filterYesterday': 'Compras de Ontem',
      'purchases.filterWeek': 'Compras desta Semana',
      'purchases.filterMonth': 'Compras deste Mês',
      'purchases.filterSpecificMonth': 'Compras de {month}',

      // Modais
      // Modal Registrar Compra
      'modalPurchase.title': 'Registrar Compra',
      'modalPurchase.propertyLabel': 'Apartamento de Destino',
      'modalPurchase.itemsLabel': 'Produtos Comprados no Cupom',
      'modalPurchase.itemTag': 'Item {n}',
      'modalPurchase.qtyLabel': 'Qtd Adicionada',
      'modalPurchase.btnAddItem': '+ Adicionar Outro Produto ao Cupom',
      'modalPurchase.costLabel': 'Total do Cupom (€)',
      'modalPurchase.dateLabel': 'Data da Compra',
      'modalPurchase.buyerLabel': 'Registrado / Comprado por',
      'modalPurchase.receiptLabel': 'Comprovante / Cupom Fiscal (Opcional)',
      'modalPurchase.receiptUpload': 'Tirar Foto ou Carregar Cupom',
      'modalPurchase.notesLabel': 'Observação (Opcional)',
      'modalPurchase.notesPlaceholder': 'Ex: Mercadona Centro - Caixa 3',
      'modalPurchase.btnSubmit': 'Salvar Compra e Atualizar Estoque',

      // Modal Ver Compra
      'modalViewPurchase.title': 'Detalhes da Compra',
      'modalViewPurchase.totalPaid': 'Total Pago',
      'modalViewPurchase.purchaseDate': 'Data da Compra',
      'modalViewPurchase.buyer': 'Comprado por',
      'modalViewPurchase.property': 'Imóvel de Destino',
      'modalViewPurchase.totalItems': 'Qtd Total Itens',
      'modalViewPurchase.productsInReceipt': 'Produtos no Cupom',
      'modalViewPurchase.notes': 'Observações',
      'modalViewPurchase.receipt': 'Comprovante / Nota Fiscal',
      'modalViewPurchase.noReceipt': 'Sem comprovante anexado.',
      'modalViewPurchase.btnClose': 'Fechar Detalhes',

      // Modal Zoom
      'modalZoom.title': 'Foto do Produto',

      // Modal Nota do Produto
      'modalNote.title': 'Nota do Produto',
      'modalNote.label': 'Anotação / Observação Operacional',
      'modalNote.placeholder': 'Ex: Priorizar compra sem perfume, guardar no armário alto...',
      'modalNote.btnSave': 'Salvar Nota',
      'modalNote.btnRemove': 'Remover',

      // Modal Adicionar Produto
      'modalAddProduct.title': 'Cadastrar Novo Produto',
      'modalAddProduct.nameLabel': 'Nome do Produto',
      'modalAddProduct.namePlaceholder': 'Ex: Papel Toalha Jumbo (2 rolos)',
      'modalAddProduct.brandLabel': 'Marca',
      'modalAddProduct.brandPlaceholder': 'Ex: Bosque Verde',
      'modalAddProduct.catLabel': 'Categoria',
      'modalAddProduct.catLimpeza': 'Limpeza',
      'modalAddProduct.catAmenities': 'Amenities',
      'modalAddProduct.catComida': 'Alimentos & Bebidas',
      'modalAddProduct.propLabel': 'Cadastrar no Imóvel',
      'modalAddProduct.propCurrent': 'Imóvel Atual',
      'modalAddProduct.propAll': 'Todos os Imóveis (JB, VN, HN)',
      'modalAddProduct.propJB': 'Apenas JB',
      'modalAddProduct.propVN': 'Apenas VN',
      'modalAddProduct.propHN': 'Apenas HN',
      'modalAddProduct.unitLabel': 'Unidade',
      'modalAddProduct.unitPlaceholder': 'Ex: un, pct, frasco...',
      'modalAddProduct.qtyLabel': 'Qtd Inicial',
      'modalAddProduct.rulesTitle': 'Regras do Semáforo',
      'modalAddProduct.rulesSub': 'Quantidades para mudar cor',
      'modalAddProduct.faltaLabel': '🔴 Falta (até)',
      'modalAddProduct.atencaoLabel': '🟡 Atenção (até)',
      'modalAddProduct.suficienteLabel': '🟢 Suficiente (≥)',
      'modalAddProduct.photoLabel': 'Foto do Produto (Opcional)',
      'modalAddProduct.photoUpload': 'Tirar Foto ou Escolher Imagem',
      'modalAddProduct.noteLabel': 'Nota Operacional Inicial (Opcional)',
      'modalAddProduct.notePlaceholder': 'Ex: Local onde fica guardado, aviso...',
      'modalAddProduct.btnSubmit': 'Cadastrar Produto no Estoque',

      // Modal Editar Produto
      'modalEditProduct.title': 'Editar Produto',
      'modalEditProduct.photoLabel': 'Foto do Produto',
      'modalEditProduct.photoChange': 'Alterar Foto do Produto',
      'modalEditProduct.btnSubmit': 'Salvar Alterações do Produto',

      // Modal Regras do Semáforo
      'modalThresholds.title': 'Regras do Semáforo',
      'modalThresholds.sub': 'Defina as quantidades para cada status',
      'modalThresholds.currentStock': 'Estoque Atual: {qty}',
      'modalThresholds.applyAll': 'Aplicar estas regras para <strong>todos os imóveis</strong> (JB, VN, HN)',
      'modalThresholds.btnSubmit': 'Salvar Regras de Quantidade',

      // Modal Nova/Editar Colaboradora
      'modalStaff.titleNew': 'Nova Colaboradora',
      'modalStaff.titleEdit': 'Editar Colaboradora',
      'modalStaff.nameLabel': 'Nome da Colaboradora',
      'modalStaff.namePlaceholder': 'Ex: Ana Silva',
      'modalStaff.emailLabel': 'E-mail Google da Colaboradora',
      'modalStaff.emailHint': 'A colaboradora usará este e-mail para fazer login seguro com o Google.',
      'modalStaff.btnSubmitNew': 'Salvar e Autorizar Acesso',
      'modalStaff.statusLabel': 'Status de Acesso ao Sistema',
      'modalStaff.statusActive': 'Acesso Ativo',
      'modalStaff.statusSuspended': 'Acesso Suspenso',
      'modalStaff.statusHint': 'Quando suspenso, o acesso ao app é bloqueado.',
      'modalStaff.btnSubmitEdit': 'Salvar Alterações',
      'modalStaff.btnDelete': 'Excluir Colaboradora',

      // Modal Agendar Evento
      'modalEvent.title': 'Agendar Escala ou Limpeza',
      'modalEvent.propertyLabel': 'Imóvel',
      'modalEvent.titleLabel': 'Título da Atividade',
      'modalEvent.titlePlaceholder': 'Ex: Faxina Pós Check-out Família Rossi',
      'modalEvent.dateLabel': 'Data',
      'modalEvent.timeLabel': 'Horário de Início',
      'modalEvent.typeLabel': 'Tipo de Tarefa',
      'modalEvent.staffLabel': 'Responsável Designada',
      'modalEvent.notesLabel': 'Orientações Especiais',
      'modalEvent.notesPlaceholder': 'Ex: Troca de enxoval e deixar chave na caixa secreta',
      'modalEvent.btnSubmit': 'Confirmar Agendamento',

      // Modal Registro de Horas (Timesheet)
      'modalTs.title': 'Registrar Horas do Dia',
      'modalTs.dateLabel': 'Dia trabalhado',
      'modalTs.timesLabel': 'Horários',
      'modalTs.startLabel': 'Início do trabalho',
      'modalTs.startHint': 'Obrigatório',
      'modalTs.breakStartLabel': 'Início da pausa',
      'modalTs.breakStartHint': 'Opcional',
      'modalTs.breakEndLabel': 'Fim da pausa',
      'modalTs.breakEndHint': 'Opcional',
      'modalTs.endLabel': 'Fim do trabalho',
      'modalTs.endHint': 'Pode preencher depois',
      'modalTs.totalWorked': 'Total trabalhado',
      'modalTs.paymentStatus': 'Status de Pagamento das Horas',
      'modalTs.unpaid': 'Não Pagas',
      'modalTs.paid': 'Horas Pagas',
      'modalTs.btnSubmit': 'Salvar Registro',
      'modalTs.btnDelete': 'Excluir este registro',

      // Modal Time Picker
      'modalTimePicker.title': 'Selecionar Horário',
      'modalTimePicker.hour': 'Hora',
      'modalTimePicker.min': 'Min',
      'modalTimePicker.now': 'Agora',
      'modalTimePicker.clear': 'Limpar horário',
      'modalTimePicker.confirm': 'Confirmar Horário',

      // Modal Consulta Gestor (Manager Timesheet)
      'modalMgrTs.subtitle': 'Toque no dia para consultar',
      'modalMgrTs.changeDate': 'Trocar data',
      'modalMgrTs.today': 'Hoje',
      'modalMgrTs.yesterday': 'Ontem',
      'modalMgrTs.noRecord': 'Nenhum registro de horas nesta data.',

      // Modal Editar Perfil
      'modalProfile.title': 'Editar Meu Perfil',
      'modalProfile.choosePhoto': 'Escolher Foto',
      'modalProfile.removePhoto': 'Remover Foto',
      'modalProfile.photoHint': 'Sua foto aparecerá nos seus recados, registros de horas e compras.',
      'modalProfile.nameLabel': 'Nome Completo',
      'modalProfile.namePlaceholder': 'Seu nome',
      'modalProfile.btnCancel': 'Cancelar',
      'modalProfile.btnSave': 'Salvar Alterações',

      // Diálogos de Confirmação & Alertas
      'dialog.confirmTitle': 'Confirmar Ação',
      'dialog.confirmBtn': 'Confirmar',
      'dialog.cancelBtn': 'Cancelar',
      'dialog.saveBtn': 'Salvar',
      'dialog.logoutConfirm': 'Deseja realmente sair da sua conta?',
      'dialog.confirmLogoutTitle': 'Sair da Sessão',
      'dialog.confirmLogoutMessage': 'Deseja realmente sair e retornar à tela inicial?',
      'dialog.confirmLogoutBtn': 'Sair Agora',
      'dialog.confirmLogoutCancel': 'Cancelar',
      'dialog.deleteProductConfirm': 'Mover "{name}" para a lixeira por 30 dias?',
      'dialog.deleteTrashConfirm': 'Excluir definitivamente "{name}" da lixeira? Esta ação não pode ser desfeita.',
      'dialog.deleteNoteConfirm': 'Deseja realmente excluir este recado?',
      'dialog.deleteEventConfirm': 'Deseja excluir esta escala agendada?',
      'dialog.deleteStaffConfirm': 'Excluir a colaboradora "{name}"? Os registros passados permanecerão no sistema.',
      'dialog.deleteTimesheetConfirm': 'Deseja realmente excluir este registro de horas?',

      // Toasts & Notificações
      'toast.langChanged': 'Idioma alterado para Português',
      'toast.purchaseSaved': 'Compra registrada e estoque atualizado!',
      'toast.productSaved': 'Produto cadastrado no estoque!',
      'toast.productUpdated': 'Produto atualizado com sucesso!',
      'toast.productMovedTrash': 'Produto movido para a lixeira (disponível por 30 dias).',
      'toast.productRestored': 'Produto restaurado com sucesso!',
      'toast.productDeletedPerm': 'Produto excluído definitivamente.',
      'toast.noteSaved': 'Recado publicado com sucesso!',
      'toast.eventSaved': 'Escala agendada com sucesso!',
      'toast.timesheetSaved': 'Registro de horas salvo!',
      'toast.profileSaved': 'Perfil atualizado com sucesso!',
      'toast.staffSaved': 'Colaboradora salva!',
      'toast.reportCopied': 'Relatório copiado para a área de transferência!',
      'toast.whatsappExported': 'Registro exportado para o WhatsApp!',
      'toast.rulesSaved': 'Regras de semáforo salvas!',

      // Meses e Dias da Semana
      'months': [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ],
      'weekdaysShort': ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
      'weekdaysFull': ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    }
  };

  let currentLang = DEFAULT_LANG;

  // Carrega idioma salvo ou define o padrão ('es')
  function initLanguage() {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved === 'pt' || saved === 'es') {
        currentLang = saved;
      } else {
        currentLang = DEFAULT_LANG; // Padrão de fábrica: Espanhol
      }
    } catch (e) {
      currentLang = DEFAULT_LANG;
    }
    return currentLang;
  }

  // Obtém o idioma atual
  function getLanguage() {
    return currentLang;
  }

  // Retorna texto traduzido para uma chave
  function t(key, params = {}) {
    const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    let text = langDict[key];

    if (text === undefined) {
      // Fallback para espanhol ou para chave
      text = TRANSLATIONS[DEFAULT_LANG][key];
      if (text === undefined) {
        return key;
      }
    }

    if (typeof text === 'string' && params && typeof params === 'object') {
      Object.keys(params).forEach(pKey => {
        const regex = new RegExp(`\\{${pKey}\\}`, 'g');
        text = text.replace(regex, params[pKey]);
      });
    }

    return text;
  }

  // Atualiza todos os elementos estáticos marcados com data-i18n
  function updateDomTranslations() {
    // Atualiza tag html lang
    if (document.documentElement) {
      document.documentElement.lang = currentLang === 'es' ? 'es' : 'pt-BR';
    }

    // data-i18n para textContent / innerHTML
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const text = t(key);
      if (text !== undefined && text !== key) {
        // Se a tradução contiver tags HTML (como <strong>), usa innerHTML
        if (text.includes('<') && text.includes('>')) {
          el.innerHTML = text;
        } else {
          el.textContent = text;
        }
      }
    });

    // data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      const text = t(key);
      if (text !== undefined && text !== key) {
        el.setAttribute('placeholder', text);
      }
    });

    // data-i18n-title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (!key) return;
      const text = t(key);
      if (text !== undefined && text !== key) {
        el.setAttribute('title', text);
      }
    });

    // data-i18n-aria
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      const text = t(key);
      if (text !== undefined && text !== key) {
        el.setAttribute('aria-label', text);
      }
    });

    // Atualiza estado visual de todos os botões de seleção de idioma na página
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang-btn');
      if (btnLang === currentLang) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  }

  // Define novo idioma, salva e atualiza a interface
  function setLanguage(lang, triggerRender = true) {
    if (lang !== 'es' && lang !== 'pt') {
      console.warn('[I18N] Idioma inválido ignorado:', lang);
      return;
    }

    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (e) {
      console.warn('[I18N] Falha ao gravar idioma no localStorage:', e);
    }

    updateDomTranslations();

    // Emite evento customizado global para que o app.js re-renderize os componentes dinâmicos
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        const event = typeof CustomEvent === 'function'
          ? new CustomEvent('airbnb-language-changed', { detail: { lang: currentLang, triggerRender } })
          : { type: 'airbnb-language-changed', detail: { lang: currentLang, triggerRender } };
        window.dispatchEvent(event);
      } catch (err) {
        console.warn('[I18N] Falha ao disparar evento airbnb-language-changed:', err);
      }

      // Redundância direta: chama renderAll se disponível
      if (triggerRender && typeof window.renderAll === 'function') {
        try { window.renderAll(); } catch (e) {}
      }
    }
  }

  // Delegação global e infalível de clique para qualquer botão [data-lang-btn]
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      const btn = e.target && e.target.closest ? e.target.closest('[data-lang-btn]') : null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const targetLang = btn.getAttribute('data-lang-btn');
      if (targetLang === 'es' || targetLang === 'pt') {
        setLanguage(targetLang);
      }
    }, true);
  }

  // Inicializa imediatamente
  initLanguage();

  // Executa no DOMContentLoaded ou imediatamente se o DOM já estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateDomTranslations();
    });
  } else {
    updateDomTranslations();
  }

  // Exporta módulo global
  root.I18N = {
    getLanguage,
    setLanguage,
    t,
    updateDomTranslations,
    TRANSLATIONS,
    DEFAULT_LANG
  };

})(typeof window !== 'undefined' ? window : this);
