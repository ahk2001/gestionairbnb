// initialData.js - Catálogo de Produtos e Dados Iniciais do Sistema Airbnb Control
// Cada uma das 24 imagens em ./assets representa um produto real
(function(root) {

const DEFAULT_PROPERTIES = [
  {
    id: "JB",
    code: "JB",
    name: "JB",
    subtitle: "",
    color: "#FFFFFF", bgBadge: "rgba(255, 255, 255, 0.20)"
  },
  {
    id: "VN",
    code: "VN",
    name: "VN",
    subtitle: "",
    color: "#FFFFFF", bgBadge: "rgba(255, 255, 255, 0.20)"
  },
  {
    id: "HN",
    code: "HN",
    name: "HN",
    subtitle: "",
    color: "#FFFFFF", bgBadge: "rgba(255, 255, 255, 0.20)"
  }
];

const INITIAL_STAFF = [
  {
    id: "staff_1",
    name: "Equipe",
    email: "equipe.gestao.airbnb@gmail.com",
    role: "",
    phone: "+34 612 345 678",
    isActive: true,
    avatar: "EQ",
    createdAt: "2026-09-01T08:00:00Z"
  },
  {
    id: "staff_2",
    name: "Maria",
    email: "maria.airbnb.valencia@gmail.com",
    role: "",
    phone: "+34 612 987 654",
    isActive: true,
    avatar: "MA",
    createdAt: "2026-09-15T09:30:00Z"
  },
  {
    id: "staff_3",
    name: "Ana Paula",
    email: "anapaula.airbnb.valencia@gmail.com",
    role: "",
    phone: "+34 612 555 432",
    isActive: true,
    avatar: "AP",
    createdAt: "2026-09-20T10:00:00Z"
  }
];

const OWNER_PROFILE = {
  id: "owner_admin",
  name: "Gestor",
  email: "gestionairbnb2026@gmail.com",
  role: "Administrador",
  avatar: "AD"
};

// Catálogo Mestre dos 24 produtos extraídos das fotos em ./assets
const PRODUCT_CATALOG = [
  {
    id: "p01",
    name: "Amaciante Concentrado Violets (80 Doses)",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza & Rouparia",
    unit: "frasco",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (1).jpeg",
    estimatedPrice: 1.85,
    description: "Amaciador concentrado perfume floral duradouro para roupas de cama e toalhas."
  },
  {
    id: "p02",
    name: "Desinfetante de Tecidos Elimina Odores",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza & Rouparia",
    unit: "frasco",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (2).jpeg",
    estimatedPrice: 2.40,
    description: "Desinfetante para máquina de lavar. Higieniza toalhas de banho e lençóis."
  },
  {
    id: "p03",
    name: "Luvas de Nitrilo Pequeno (30 un)",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza & Proteção",
    unit: "caixa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.08.jpeg",
    estimatedPrice: 2.50,
    description: "Luvas multiuso sem pó para higienização segura dos banheiros e cozinha."
  },
  {
    id: "p04",
    name: "Detergente Roupa Marselha (50 Doses)",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza & Rouparia",
    unit: "garrafa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.09 (1).jpeg",
    estimatedPrice: 3.60,
    description: "Sabão líquido tradicional com aroma de Marselha para lavagem de enxoval."
  },
  {
    id: "p05",
    name: "Vinagre de Limpeza Concentrado 1L",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza Geral",
    unit: "garrafa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.09.jpeg",
    estimatedPrice: 0.95,
    description: "100% natural, desengordurante e desodorizante multiuso para cubas e azulejos."
  },
  {
    id: "p06",
    name: "Limpador Ducha e Box Chuveiro 1L",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza de Banheiro",
    unit: "pulverizador",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.12 (1).jpeg",
    estimatedPrice: 1.75,
    description: "Spray rápido para remoção de resíduos de sabonete e calcário nos vidros do box."
  },
  {
    id: "p07",
    name: "Multiusos com Lixívia / Cloro Spray",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Desinfecção Geral",
    unit: "pulverizador",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.12 (2).jpeg",
    estimatedPrice: 1.65,
    description: "Desinfetante potente com cloro ativo para pias, vasos e bancadas de cozinha."
  },
  {
    id: "p08",
    name: "Spray Anticalcário Desincrustante e Brilho",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Metais & Banheiro",
    unit: "pulverizador",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.12.jpeg",
    estimatedPrice: 1.80,
    description: "Remove crostas de calcário e devolve o brilho de torneiras e registros."
  },
  {
    id: "p09",
    name: "Papel Higiênico Rolo Duplo Compacto",
    brand: "Bosque Verde",
    category: "amenities",
    categoryLabel: "Amenities & Banheiro",
    unit: "pacote",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (1).jpeg",
    estimatedPrice: 3.20,
    description: "Rolo compacto de folha dupla extra macio para reposição dos banheiros."
  },
  {
    id: "p10",
    name: "Torradas Cereais & Sementes 550g (6x8)",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Café da Manhã & Snacks",
    unit: "pacote",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (2).jpeg",
    estimatedPrice: 1.95,
    description: "Pacotes individuais crocantes para kit café de boas-vindas dos hóspedes."
  },
  {
    id: "p11",
    name: "Ambientador Spray Blossom Anti-Odores",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Aromatização",
    unit: "lata",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (3).jpeg",
    estimatedPrice: 1.30,
    description: "Aroma suave Blossom para finalizar a faxina antes da chegada dos hóspedes."
  },
  {
    id: "p12",
    name: "Refil Sabonete Líquido Mãos Dermo Protect",
    brand: "Deliplus",
    category: "amenities",
    categoryLabel: "Amenities & Higiene",
    unit: "refil",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (4).jpeg",
    estimatedPrice: 1.45,
    description: "Bolsa refil econômica para reabastecimento dos dosadores de pia de lavabo."
  },
  {
    id: "p13",
    name: "Gel de Banho Aveia Pele Sensível",
    brand: "Deliplus",
    category: "amenities",
    categoryLabel: "Amenities de Banho",
    unit: "frasco",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (5).jpeg",
    estimatedPrice: 1.50,
    description: "Sabonete líquido hidratante com vitamina B3 para o dispenser do chuveiro."
  },
  {
    id: "p14",
    name: "Shampoo Zero Suavidade & Limpeza",
    brand: "Deliplus",
    category: "amenities",
    categoryLabel: "Amenities de Banho",
    unit: "frasco",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (6).jpeg",
    estimatedPrice: 1.70,
    description: "Shampoo suave dermatológico para todos os tipos de cabelo."
  },
  {
    id: "p15",
    name: "Bolachas Maria 100% Integral",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Café da Manhã & Snacks",
    unit: "pacote",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (7).jpeg",
    estimatedPrice: 1.40,
    description: "Pacote com rolos individuais de biscoito integral para café da manhã."
  },
  {
    id: "p16",
    name: "Café Cápsulas Ristretto Nespresso (20 un)",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Café da Manhã",
    unit: "caixa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (8).jpeg",
    estimatedPrice: 3.80,
    description: "Cápsulas de alumínio intensidade 10 compatíveis com máquina Nespresso."
  },
  {
    id: "p17",
    name: "Café Cápsulas Colômbia Nespresso (20 un)",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Café da Manhã",
    unit: "caixa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (9).jpeg",
    estimatedPrice: 3.80,
    description: "Cápsulas de alumínio intensidade 8 sabor aveludado e equilibrado."
  },
  {
    id: "p18",
    name: "Gel Sanitário WC Aqua AntiCalcário",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza de Banheiro",
    unit: "frasco",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14.jpeg",
    estimatedPrice: 1.55,
    description: "Gel de bico direcionado para limpeza profunda da sanita e combate ao calcário."
  },
  {
    id: "p19",
    name: "Madalenas Tradicionais (12 unidades)",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Café da Manhã & Snacks",
    unit: "pacote",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (1).jpeg",
    estimatedPrice: 1.60,
    description: "Bolinhos esponjosos e embalados individualmente para a recepção dos hóspedes."
  },
  {
    id: "p20",
    name: "Madalenas 700g Formato Econômico (x12)",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Café da Manhã & Snacks",
    unit: "pacote",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (2).jpeg",
    estimatedPrice: 2.10,
    description: "Pacote reforçado para reposição do armário de café de boas-vindas."
  },
  {
    id: "p21",
    name: "Água Mineral Natural Bronchales 1.5L",
    brand: "Bronchales",
    category: "comida",
    categoryLabel: "Bebidas & Frigobar",
    unit: "garrafa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (3).jpeg",
    estimatedPrice: 0.42,
    description: "Garrafa grande de água mineral fresca para a geladeira de cortesia."
  },
  {
    id: "p22",
    name: "Cerveja Especial Estrella Galicia 25cl",
    brand: "Estrella Galicia",
    category: "comida",
    categoryLabel: "Bebidas & Frigobar",
    unit: "garrafa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (4).jpeg",
    estimatedPrice: 0.85,
    description: "Garrafinhas de cerveja artesanal para kit premium de boas-vindas no frigobar."
  },
  {
    id: "p23",
    name: "Leite Semidesnatado Garrafa 1L",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Café da Manhã",
    unit: "garrafa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.15.jpeg",
    estimatedPrice: 0.99,
    description: "Garrafa de leite com tampa anti-luz para cafeteira e consumo do hóspede."
  },
  {
    id: "p24",
    name: "Água Mineral Natural Bronchales 50cl (500ml)",
    brand: "Bronchales",
    category: "comida",
    categoryLabel: "Bebidas & Frigobar",
    unit: "garrafa",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.16.jpeg",
    estimatedPrice: 0.25,
    description: "Garrafinhas individuais para a cabeceira da cama e mesa de recepção."
  }
];

// Gera os produtos com estoque inicial distribuído por apartamento
function generateInitialProducts() {
  const products = [];

  // Configurações personalizadas de status e quantidades iniciais para cada imóvel
  // Garantindo que todos os 24 itens existam nos 3 aptos com situações operacionais realistas
  const presets = {
    JB: {
      p01: { qty: 2, status: "suficiente" },
      p02: { qty: 1, status: "acabando" },
      p03: { qty: 0, status: "falta" },
      p04: { qty: 2, status: "suficiente" },
      p05: { qty: 3, status: "suficiente" },
      p06: { qty: 1, status: "acabando" },
      p07: { qty: 2, status: "suficiente" },
      p08: { qty: 0, status: "falta" },
      p09: { qty: 1, status: "acabando" },
      p10: { qty: 3, status: "suficiente" },
      p11: { qty: 2, status: "suficiente" },
      p12: { qty: 1, status: "acabando" },
      p13: { qty: 2, status: "suficiente" },
      p14: { qty: 2, status: "suficiente" },
      p15: { qty: 1, status: "acabando" },
      p16: { qty: 0, status: "falta" },
      p17: { qty: 2, status: "suficiente" },
      p18: { qty: 1, status: "acabando" },
      p19: { qty: 2, status: "suficiente" },
      p20: { qty: 1, status: "suficiente" },
      p21: { qty: 4, status: "suficiente" },
      p22: { qty: 0, status: "falta" },
      p23: { qty: 1, status: "acabando" },
      p24: { qty: 6, status: "suficiente" }
    },
    VN: {
      p01: { qty: 3, status: "suficiente" },
      p02: { qty: 2, status: "suficiente" },
      p03: { qty: 1, status: "acabando" },
      p04: { qty: 1, status: "acabando" },
      p05: { qty: 2, status: "suficiente" },
      p06: { qty: 0, status: "falta" },
      p07: { qty: 1, status: "acabando" },
      p08: { qty: 2, status: "suficiente" },
      p09: { qty: 0, status: "falta" },
      p10: { qty: 2, status: "suficiente" },
      p11: { qty: 1, status: "acabando" },
      p12: { qty: 2, status: "suficiente" },
      p13: { qty: 0, status: "falta" },
      p14: { qty: 1, status: "acabando" },
      p15: { qty: 3, status: "suficiente" },
      p16: { qty: 2, status: "suficiente" },
      p17: { qty: 1, status: "acabando" },
      p18: { qty: 2, status: "suficiente" },
      p19: { qty: 0, status: "falta" },
      p20: { qty: 2, status: "suficiente" },
      p21: { qty: 2, status: "suficiente" },
      p22: { qty: 4, status: "suficiente" },
      p23: { qty: 0, status: "falta" },
      p24: { qty: 2, status: "acabando" }
    },
    HN: {
      p01: { qty: 1, status: "acabando" },
      p02: { qty: 2, status: "suficiente" },
      p03: { qty: 2, status: "suficiente" },
      p04: { qty: 0, status: "falta" },
      p05: { qty: 1, status: "acabando" },
      p06: { qty: 2, status: "suficiente" },
      p07: { qty: 0, status: "falta" },
      p08: { qty: 1, status: "acabando" },
      p09: { qty: 4, status: "suficiente" },
      p10: { qty: 0, status: "falta" },
      p11: { qty: 2, status: "suficiente" },
      p12: { qty: 0, status: "falta" },
      p13: { qty: 3, status: "suficiente" },
      p14: { qty: 2, status: "suficiente" },
      p15: { qty: 1, status: "acabando" },
      p16: { qty: 3, status: "suficiente" },
      p17: { qty: 0, status: "falta" },
      p18: { qty: 1, status: "acabando" },
      p19: { qty: 3, status: "suficiente" },
      p20: { qty: 1, status: "acabando" },
      p21: { qty: 5, status: "suficiente" },
      p22: { qty: 2, status: "acabando" },
      p23: { qty: 3, status: "suficiente" },
      p24: { qty: 1, status: "falta" }
    }
  };

  DEFAULT_PROPERTIES.forEach((prop) => {
    PRODUCT_CATALOG.forEach((item) => {
      const propPreset = presets[prop.id]?.[item.id] || { qty: 2, status: "suficiente" };
      products.push({
        id: `${prop.id}_${item.id}`,
        propertyId: prop.id,
        catalogId: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        categoryLabel: item.categoryLabel,
        unit: item.unit,
        photo: item.photo,
        estimatedPrice: item.estimatedPrice,
        description: item.description,
        quantity: propPreset.qty,
        status: propPreset.status, // "suficiente" | "acabando" | "falta"
        faltaThreshold: (item.id === 'p09' || item.id === 'p21') ? 2 : 0,
        atencaoThreshold: (item.id === 'p09' || item.id === 'p21') ? 4 : 1,
        suficienteThreshold: (item.id === 'p09' || item.id === 'p21') ? 5 : 2,
        note: (prop.id === 'JB' && item.id === 'p01') ? 'Priorizar versão concentrada sem perfume' : null,
        noteAuthor: (prop.id === 'JB' && item.id === 'p01') ? 'Maria' : null,
        noteUpdatedAt: (prop.id === 'JB' && item.id === 'p01') ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
    });
  });

  return products;
}

const INITIAL_TRASH_PRODUCTS = [
  {
    id: "trash_p91",
    catalogId: "trash_p91",
    name: "Sabão em Pó Tradicional 1kg",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza & Rouparia",
    unit: "cx",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (1).jpeg",
    estimatedPrice: 3.20,
    description: "Sabão em pó para lavagem de panos de chão e toalhas de serviço.",
    deletedAt: "2026-10-06T14:20:00Z", // Excluído há 5 dias (restam 25 dias)
    stockSnapshots: [
      { propertyId: "JB", quantity: 1, status: "acabando" },
      { propertyId: "VN", quantity: 0, status: "falta" },
      { propertyId: "HN", quantity: 2, status: "suficiente" }
    ]
  },
  {
    id: "trash_p92",
    catalogId: "trash_p92",
    name: "Esponja Dupla Face Abrasiva (Pack 4 un)",
    brand: "Bosque Verde",
    category: "limpeza",
    categoryLabel: "Limpeza & Cozinha",
    unit: "pct",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.09 (1).jpeg",
    estimatedPrice: 1.15,
    description: "Esponjas verdes abrasivas para louças e bancadas.",
    deletedAt: "2026-09-29T10:15:00Z", // Excluído há 12 dias (restam 18 dias)
    stockSnapshots: [
      { propertyId: "JB", quantity: 2, status: "suficiente" },
      { propertyId: "VN", quantity: 1, status: "acabando" },
      { propertyId: "HN", quantity: 0, status: "falta" }
    ]
  },
  {
    id: "trash_p93",
    catalogId: "trash_p93",
    name: "Chá de Camomila & Mel (20 saquinhos)",
    brand: "Hacendado",
    category: "comida",
    categoryLabel: "Alimentos & Bebidas",
    unit: "cx",
    photo: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (3).jpeg",
    estimatedPrice: 1.45,
    description: "Infusão de camomila relaxante com toque de mel para cesta de boas-vindas.",
    deletedAt: "2026-09-18T16:45:00Z", // Excluído há 23 dias (restam 7 dias)
    stockSnapshots: [
      { propertyId: "JB", quantity: 3, status: "suficiente" },
      { propertyId: "VN", quantity: 2, status: "suficiente" },
      { propertyId: "HN", quantity: 1, status: "acabando" }
    ]
  }
];

const INITIAL_NOTES = [
  {
    id: "note_1",
    propertyId: "JB",
    authorType: "staff",
    authorName: "Equipe",
    content: "Torneira do lavabo da suíte está com gotejamento leve. Fechei o registro auxiliar por segurança.",
    createdAt: "2026-10-10T14:30:00Z",
    isDone: false
  },
  {
    id: "note_2",
    propertyId: "JB",
    authorType: "owner",
    authorName: "Gestor",
    content: "Hóspede de hoje solicitou berço dobrável e 2 toalhas extras de banho. Já deixei no armário superior.",
    createdAt: "2026-10-11T09:15:00Z",
    isDone: true
  },
  {
    id: "note_3",
    propertyId: "JB",
    authorType: "staff",
    authorName: "Ana Paula",
    content: "Ar-condicionado da sala revisado pelo técnico hoje pela manhã. Filtros limpos e controle com pilhas novas.",
    createdAt: "2026-10-11T11:40:00Z",
    isDone: true
  },
  {
    id: "note_4",
    propertyId: "VN",
    authorType: "staff",
    authorName: "Maria",
    content: "Fiz reposição dos sachês de açúcar e cápsulas no VN. Ficou faltando apenas o sabonete líquido.",
    createdAt: "2026-10-10T09:40:00Z",
    isDone: false
  },
  {
    id: "note_5",
    propertyId: "VN",
    authorType: "staff",
    authorName: "Maria",
    content: "Lâmpada dicroica do espelho do banheiro queimou. Comprei a reposição e deixei na gaveta de utilidades.",
    createdAt: "2026-10-09T17:20:00Z",
    isDone: true
  },
  {
    id: "note_6",
    propertyId: "HN",
    authorType: "owner",
    authorName: "Gestor",
    content: "Check-in às 15h da família alemã. Favor colocar as garrafinhas de água na geladeira.",
    createdAt: "2026-10-11T08:00:00Z",
    isDone: false
  },
  {
    id: "note_7",
    propertyId: "HN",
    authorType: "staff",
    authorName: "Ana Paula",
    content: "Hóspede fez check-out mais cedo (às 10h) e elogiou muito a limpeza. Apto 100% pronto para a próxima entrada.",
    createdAt: "2026-10-10T11:00:00Z",
    isDone: true
  }
];

const INITIAL_CALENDAR_EVENTS = [
  {
    id: "cal_1",
    propertyId: "JB",
    title: "Faxina profunda pós Check-out (Família Silva)",
    eventDate: "2026-10-09",
    eventType: "limpeza",
    assignedStaffId: "staff_1",
    assignedStaffName: "Equipe",
    status: "concluido",
    notes: "Troca completa de roupa de cama e toalhas."
  },
  {
    id: "cal_2",
    propertyId: "VN",
    title: "Troca de enxoval e conferência de amenities",
    eventDate: "2026-10-10",
    eventType: "limpeza",
    assignedStaffId: "staff_2",
    assignedStaffName: "Maria",
    status: "concluido",
    notes: "Apto higienizado e perfumado."
  },
  {
    id: "cal_3",
    propertyId: "JB",
    title: "Limpeza Geral Express & Boas-Vindas",
    eventDate: "2026-10-11", // Hoje
    eventType: "limpeza",
    assignedStaffId: "staff_1",
    assignedStaffName: "Equipe",
    status: "em_andamento",
    notes: "Deixar ar condicionado programado para 22°C."
  },
  {
    id: "cal_4",
    propertyId: "HN",
    title: "Check-in Hóspedes Internacionais (Reserva #8841)",
    eventDate: "2026-10-11", // Hoje
    eventType: "checking",
    assignedStaffId: "owner_admin",
    assignedStaffName: "Gestor",
    status: "pendente",
    notes: "Entregar chave presencialmente na portaria às 15h."
  },
  {
    id: "cal_5",
    propertyId: "VN",
    title: "Higienização Completa & Reposição Café",
    eventDate: "2026-10-12", // Amanhã
    eventType: "limpeza",
    assignedStaffId: "staff_2",
    assignedStaffName: "Maria",
    status: "pendente",
    notes: "Apto desocupado até as 18h."
  },
  {
    id: "cal_6",
    propertyId: "JB",
    title: "Manutenção Preventiva dos Filtros de Ar",
    eventDate: "2026-10-13",
    eventType: "manutencao",
    assignedStaffId: "staff_1",
    assignedStaffName: "Equipe",
    status: "pendente",
    notes: "Técnico virá entre 10h e 12h."
  },
  {
    id: "cal_7",
    propertyId: "HN",
    title: "Grande Ida ao Mercadona (Compras 3 Aptos)",
    eventDate: "2026-10-14",
    eventType: "compras",
    assignedStaffId: "staff_3",
    assignedStaffName: "Ana Paula",
    status: "pendente",
    notes: "Comprar itens da lista de reposição e papel higiênico."
  },
  {
    id: "cal_8",
    propertyId: "HN",
    title: "Check-out e Vistoria Completa",
    eventDate: "2026-10-15",
    eventType: "checkout",
    assignedStaffId: "staff_3",
    assignedStaffName: "Ana Paula",
    status: "pendente",
    notes: "Conferir controle da TV e cafeteira."
  }
];

const INITIAL_PURCHASES = [
  // HOJE: 2026-10-11
  {
    id: "pur_1",
    propertyId: "JB",
    productId: "p03",
    productName: "Luvas de Nitrilo Pequeno (30 un)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.08.jpeg",
    items: [
      {
        catalogId: "p03",
        productName: "Luvas de Nitrilo Pequeno (30 un)",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.08.jpeg",
        quantity: 2
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_1",
    buyerName: "Equipe",
    purchaseDate: "2026-10-11",
    quantityBought: 2,
    totalCost: 5.00,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.12 (2).jpeg",
    notes: "Mercadona Centro - Caixa 4 (Comprado hoje de manhã)"
  },
  {
    id: "pur_2",
    propertyId: "VN",
    productId: "p01",
    productName: "Amaciante Violets (1x) + Desinfetante de Tecidos (1x)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (1).jpeg",
    items: [
      {
        catalogId: "p01",
        productName: "Amaciante Concentrado Violets (80 Doses)",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (1).jpeg",
        quantity: 1
      },
      {
        catalogId: "p02",
        productName: "Desinfetante de Tecidos Elimina Odores",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (2).jpeg",
        quantity: 1
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_2",
    buyerName: "Maria",
    purchaseDate: "2026-10-11",
    quantityBought: 2,
    totalCost: 4.25,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (7).jpeg",
    notes: "Reposição emergencial para lavagem de lençóis do VN"
  },

  // ONTEM: 2026-10-10
  {
    id: "pur_3",
    propertyId: "JB",
    productId: "p16",
    productName: "Café Cápsulas Ristretto Nespresso (20 un)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (8).jpeg",
    items: [
      {
        catalogId: "p16",
        productName: "Café Cápsulas Ristretto Nespresso (20 un)",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (8).jpeg",
        quantity: 3
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_1",
    buyerName: "Equipe",
    purchaseDate: "2026-10-10",
    quantityBought: 3,
    totalCost: 11.40,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (8).jpeg",
    notes: "Estoque de café reforçado para os próximos 15 dias"
  },
  {
    id: "pur_4",
    propertyId: "HN",
    productId: "p21",
    productName: "Água Mineral Natural Bronchales 1.5L (6 un)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (3).jpeg",
    items: [
      {
        catalogId: "p21",
        productName: "Água Mineral Natural Bronchales 1.5L",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (3).jpeg",
        quantity: 6
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_3",
    buyerName: "Ana Paula",
    purchaseDate: "2026-10-10",
    quantityBought: 6,
    totalCost: 2.52,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (1).jpeg",
    notes: "Águas deixadas gelando para check-in do HN"
  },

  // ESTA SEMANA: 2026-10-08 e 2026-10-06
  {
    id: "pur_5",
    propertyId: "VN",
    productId: "p09",
    productName: "2 Itens: 2x Papel Higiênico, 1x Sabonete Líquido",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (1).jpeg",
    items: [
      {
        catalogId: "p09",
        productName: "Papel Higiênico Rolo Duplo Compacto",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (1).jpeg",
        quantity: 2
      },
      {
        catalogId: "p13",
        productName: "Sabonete Líquido Mãos Refil 1L",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (5).jpeg",
        quantity: 1
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_2",
    buyerName: "Maria",
    purchaseDate: "2026-10-08",
    quantityBought: 3,
    totalCost: 9.80,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (9).jpeg",
    notes: "Reposição dos 2 banheiros do VN"
  },
  {
    id: "pur_6",
    propertyId: "JB",
    productId: "p04",
    productName: "Detergente Roupa Marselha (2x) + Lava-Louças (2x)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.09.jpeg",
    items: [
      {
        catalogId: "p04",
        productName: "Detergente Roupa Marselha (50 Doses)",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.09.jpeg",
        quantity: 2
      },
      {
        catalogId: "p06",
        productName: "Lava-Louças Concentrado Ultra Limão",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.12.jpeg",
        quantity: 2
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_1",
    buyerName: "Equipe",
    purchaseDate: "2026-10-06",
    quantityBought: 4,
    totalCost: 8.60,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.12.jpeg",
    notes: "Mercadona Express - Reposição de lavanderia e cozinha"
  },

  // MÊS ANTERIOR (SETEMBRO/2026):
  {
    id: "pur_7",
    propertyId: "HN",
    productId: "p21",
    productName: "Super Compra Mensal Despensa HN (Água x6, Café x4, Papel x3)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (3).jpeg",
    items: [
      {
        catalogId: "p21",
        productName: "Água Mineral Natural Bronchales 1.5L",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (3).jpeg",
        quantity: 6
      },
      {
        catalogId: "p16",
        productName: "Café Cápsulas Ristretto Nespresso (20 un)",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (8).jpeg",
        quantity: 4
      },
      {
        catalogId: "p09",
        productName: "Papel Higiênico Rolo Duplo Compacto",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (1).jpeg",
        quantity: 3
      }
    ],
    buyerType: "owner",
    buyerStaffId: null,
    buyerName: "Gestor",
    purchaseDate: "2026-09-28",
    quantityBought: 13,
    totalCost: 24.90,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (2).jpeg",
    notes: "Fardo de água e café para estoque da despensa"
  },
  {
    id: "pur_8",
    propertyId: "JB",
    productId: "p06",
    productName: "Kit Boas-Vindas & Limpeza (Lava-Louças x3, Amaciante x2)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.12.jpeg",
    items: [
      {
        catalogId: "p06",
        productName: "Lava-Louças Concentrado Ultra Limão",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.12.jpeg",
        quantity: 3
      },
      {
        catalogId: "p01",
        productName: "Amaciante Concentrado Violets (80 Doses)",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (1).jpeg",
        quantity: 2
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_1",
    buyerName: "Equipe",
    purchaseDate: "2026-09-15",
    quantityBought: 5,
    totalCost: 12.30,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.15 (4).jpeg",
    notes: "Produtos para limpeza pesada de meio de mês"
  },

  // DOIS MESES ATRÁS (AGOSTO/2026):
  {
    id: "pur_9",
    propertyId: "VN",
    productId: "p13",
    productName: "Enxoval & Higiene Geral (Sabonete 1L x4, Desinfetante x3)",
    productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (5).jpeg",
    items: [
      {
        catalogId: "p13",
        productName: "Sabonete Líquido Mãos Refil 1L",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.14 (5).jpeg",
        quantity: 4
      },
      {
        catalogId: "p02",
        productName: "Desinfetante de Tecidos Elimina Odores",
        productPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.08 (2).jpeg",
        quantity: 3
      }
    ],
    buyerType: "staff",
    buyerStaffId: "staff_2",
    buyerName: "Maria",
    purchaseDate: "2026-08-20",
    quantityBought: 7,
    totalCost: 18.70,
    receiptPhoto: "assets/WhatsApp Image 2026-10-08 at 10.38.16.jpeg",
    notes: "Compra de reposição quinzenal do VN em Agosto"
  }
];

const INITIAL_TIMESHEETS = [
  {
    id: "ts_sample_1",
    staffId: "staff_2",
    staffName: "Maria",
    date: "2026-10-10",
    startTime: "08:00",
    breakStartTime: "12:00",
    breakEndTime: "13:00",
    endTime: "16:30",
    totalMinutes: 450,
    isPaid: true,
    notes: "Limpeza de check-out e reposição de amenidades nos apartamentos JB e VN"
  },
  {
    id: "ts_sample_2",
    staffId: "staff_3",
    staffName: "Ana Paula",
    date: "2026-10-09",
    startTime: "08:30",
    breakStartTime: "",
    breakEndTime: "",
    endTime: "14:30",
    totalMinutes: 360,
    isPaid: true,
    notes: "Vistorias detalhadas e conferência de enxovais no HN"
  },
  {
    id: "ts_sample_3",
    staffId: "staff_1",
    staffName: "Equipe",
    date: "2026-10-11",
    startTime: "09:00",
    breakStartTime: "12:30",
    breakEndTime: "13:15",
    endTime: "17:00",
    totalMinutes: 435,
    isPaid: false,
    notes: "Higienização completa e lavagem de roupas de cama"
  },
  {
    id: "ts_sample_4",
    staffId: "staff_2",
    staffName: "Maria",
    date: "2026-10-11",
    startTime: "08:00",
    breakStartTime: "12:00",
    breakEndTime: "13:00",
    endTime: "16:00",
    totalMinutes: 420,
    isPaid: false,
    notes: "Limpeza geral e organização de estoque JB"
  }
];

// Exposição controlada para execução local direta (file://) e servidores web (http://)
const AirbnbInitialData = {
  DEFAULT_PROPERTIES,
  INITIAL_STAFF,
  OWNER_PROFILE,
  PRODUCT_CATALOG,
  generateInitialProducts,
  INITIAL_TRASH_PRODUCTS,
  INITIAL_NOTES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_PURCHASES,
  INITIAL_TIMESHEETS
};

root.AirbnbInitialData = AirbnbInitialData;

// Compatibilidade com ambientes Node / CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AirbnbInitialData;
}

})(typeof window !== 'undefined' ? window : globalThis);
