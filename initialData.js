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

const INITIAL_STAFF = [];

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

// Gera os 24 produtos cadastrados inicialmente para cada imóvel com quantidade zerada
function generateInitialProducts() {
  const products = [];

  DEFAULT_PROPERTIES.forEach((prop) => {
    PRODUCT_CATALOG.forEach((item) => {
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
        quantity: 0,
        status: "falta",
        faltaThreshold: (item.id === 'p09' || item.id === 'p21') ? 2 : 0,
        atencaoThreshold: (item.id === 'p09' || item.id === 'p21') ? 4 : 1,
        suficienteThreshold: (item.id === 'p09' || item.id === 'p21') ? 5 : 2,
        note: null,
        noteAuthor: null,
        noteUpdatedAt: null,
        updatedAt: new Date().toISOString()
      });
    });
  });

  return products;
}

const INITIAL_TRASH_PRODUCTS = [];
const INITIAL_NOTES = [];
const INITIAL_CALENDAR_EVENTS = [];
const INITIAL_PURCHASES = [];
const INITIAL_TIMESHEETS = [];

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
