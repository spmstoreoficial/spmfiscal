import { MunicipioSP } from '../types';
import { SP_MUNICIPALITIES } from './spMunicipalities';

export interface StateInfo {
  uf: string;
  nome: string;
  regiao: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
  capital: string;
  lat: number;
  lng: number;
  codigoIbgeUf: string;
}

export const BRAZIL_STATES: StateInfo[] = [
  // Sudeste
  { uf: 'SP', nome: 'São Paulo', regiao: 'Sudeste', capital: 'São Paulo', lat: -23.5505, lng: -46.6333, codigoIbgeUf: '35' },
  { uf: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste', capital: 'Belo Horizonte', lat: -19.9167, lng: -43.9345, codigoIbgeUf: '31' },
  { uf: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste', capital: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, codigoIbgeUf: '33' },
  { uf: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste', capital: 'Vitória', lat: -20.3155, lng: -40.3128, codigoIbgeUf: '32' },

  // Sul
  { uf: 'PR', nome: 'Paraná', regiao: 'Sul', capital: 'Curitiba', lat: -25.4295, lng: -49.2712, codigoIbgeUf: '41' },
  { uf: 'SC', nome: 'Santa Catarina', regiao: 'Sul', capital: 'Florianópolis', lat: -27.5954, lng: -48.5480, codigoIbgeUf: '42' },
  { uf: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul', capital: 'Porto Alegre', lat: -30.0346, lng: -51.2177, codigoIbgeUf: '43' },

  // Centro-Oeste
  { uf: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste', capital: 'Brasília', lat: -15.7975, lng: -47.8919, codigoIbgeUf: '53' },
  { uf: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste', capital: 'Goiânia', lat: -16.6864, lng: -49.2646, codigoIbgeUf: '52' },
  { uf: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste', capital: 'Cuiabá', lat: -15.6010, lng: -56.0979, codigoIbgeUf: '51' },
  { uf: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste', capital: 'Campo Grande', lat: -20.4428, lng: -54.6461, codigoIbgeUf: '50' },

  // Nordeste
  { uf: 'BA', nome: 'Bahia', regiao: 'Nordeste', capital: 'Salvador', lat: -12.9718, lng: -38.5016, codigoIbgeUf: '29' },
  { uf: 'PE', nome: 'Pernambuco', regiao: 'Nordeste', capital: 'Recife', lat: -8.0476, lng: -34.8770, codigoIbgeUf: '26' },
  { uf: 'CE', nome: 'Ceará', regiao: 'Nordeste', capital: 'Fortaleza', lat: -3.7319, lng: -38.5267, codigoIbgeUf: '23' },
  { uf: 'MA', nome: 'Maranhão', regiao: 'Nordeste', capital: 'São Luís', lat: -2.5297, lng: -44.3028, codigoIbgeUf: '21' },
  { uf: 'PB', nome: 'Paraíba', regiao: 'Nordeste', capital: 'João Pessoa', lat: -7.1153, lng: -34.8610, codigoIbgeUf: '25' },
  { uf: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste', capital: 'Natal', lat: -5.7945, lng: -35.2110, codigoIbgeUf: '24' },
  { uf: 'AL', nome: 'Alagoas', regiao: 'Nordeste', capital: 'Maceió', lat: -9.6658, lng: -35.7353, codigoIbgeUf: '27' },
  { uf: 'PI', nome: 'Piauí', regiao: 'Nordeste', capital: 'Teresina', lat: -5.0892, lng: -42.8016, codigoIbgeUf: '22' },
  { uf: 'SE', nome: 'Sergipe', regiao: 'Nordeste', capital: 'Aracaju', lat: -10.9472, lng: -37.0677, codigoIbgeUf: '28' },

  // Norte
  { uf: 'PA', nome: 'Pará', regiao: 'Norte', capital: 'Belém', lat: -1.4558, lng: -48.4902, codigoIbgeUf: '15' },
  { uf: 'AM', nome: 'Amazonas', regiao: 'Norte', capital: 'Manaus', lat: -3.1190, lng: -60.0217, codigoIbgeUf: '13' },
  { uf: 'RO', nome: 'Rondônia', regiao: 'Norte', capital: 'Porto Velho', lat: -8.7619, lng: -63.9039, codigoIbgeUf: '11' },
  { uf: 'TO', nome: 'Tocantins', regiao: 'Norte', capital: 'Palmas', lat: -10.1753, lng: -48.2982, codigoIbgeUf: '17' },
  { uf: 'AC', nome: 'Acre', regiao: 'Norte', capital: 'Rio Branco', lat: -9.9749, lng: -67.8243, codigoIbgeUf: '12' },
  { uf: 'AP', nome: 'Amapá', regiao: 'Norte', capital: 'Macapá', lat: 0.0352, lng: -51.0704, codigoIbgeUf: '16' },
  { uf: 'RR', nome: 'Roraima', regiao: 'Norte', capital: 'Boa Vista', lat: 2.8195, lng: -60.6712, codigoIbgeUf: '14' }
];

export interface MunicipioBrasil {
  nome: string;
  codigoIbge: string;
  uf: string;
  lat: number;
  lng: number;
  regiao: string;
  populacao?: number;
}

// Built-in indexed dataset of strategic, border, capital and major Brazilian municipalities
export const BUILTIN_BRAZIL_MUNICIPALITIES: MunicipioBrasil[] = [
  // --- MINAS GERAIS (MG) ---
  { nome: 'Extrema', codigoIbge: '3125101', uf: 'MG', lat: -22.8547, lng: -46.3186, regiao: 'Minas Gerais (Sul de Minas / Divisa SP)', populacao: 36780 },
  { nome: 'Camanducaia', codigoIbge: '3110509', uf: 'MG', lat: -22.7561, lng: -46.1436, regiao: 'Minas Gerais (Sul de Minas)', populacao: 21800 },
  { nome: 'Cambuí', codigoIbge: '3110608', uf: 'MG', lat: -22.6125, lng: -46.0575, regiao: 'Minas Gerais (Sul de Minas)', populacao: 29800 },
  { nome: 'Itapeva', codigoIbge: '3133600', uf: 'MG', lat: -22.7128, lng: -46.2208, regiao: 'Minas Gerais (Sul de Minas)', populacao: 9800 },
  { nome: 'Toledo', codigoIbge: '3169000', uf: 'MG', lat: -22.7444, lng: -46.3725, regiao: 'Minas Gerais (Sul de Minas)', populacao: 6200 },
  { nome: 'Monte Sião', codigoIbge: '3143401', uf: 'MG', lat: -22.4336, lng: -46.5731, regiao: 'Minas Gerais (Circuito das Malhas / Divisa SP)', populacao: 24100 },
  { nome: 'Jacutinga', codigoIbge: '3135100', uf: 'MG', lat: -22.2858, lng: -46.6117, regiao: 'Minas Gerais (Divisa SP)', populacao: 26300 },
  { nome: 'Ouro Fino', codigoIbge: '3146008', uf: 'MG', lat: -22.2831, lng: -46.3689, regiao: 'Minas Gerais (Sul de Minas)', populacao: 33900 },
  { nome: 'Pouso Alegre', codigoIbge: '3152501', uf: 'MG', lat: -22.2300, lng: -45.9364, regiao: 'Minas Gerais (Sul de Minas)', populacao: 152549 },
  { nome: 'Itajubá', codigoIbge: '3132404', uf: 'MG', lat: -22.4261, lng: -45.4528, regiao: 'Minas Gerais (Sul de Minas)', populacao: 97800 },
  { nome: 'Santa Rita do Sapucaí', codigoIbge: '3159605', uf: 'MG', lat: -22.2525, lng: -45.7036, regiao: 'Minas Gerais (Sul de Minas)', populacao: 43700 },
  { nome: 'Poços de Caldas', codigoIbge: '3151800', uf: 'MG', lat: -21.7850, lng: -46.5625, regiao: 'Minas Gerais (Sul de Minas)', populacao: 166085 },
  { nome: 'Andradas', codigoIbge: '3102605', uf: 'MG', lat: -22.0667, lng: -46.5694, regiao: 'Minas Gerais (Sul de Minas)', populacao: 41300 },
  { nome: 'Passos', codigoIbge: '3147907', uf: 'MG', lat: -20.7189, lng: -46.6097, regiao: 'Minas Gerais (Sudoeste de Minas)', populacao: 115900 },
  { nome: 'Varginha', codigoIbge: '3170701', uf: 'MG', lat: -21.5519, lng: -45.4303, regiao: 'Minas Gerais (Sul de Minas)', populacao: 136602 },
  { nome: 'Três Corações', codigoIbge: '3169307', uf: 'MG', lat: -21.6942, lng: -45.2575, regiao: 'Minas Gerais (Sul de Minas)', populacao: 80000 },
  { nome: 'Juiz de Fora', codigoIbge: '3136702', uf: 'MG', lat: -21.7642, lng: -43.3497, regiao: 'Minas Gerais (Zona da Mata)', populacao: 573285 },
  { nome: 'Uberaba', codigoIbge: '3170107', uf: 'MG', lat: -19.7483, lng: -47.9319, regiao: 'Minas Gerais (Triângulo Mineiro)', populacao: 337836 },
  { nome: 'Uberlândia', codigoIbge: '3170206', uf: 'MG', lat: -18.9186, lng: -48.2772, regiao: 'Minas Gerais (Triângulo Mineiro)', populacao: 699097 },
  { nome: 'Belo Horizonte', codigoIbge: '3106200', uf: 'MG', lat: -19.9167, lng: -43.9345, regiao: 'Minas Gerais (Capital)', populacao: 2315560 },
  { nome: 'Contagem', codigoIbge: '3118601', uf: 'MG', lat: -19.9386, lng: -44.0536, regiao: 'Minas Gerais (Metropolitana)', populacao: 621863 },
  { nome: 'Betim', codigoIbge: '3106705', uf: 'MG', lat: -19.9678, lng: -44.1983, regiao: 'Minas Gerais (Metropolitana)', populacao: 411780 },
  { nome: 'Montes Claros', codigoIbge: '3143302', uf: 'MG', lat: -16.7350, lng: -43.8617, regiao: 'Minas Gerais (Norte de Minas)', populacao: 414249 },
  { nome: 'Governador Valadares', codigoIbge: '3127701', uf: 'MG', lat: -18.8511, lng: -41.9494, regiao: 'Minas Gerais (Rio Doce)', populacao: 257171 },
  { nome: 'Ipatinga', codigoIbge: '3131307', uf: 'MG', lat: -19.4683, lng: -42.5367, regiao: 'Minas Gerais (Vale do Aço)', populacao: 227731 },
  { nome: 'Divinópolis', codigoIbge: '3122306', uf: 'MG', lat: -20.1436, lng: -44.8872, regiao: 'Minas Gerais (Oeste de Minas)', populacao: 231091 },
  { nome: 'Sete Lagoas', codigoIbge: '3167202', uf: 'MG', lat: -19.4658, lng: -44.2467, regiao: 'Minas Gerais (Central)', populacao: 234252 },

  // --- RIO DE JANEIRO (RJ) ---
  { nome: 'Resende', codigoIbge: '3304201', uf: 'RJ', lat: -22.4689, lng: -44.4467, regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 129600 },
  { nome: 'Itatiaia', codigoIbge: '3302254', uf: 'RJ', lat: -22.4961, lng: -44.5631, regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 32000 },
  { nome: 'Porto Real', codigoIbge: '3304151', uf: 'RJ', lat: -22.4183, lng: -44.3414, regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 20000 },
  { nome: 'Barra Mansa', codigoIbge: '3300407', uf: 'RJ', lat: -22.5442, lng: -44.1714, regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 184800 },
  { nome: 'Volta Redonda', codigoIbge: '3306305', uf: 'RJ', lat: -22.5231, lng: -44.1042, regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 273900 },
  { nome: 'Paraty', codigoIbge: '3303807', uf: 'RJ', lat: -23.2178, lng: -44.7131, regiao: 'Rio de Janeiro (Costa Verde / Divisa SP)', populacao: 44800 },
  { nome: 'Angra dos Reis', codigoIbge: '3300100', uf: 'RJ', lat: -23.0067, lng: -44.3181, regiao: 'Rio de Janeiro (Costa Verde)', populacao: 207000 },
  { nome: 'Rio de Janeiro', codigoIbge: '3304557', uf: 'RJ', lat: -22.9068, lng: -43.1729, regiao: 'Rio de Janeiro (Capital)', populacao: 6211423 },
  { nome: 'Niterói', codigoIbge: '3303302', uf: 'RJ', lat: -22.8833, lng: -43.1036, regiao: 'Rio de Janeiro (Metropolitana)', populacao: 515300 },
  { nome: 'Petrópolis', codigoIbge: '3303906', uf: 'RJ', lat: -22.5050, lng: -43.1789, regiao: 'Rio de Janeiro (Região Serrana)', populacao: 306600 },
  { nome: 'Duque de Caxias', codigoIbge: '3301702', uf: 'RJ', lat: -22.7858, lng: -43.3061, regiao: 'Rio de Janeiro (Baixada Fluminense)', populacao: 924600 },
  { nome: 'Nova Iguaçu', codigoIbge: '3303500', uf: 'RJ', lat: -22.7556, lng: -43.4603, regiao: 'Rio de Janeiro (Baixada Fluminense)', populacao: 825388 },
  { nome: 'São Gonçalo', codigoIbge: '3304904', uf: 'RJ', lat: -22.8269, lng: -43.0539, regiao: 'Rio de Janeiro (Metropolitana)', populacao: 896744 },
  { nome: 'Campos dos Goytacazes', codigoIbge: '3301009', uf: 'RJ', lat: -21.7547, lng: -41.3244, regiao: 'Rio de Janeiro (Norte Fluminense)', populacao: 483551 },
  { nome: 'Macaé', codigoIbge: '3302403', uf: 'RJ', lat: -22.3769, lng: -41.7869, regiao: 'Rio de Janeiro (Norte Fluminense)', populacao: 246391 },
  { nome: 'Cabo Frio', codigoIbge: '3300704', uf: 'RJ', lat: -22.8892, lng: -42.0186, regiao: 'Rio de Janeiro (Região dos Lagos)', populacao: 221987 },

  // --- PARANÁ (PR) ---
  { nome: 'Curitiba', codigoIbge: '4106902', uf: 'PR', lat: -25.4295, lng: -49.2712, regiao: 'Paraná (Capital)', populacao: 1773733 },
  { nome: 'São José dos Pinhais', codigoIbge: '4125506', uf: 'PR', lat: -25.5347, lng: -49.2064, regiao: 'Paraná (Região Metropolitana)', populacao: 329000 },
  { nome: 'Londrina', codigoIbge: '4113700', uf: 'PR', lat: -23.3045, lng: -51.1696, regiao: 'Paraná (Norte do Paraná)', populacao: 555937 },
  { nome: 'Maringá', codigoIbge: '4115200', uf: 'PR', lat: -23.4205, lng: -51.9333, regiao: 'Paraná (Norte Central)', populacao: 409657 },
  { nome: 'Ponta Grossa', codigoIbge: '4119905', uf: 'PR', lat: -25.0950, lng: -50.1619, regiao: 'Paraná (Campos Gerais)', populacao: 358800 },
  { nome: 'Cascavel', codigoIbge: '4104808', uf: 'PR', lat: -24.9578, lng: -53.4594, regiao: 'Paraná (Oeste)', populacao: 348000 },
  { nome: 'Foz do Iguaçu', codigoIbge: '4108304', uf: 'PR', lat: -25.5161, lng: -54.5853, regiao: 'Paraná (Oeste)', populacao: 285400 },
  { nome: 'Toledo', codigoIbge: '4127700', uf: 'PR', lat: -24.7139, lng: -53.7431, regiao: 'Paraná (Oeste)', populacao: 150470 },
  { nome: 'Guarapuava', codigoIbge: '4109401', uf: 'PR', lat: -25.3953, lng: -51.4581, regiao: 'Paraná (Centro-Sul)', populacao: 182644 },
  { nome: 'Paranaguá', codigoIbge: '4118204', uf: 'PR', lat: -25.5206, lng: -48.5092, regiao: 'Paraná (Litoral)', populacao: 156000 },
  { nome: 'Jacarezinho', codigoIbge: '4111803', uf: 'PR', lat: -23.1600, lng: -49.9744, regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 40300 },
  { nome: 'Cambará', codigoIbge: '4103602', uf: 'PR', lat: -23.0461, lng: -50.0736, regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 25400 },
  { nome: 'Ribeirão Claro', codigoIbge: '4121703', uf: 'PR', lat: -23.1939, lng: -49.7578, regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 10800 },
  { nome: 'Carlópolis', codigoIbge: '4104501', uf: 'PR', lat: -23.4253, lng: -49.7225, regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 14300 },
  { nome: 'Santo Antônio da Platina', codigoIbge: '4124103', uf: 'PR', lat: -23.2950, lng: -50.0817, regiao: 'Paraná (Norte Pioneiro)', populacao: 46200 },

  // --- SANTA CATARINA (SC) ---
  { nome: 'Florianópolis', codigoIbge: '4205407', uf: 'SC', lat: -27.5954, lng: -48.5480, regiao: 'Santa Catarina (Capital)', populacao: 537213 },
  { nome: 'Joinville', codigoIbge: '4209102', uf: 'SC', lat: -26.3045, lng: -48.8487, regiao: 'Santa Catarina (Norte)', populacao: 616323 },
  { nome: 'Blumenau', codigoIbge: '4202404', uf: 'SC', lat: -26.9194, lng: -49.0661, regiao: 'Santa Catarina (Vale do Itajaí)', populacao: 361855 },
  { nome: 'Chapecó', codigoIbge: '4204202', uf: 'SC', lat: -27.1006, lng: -52.6156, regiao: 'Santa Catarina (Oeste)', populacao: 254781 },
  { nome: 'Itajaí', codigoIbge: '4208203', uf: 'SC', lat: -26.9078, lng: -48.6619, regiao: 'Santa Catarina (Litoral Norte)', populacao: 264054 },
  { nome: 'Criciúma', codigoIbge: '4204608', uf: 'SC', lat: -28.6775, lng: -49.3703, regiao: 'Santa Catarina (Sul)', populacao: 214493 },
  { nome: 'Balneário Camboriú', codigoIbge: '4202008', uf: 'SC', lat: -26.9933, lng: -48.6353, regiao: 'Santa Catarina (Litoral Norte)', populacao: 139155 },

  // --- RIO GRANDE DO SUL (RS) ---
  { nome: 'Porto Alegre', codigoIbge: '4314902', uf: 'RS', lat: -30.0346, lng: -51.2177, regiao: 'Rio Grande do Sul (Capital)', populacao: 1332570 },
  { nome: 'Caxias do Sul', codigoIbge: '4305108', uf: 'RS', lat: -29.1678, lng: -51.1794, regiao: 'Rio Grande do Sul (Serra Gaúcha)', populacao: 463377 },
  { nome: 'Canoas', codigoIbge: '4304606', uf: 'RS', lat: -29.9178, lng: -51.1836, regiao: 'Rio Grande do Sul (Metropolitana)', populacao: 347657 },
  { nome: 'Pelotas', codigoIbge: '4314407', uf: 'RS', lat: -31.7654, lng: -52.3376, regiao: 'Rio Grande do Sul (Sul)', populacao: 325689 },
  { nome: 'Santa Maria', codigoIbge: '4316907', uf: 'RS', lat: -29.6842, lng: -53.8069, regiao: 'Rio Grande do Sul (Central)', populacao: 271633 },
  { nome: 'Passo Fundo', codigoIbge: '4314100', uf: 'RS', lat: -28.2612, lng: -52.4083, regiao: 'Rio Grande do Sul (Norte)', populacao: 206215 },
  { nome: 'Rio Grande', codigoIbge: '4315602', uf: 'RS', lat: -32.0350, lng: -52.0986, regiao: 'Rio Grande do Sul (Sul/Porto)', populacao: 191900 },

  // --- MATO GROSSO DO SUL (MS) ---
  { nome: 'Campo Grande', codigoIbge: '5002704', uf: 'MS', lat: -20.4428, lng: -54.6461, regiao: 'Mato Grosso do Sul (Capital)', populacao: 897938 },
  { nome: 'Dourados', codigoIbge: '5003702', uf: 'MS', lat: -22.2231, lng: -54.8056, regiao: 'Mato Grosso do Sul (Sudoeste)', populacao: 243300 },
  { nome: 'Três Lagoas', codigoIbge: '5008305', uf: 'MS', lat: -20.7850, lng: -51.7061, regiao: 'Mato Grosso do Sul (Divisa SP / Rio Paraná)', populacao: 132100 },
  { nome: 'Corumbá', codigoIbge: '5003207', uf: 'MS', lat: -19.0097, lng: -57.6533, regiao: 'Mato Grosso do Sul (Pantanal)', populacao: 112000 },
  { nome: 'Ponta Porã', codigoIbge: '5006606', uf: 'MS', lat: -22.5361, lng: -55.7256, regiao: 'Mato Grosso do Sul (Fronteira)', populacao: 92017 },
  { nome: 'Bataguassu', codigoIbge: '5001904', uf: 'MS', lat: -21.7139, lng: -52.4222, regiao: 'Mato Grosso do Sul (Divisa SP)', populacao: 23600 },
  { nome: 'Brasilândia', codigoIbge: '5002308', uf: 'MS', lat: -21.2561, lng: -52.0347, regiao: 'Mato Grosso do Sul (Divisa SP)', populacao: 12100 },

  // --- MATO GROSSO (MT) ---
  { nome: 'Cuiabá', codigoIbge: '5103403', uf: 'MT', lat: -15.6010, lng: -56.0979, regiao: 'Mato Grosso (Capital)', populacao: 650900 },
  { nome: 'Várzea Grande', codigoIbge: '5108402', uf: 'MT', lat: -15.6469, lng: -56.1325, regiao: 'Mato Grosso (Metropolitana)', populacao: 299472 },
  { nome: 'Rondonópolis', codigoIbge: '5107602', uf: 'MT', lat: -16.4678, lng: -54.6361, regiao: 'Mato Grosso (Sudeste)', populacao: 244897 },
  { nome: 'Sinop', codigoIbge: '5107909', uf: 'MT', lat: -11.8642, lng: -55.5053, regiao: 'Mato Grosso (Norte)', populacao: 196094 },
  { nome: 'Sorriso', codigoIbge: '5107925', uf: 'MT', lat: -12.5425, lng: -55.7211, regiao: 'Mato Grosso (Norte/Agronegócio)', populacao: 110603 },

  // --- GOIÁS (GO) & DISTRITO FEDERAL (DF) ---
  { nome: 'Brasília', codigoIbge: '5300108', uf: 'DF', lat: -15.7975, lng: -47.8919, regiao: 'Distrito Federal (Capital Federal)', populacao: 2817068 },
  { nome: 'Goiânia', codigoIbge: '5208707', uf: 'GO', lat: -16.6864, lng: -49.2646, regiao: 'Goiás (Capital)', populacao: 1437237 },
  { nome: 'Aparecida de Goiânia', codigoIbge: '5201405', uf: 'GO', lat: -16.8228, lng: -49.2481, regiao: 'Goiás (Metropolitana)', populacao: 527550 },
  { nome: 'Anápolis', codigoIbge: '5201108', uf: 'GO', lat: -16.3267, lng: -48.9533, regiao: 'Goiás (Central)', populacao: 398817 },
  { nome: 'Rio Verde', codigoIbge: '5218805', uf: 'GO', lat: -17.7919, lng: -50.9192, regiao: 'Goiás (Sudoeste)', populacao: 225696 },
  { nome: 'Luziânia', codigoIbge: '5212501', uf: 'GO', lat: -16.2525, lng: -47.9500, regiao: 'Goiás (Entorno do DF)', populacao: 208725 },

  // --- BAHIA (BA) ---
  { nome: 'Salvador', codigoIbge: '2927408', uf: 'BA', lat: -12.9718, lng: -38.5016, regiao: 'Bahia (Capital)', populacao: 2418005 },
  { nome: 'Feira de Santana', codigoIbge: '2910800', uf: 'BA', lat: -12.2667, lng: -38.9667, regiao: 'Bahia (Centro-Norte)', populacao: 616279 },
  { nome: 'Vitória da Conquista', codigoIbge: '2933307', uf: 'BA', lat: -14.8661, lng: -40.8394, regiao: 'Bahia (Sudoeste)', populacao: 370868 },
  { nome: 'Camaçari', codigoIbge: '2905701', uf: 'BA', lat: -12.6975, lng: -38.3242, regiao: 'Bahia (Metropolitana)', populacao: 299558 },
  { nome: 'Juazeiro', codigoIbge: '2918407', uf: 'BA', lat: -9.4167, lng: -40.5033, regiao: 'Bahia (Vale do São Francisco)', populacao: 235816 },
  { nome: 'Itabuna', codigoIbge: '2914802', uf: 'BA', lat: -14.7858, lng: -39.2800, regiao: 'Bahia (Sul)', populacao: 186708 },
  { nome: 'Ilhéus', codigoIbge: '2913606', uf: 'BA', lat: -14.7889, lng: -39.0494, regiao: 'Bahia (Sul/Litoral)', populacao: 178703 },
  { nome: 'Porto Seguro', codigoIbge: '2925303', uf: 'BA', lat: -16.4497, lng: -39.0647, regiao: 'Bahia (Extremo Sul)', populacao: 167955 },
  { nome: 'Barreiras', codigoIbge: '2903201', uf: 'BA', lat: -12.1528, lng: -44.9961, regiao: 'Bahia (Oeste)', populacao: 159743 },

  // --- PERNAMBUCO (PE) ---
  { nome: 'Recife', codigoIbge: '2611606', uf: 'PE', lat: -8.0476, lng: -34.8770, regiao: 'Pernambuco (Capital)', populacao: 1488920 },
  { nome: 'Jaboatão dos Guararapes', codigoIbge: '2607901', uf: 'PE', lat: -8.1128, lng: -35.0150, regiao: 'Pernambuco (Metropolitana)', populacao: 643759 },
  { nome: 'Olinda', codigoIbge: '2609600', uf: 'PE', lat: -7.9986, lng: -34.8458, regiao: 'Pernambuco (Metropolitana)', populacao: 349976 },
  { nome: 'Caruaru', codigoIbge: '2604106', uf: 'PE', lat: -8.2833, lng: -35.9761, regiao: 'Pernambuco (Agreste)', populacao: 378052 },
  { nome: 'Petrolina', codigoIbge: '2611101', uf: 'PE', lat: -9.3986, lng: -40.5008, regiao: 'Pernambuco (Sertão/São Francisco)', populacao: 386786 },

  // --- CEARÁ (CE) ---
  { nome: 'Fortaleza', codigoIbge: '2304400', uf: 'CE', lat: -3.7319, lng: -38.5267, regiao: 'Ceará (Capital)', populacao: 2428678 },
  { nome: 'Caucaia', codigoIbge: '2303709', uf: 'CE', lat: -3.7361, lng: -38.6531, regiao: 'Ceará (Metropolitana)', populacao: 355679 },
  { nome: 'Juazeiro do Norte', codigoIbge: '2307304', uf: 'CE', lat: -7.2044, lng: -39.3150, regiao: 'Ceará (Cariri)', populacao: 286120 },
  { nome: 'Maracanaú', codigoIbge: '2307650', uf: 'CE', lat: -3.8767, lng: -38.6256, regiao: 'Ceará (Metropolitana)', populacao: 234392 },
  { nome: 'Sobral', codigoIbge: '2312908', uf: 'CE', lat: -3.6892, lng: -40.3481, regiao: 'Ceará (Noroeste)', populacao: 203062 },

  // --- ESPÍRITO SANTO (ES) ---
  { nome: 'Vitória', codigoIbge: '3205309', uf: 'ES', lat: -20.3155, lng: -40.3128, regiao: 'Espírito Santo (Capital)', populacao: 322800 },
  { nome: 'Vila Velha', codigoIbge: '3205200', uf: 'ES', lat: -20.3297, lng: -40.2925, regiao: 'Espírito Santo (Metropolitana)', populacao: 467722 },
  { nome: 'Serra', codigoIbge: '3205002', uf: 'ES', lat: -20.1286, lng: -40.3078, regiao: 'Espírito Santo (Metropolitana)', populacao: 520653 },
  { nome: 'Cariacica', codigoIbge: '3201308', uf: 'ES', lat: -20.2639, lng: -40.4200, regiao: 'Espírito Santo (Metropolitana)', populacao: 353510 },
  { nome: 'Cachoeiro de Itapemirim', codigoIbge: '3201209', uf: 'ES', lat: -20.8489, lng: -41.1128, regiao: 'Espírito Santo (Sul)', populacao: 185784 },
  { nome: 'Linhares', codigoIbge: '3203205', uf: 'ES', lat: -19.3911, lng: -40.0722, regiao: 'Espírito Santo (Norte)', populacao: 171079 },

  // --- AMAZONAS (AM) & PARÁ (PA) ---
  { nome: 'Manaus', codigoIbge: '1302603', uf: 'AM', lat: -3.1190, lng: -60.0217, regiao: 'Amazonas (Capital)', populacao: 2063500 },
  { nome: 'Parintins', codigoIbge: '1303403', uf: 'AM', lat: -2.6286, lng: -56.7358, regiao: 'Amazonas (Médio Amazonas)', populacao: 96372 },
  { nome: 'Belém', codigoIbge: '1501402', uf: 'PA', lat: -1.4558, lng: -48.4902, regiao: 'Pará (Capital)', populacao: 1303300 },
  { nome: 'Ananindeua', codigoIbge: '1500800', uf: 'PA', lat: -1.3656, lng: -48.3742, regiao: 'Pará (Metropolitana)', populacao: 478778 },
  { nome: 'Santarém', codigoIbge: '1506807', uf: 'PA', lat: -2.4431, lng: -54.7083, regiao: 'Pará (Baixo Amazonas)', populacao: 331937 },
  { nome: 'Marabá', codigoIbge: '1504208', uf: 'PA', lat: -5.3686, lng: -49.1178, regiao: 'Pará (Sudeste)', populacao: 266536 },
  { nome: 'Parauapebas', codigoIbge: '1505536', uf: 'PA', lat: -6.0678, lng: -49.9022, regiao: 'Pará (Carajás)', populacao: 267836 },

  // --- DEMAIS ESTADOS (CAPITAIS E POLOS) ---
  { nome: 'Natal', codigoIbge: '2408102', uf: 'RN', lat: -5.7945, lng: -35.2110, regiao: 'Rio Grande do Norte (Capital)', populacao: 751300 },
  { nome: 'Mossoró', codigoIbge: '2408003', uf: 'RN', lat: -5.1878, lng: -37.3442, regiao: 'Rio Grande do Norte (Oeste)', populacao: 264577 },
  { nome: 'João Pessoa', codigoIbge: '2507507', uf: 'PB', lat: -7.1153, lng: -34.8610, regiao: 'Paraíba (Capital)', populacao: 833932 },
  { nome: 'Campina Grande', codigoIbge: '2504009', uf: 'PB', lat: -7.2219, lng: -35.8828, regiao: 'Paraíba (Agreste)', populacao: 419379 },
  { nome: 'Maceió', codigoIbge: '2704302', uf: 'AL', lat: -9.6658, lng: -35.7353, regiao: 'Alagoas (Capital)', populacao: 957916 },
  { nome: 'Arapiraca', codigoIbge: '2700300', uf: 'AL', lat: -9.7517, lng: -36.6606, regiao: 'Alagoas (Agreste)', populacao: 234696 },
  { nome: 'Aracaju', codigoIbge: '2800308', uf: 'SE', lat: -10.9472, lng: -37.0677, regiao: 'Sergipe (Capital)', populacao: 602757 },
  { nome: 'Teresina', codigoIbge: '2211001', uf: 'PI', lat: -5.0892, lng: -42.8016, regiao: 'Piauí (Capital)', populacao: 866300 },
  { nome: 'Parnaíba', codigoIbge: '2207702', uf: 'PI', lat: -2.9031, lng: -41.7769, regiao: 'Piauí (Litoral)', populacao: 162159 },
  { nome: 'São Luís', codigoIbge: '2111300', uf: 'MA', lat: -2.5297, lng: -44.3028, regiao: 'Maranhão (Capital)', populacao: 1037775 },
  { nome: 'Imperatriz', codigoIbge: '2105302', uf: 'MA', lat: -5.5264, lng: -47.4917, regiao: 'Maranhão (Oeste)', populacao: 273110 },
  { nome: 'Porto Velho', codigoIbge: '1100205', uf: 'RO', lat: -8.7619, lng: -63.9039, regiao: 'Rondônia (Capital)', populacao: 460413 },
  { nome: 'Ji-Paraná', codigoIbge: '1100122', uf: 'RO', lat: -10.8847, lng: -61.9458, regiao: 'Rondônia (Central)', populacao: 124333 },
  { nome: 'Palmas', codigoIbge: '1721000', uf: 'TO', lat: -10.1753, lng: -48.2982, regiao: 'Tocantins (Capital)', populacao: 302692 },
  { nome: 'Araguaína', codigoIbge: '1702109', uf: 'TO', lat: -7.1925, lng: -48.2042, regiao: 'Tocantins (Norte)', populacao: 171481 },
  { nome: 'Rio Branco', codigoIbge: '1200401', uf: 'AC', lat: -9.9749, lng: -67.8243, regiao: 'Acre (Capital)', populacao: 364756 },
  { nome: 'Cruzeiro do Sul', codigoIbge: '1200203', uf: 'AC', lat: -7.6319, lng: -72.6700, regiao: 'Acre (Juruá)', populacao: 91888 },
  { nome: 'Macapá', codigoIbge: '1600303', uf: 'AP', lat: 0.0352, lng: -51.0704, regiao: 'Amapá (Capital)', populacao: 442933 },
  { nome: 'Santana', codigoIbge: '1600600', uf: 'AP', lat: -0.0583, lng: -51.1817, regiao: 'Amapá (Metropolitana)', populacao: 107618 },
  { nome: 'Boa Vista', codigoIbge: '1400100', uf: 'RR', lat: 2.8195, lng: -60.6712, regiao: 'Roraima (Capital)', populacao: 413486 }
];

// Helper to normalize strings for accent-free search
export function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Local cache for any dynamically resolved IBGE municipalities
 */
const dynamicIbgeCache = new Map<string, MunicipioBrasil>();

/**
 * Extract UF and Clean Name from text (e.g. "Extrema - MG", "Pitangueiras (SP)", "Curitiba/PR")
 */
export function extractCityAndUf(rawText: string): { cleanName: string; detectedUf?: string } {
  if (!rawText) return { cleanName: '' };

  let text = rawText.trim()
    .replace(/^Prefeitura\s+Municipal\s+de\s+/i, '')
    .replace(/^Prefeitura\s+de\s+/i, '')
    .replace(/^Prefeitura\s+/i, '')
    .trim();

  let detectedUf: string | undefined;

  // Pattern like "- MG", "/RJ", "(SP)", " - BA"
  const suffixMatch = text.match(/(?:[\s\-_/(]+)([A-Za-z]{2})(?:[\s\-_/)]*)$/);
  if (suffixMatch) {
    const ufCandidate = suffixMatch[1].toUpperCase();
    if (BRAZIL_STATES.some(s => s.uf === ufCandidate)) {
      detectedUf = ufCandidate;
      text = text.replace(/(?:[\s\-_/(]+)[A-Za-z]{2}(?:[\s\-_/)]*)$/, '').trim();
    }
  }

  return { cleanName: text, detectedUf };
}

/**
 * Universal lookup for ANY municipality in Brazil (SP + 26 States + DF)
 */
export function findMunicipioBrasil(cityName: string, targetUf?: string): MunicipioBrasil | undefined {
  if (!cityName) return undefined;

  const { cleanName, detectedUf } = extractCityAndUf(cityName);
  const effectiveUf = (targetUf || detectedUf || '').trim().toUpperCase();
  const normTarget = normalizeStr(cleanName);

  if (!normTarget) return undefined;

  // 1. Check in SP Municipalities (645 Cities)
  if (!effectiveUf || effectiveUf === 'SP') {
    const spMatch = SP_MUNICIPALITIES.find(m => normalizeStr(m.nome) === normTarget);
    if (spMatch) {
      return {
        nome: spMatch.nome,
        codigoIbge: spMatch.codigoIbge,
        uf: 'SP',
        lat: spMatch.lat,
        lng: spMatch.lng,
        regiao: spMatch.regiao,
        populacao: spMatch.populacao
      };
    }
  }

  // 2. Check in Built-in National Dataset
  const directBuiltin = BUILTIN_BRAZIL_MUNICIPALITIES.find(m => {
    const mNorm = normalizeStr(m.nome);
    const matchName = mNorm === normTarget;
    if (matchName) {
      if (!effectiveUf) return true;
      return m.uf === effectiveUf;
    }
    return false;
  });

  if (directBuiltin) {
    return directBuiltin;
  }

  // 3. Check dynamic memory cache
  const cacheKey = `${normTarget}_${effectiveUf || 'ALL'}`;
  if (dynamicIbgeCache.has(cacheKey)) {
    return dynamicIbgeCache.get(cacheKey);
  }

  // 4. Fuzzy fallback match for SP
  if (!effectiveUf || effectiveUf === 'SP') {
    const fuzzySp = SP_MUNICIPALITIES.find(m => {
      const spNorm = normalizeStr(m.nome);
      return spNorm.startsWith(normTarget) || normTarget.startsWith(spNorm);
    });
    if (fuzzySp) {
      return {
        nome: fuzzySp.nome,
        codigoIbge: fuzzySp.codigoIbge,
        uf: 'SP',
        lat: fuzzySp.lat,
        lng: fuzzySp.lng,
        regiao: fuzzySp.regiao,
        populacao: fuzzySp.populacao
      };
    }
  }

  // 5. State Centroid fallback if UF is recognized
  if (effectiveUf) {
    const state = BRAZIL_STATES.find(s => s.uf === effectiveUf);
    if (state) {
      return {
        nome: cleanName,
        codigoIbge: `${state.codigoIbgeUf}00000`,
        uf: state.uf,
        lat: state.lat,
        lng: state.lng,
        regiao: `${state.nome} (${state.regiao})`
      };
    }
  }

  return undefined;
}

/**
 * Search autocomplete across all municipalities in Brazil
 */
export function searchMunicipalitiesBrasil(query: string, limit = 10, ufFilter?: string): MunicipioBrasil[] {
  if (!query || query.trim().length === 0) {
    const defaultSp = SP_MUNICIPALITIES.slice(0, Math.min(limit, 6)).map(m => ({
      nome: m.nome,
      codigoIbge: m.codigoIbge,
      uf: 'SP',
      lat: m.lat,
      lng: m.lng,
      regiao: m.regiao,
      populacao: m.populacao
    }));
    const defaultBr = BUILTIN_BRAZIL_MUNICIPALITIES.slice(0, Math.max(0, limit - defaultSp.length));
    return [...defaultSp, ...defaultBr];
  }

  const { cleanName, detectedUf } = extractCityAndUf(query);
  const normQuery = normalizeStr(cleanName || query);
  const targetUf = (ufFilter || detectedUf || '').trim().toUpperCase();

  const results: MunicipioBrasil[] = [];

  // Search in SP dataset
  if (!targetUf || targetUf === 'SP') {
    for (const sp of SP_MUNICIPALITIES) {
      if (results.length >= limit) break;
      const spNorm = normalizeStr(sp.nome);
      const regNorm = normalizeStr(sp.regiao);
      if (spNorm.includes(normQuery) || regNorm.includes(normQuery) || sp.codigoIbge.includes(normQuery)) {
        results.push({
          nome: sp.nome,
          codigoIbge: sp.codigoIbge,
          uf: 'SP',
          lat: sp.lat,
          lng: sp.lng,
          regiao: sp.regiao,
          populacao: sp.populacao
        });
      }
    }
  }

  // Search in Built-in National dataset
  for (const br of BUILTIN_BRAZIL_MUNICIPALITIES) {
    if (results.length >= limit) break;
    if (targetUf && br.uf !== targetUf) continue;
    const brNorm = normalizeStr(br.nome);
    const regNorm = normalizeStr(br.regiao);
    if (brNorm.includes(normQuery) || regNorm.includes(normQuery) || br.codigoIbge.includes(normQuery)) {
      if (!results.some(r => r.codigoIbge === br.codigoIbge)) {
        results.push(br);
      }
    }
  }

  return results.slice(0, limit);
}

/**
 * Get municipality data by 7-digit IBGE code
 */
export function getMunicipioByIbge(codigoIbge: string): MunicipioBrasil | undefined {
  if (!codigoIbge) return undefined;
  const cleanCode = codigoIbge.trim();

  // 1. Check SP
  const sp = SP_MUNICIPALITIES.find(m => m.codigoIbge === cleanCode || m.codigoIbge.startsWith(cleanCode));
  if (sp) {
    return {
      nome: sp.nome,
      codigoIbge: sp.codigoIbge,
      uf: 'SP',
      lat: sp.lat,
      lng: sp.lng,
      regiao: sp.regiao,
      populacao: sp.populacao
    };
  }

  // 2. Check Built-in National
  const br = BUILTIN_BRAZIL_MUNICIPALITIES.find(m => m.codigoIbge === cleanCode || m.codigoIbge.startsWith(cleanCode));
  if (br) {
    return br;
  }

  return undefined;
}

/**
 * Asynchronously query official IBGE Localidades REST API for any of Brazil's 5,570 municipalities
 */
export async function fetchIbgeMunicipalityInfo(cityName: string, uf?: string): Promise<MunicipioBrasil | undefined> {
  const local = findMunicipioBrasil(cityName, uf);
  if (local && !local.codigoIbge.endsWith('00000')) {
    return local;
  }

  const { cleanName, detectedUf } = extractCityAndUf(cityName);
  const targetUf = (uf || detectedUf || '').trim().toUpperCase();

  try {
    const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${encodeURIComponent(cleanName)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const munData = Array.isArray(data) ? data[0] : data;
      if (munData && munData.id) {
        const stateUf = munData.microrregiao?.mesorregiao?.UF?.sigla || targetUf || 'BR';
        const stateName = munData.microrregiao?.mesorregiao?.UF?.nome || '';
        const stateCenter = BRAZIL_STATES.find(s => s.uf === stateUf);

        const result: MunicipioBrasil = {
          nome: munData.nome,
          codigoIbge: String(munData.id),
          uf: stateUf,
          lat: stateCenter?.lat || -14.2350,
          lng: stateCenter?.lng || -51.9253,
          regiao: `${stateName} (${stateUf})`
        };

        const cacheKey = `${normalizeStr(cleanName)}_${targetUf || 'ALL'}`;
        dynamicIbgeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (e) {
    console.warn('IBGE Localidades fetch fallback:', e);
  }

  return local;
}
