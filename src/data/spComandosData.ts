import { MunicipioInfoAvancada } from '../types';
import { IBGE_645_TO_NAME_MAP, getMunicipioNameByIbge } from './ibgeNamesMap';

export interface ComandoMeta {
  id: string;
  nome: string;
  sigla: string;
  regiaoSede: string;
  color: string;
  badgeBg: string;
  textColor: string;
  grupo: 'Capital' | 'Grande SP' | 'Interior';
}

export const COMANDOS_SP: Record<string, ComandoMeta> = {
  FORA_SP: {
    id: 'FORA_SP',
    nome: 'Fora de SP',
    sigla: 'Fora de SP',
    regiaoSede: 'Município Interestadual (Fora do Estado de SP)',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-600/30 text-purple-300 border-purple-500/40',
    textColor: 'text-purple-400',
    grupo: 'Interior'
  },
  'FORA DE SP': {
    id: 'FORA_SP',
    nome: 'Fora de SP',
    sigla: 'Fora de SP',
    regiaoSede: 'Município Interestadual (Fora do Estado de SP)',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-600/30 text-purple-300 border-purple-500/40',
    textColor: 'text-purple-400',
    grupo: 'Interior'
  },
  CPC: {
    id: 'CPC',
    nome: 'CPC',
    sigla: 'CPC',
    regiaoSede: 'São Paulo (Capital)',
    color: '#3b82f6',
    badgeBg: 'bg-blue-600/30 text-blue-300 border-blue-500/40',
    textColor: 'text-blue-400',
    grupo: 'Capital'
  },
  'CPA/M-6': {
    id: 'CPA/M-6',
    nome: 'CPA/M-6',
    sigla: 'CPA/M-6',
    regiaoSede: 'Grande ABC (Santo André / SBC)',
    color: '#a855f7',
    badgeBg: 'bg-purple-600/30 text-purple-300 border-purple-500/40',
    textColor: 'text-purple-400',
    grupo: 'Grande SP'
  },
  'CPA/M-7': {
    id: 'CPA/M-7',
    nome: 'CPA/M-7',
    sigla: 'CPA/M-7',
    regiaoSede: 'Guarulhos e Região Norte',
    color: '#ec4899',
    badgeBg: 'bg-pink-600/30 text-pink-300 border-pink-500/40',
    textColor: 'text-pink-400',
    grupo: 'Grande SP'
  },
  'CPA/M-8': {
    id: 'CPA/M-8',
    nome: 'CPA/M-8',
    sigla: 'CPA/M-8',
    regiaoSede: 'Osasco e Região Oeste',
    color: '#d946ef',
    badgeBg: 'bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/40',
    textColor: 'text-fuchsia-400',
    grupo: 'Grande SP'
  },
  'CPA/M-12': {
    id: 'CPA/M-12',
    nome: 'CPA/M-12',
    sigla: 'CPA/M-12',
    regiaoSede: 'Alto Tietê (Mogi das Cruzes / Suzano)',
    color: '#8b5cf6',
    badgeBg: 'bg-violet-600/30 text-violet-300 border-violet-500/40',
    textColor: 'text-violet-400',
    grupo: 'Grande SP'
  },
  'CPI-1': {
    id: 'CPI-1',
    nome: 'CPI-1',
    sigla: 'CPI-1',
    regiaoSede: 'Vale do Paraíba e Litoral Norte',
    color: '#2563eb',
    badgeBg: 'bg-blue-700/30 text-blue-200 border-blue-600/40',
    textColor: 'text-blue-400',
    grupo: 'Interior'
  },
  'CPI-2': {
    id: 'CPI-2',
    nome: 'CPI-2',
    sigla: 'CPI-2',
    regiaoSede: 'Campinas, Jundiaí e Bragança',
    color: '#0284c7',
    badgeBg: 'bg-sky-600/30 text-sky-300 border-sky-500/40',
    textColor: 'text-sky-400',
    grupo: 'Interior'
  },
  'CPI-3': {
    id: 'CPI-3',
    nome: 'CPI-3',
    sigla: 'CPI-3',
    regiaoSede: 'Ribeirão Preto, Franca e São Carlos',
    color: '#7c3aed',
    badgeBg: 'bg-purple-700/30 text-purple-200 border-purple-600/40',
    textColor: 'text-purple-300',
    grupo: 'Interior'
  },
  'CPI-4': {
    id: 'CPI-4',
    nome: 'CPI-4',
    sigla: 'CPI-4',
    regiaoSede: 'Bauru, Marília, Jaú e Lins',
    color: '#f43f5e',
    badgeBg: 'bg-rose-600/30 text-rose-300 border-rose-500/40',
    textColor: 'text-rose-400',
    grupo: 'Interior'
  },
  'CPI-5': {
    id: 'CPI-5',
    nome: 'CPI-5',
    sigla: 'CPI-5',
    regiaoSede: 'São José do Rio Preto e Catanduva',
    color: '#e11d48',
    badgeBg: 'bg-rose-700/30 text-rose-200 border-rose-600/40',
    textColor: 'text-rose-300',
    grupo: 'Interior'
  },
  'CPI-6': {
    id: 'CPI-6',
    nome: 'CPI-6',
    sigla: 'CPI-6',
    regiaoSede: 'Santos, Baixada Santista e Registro',
    color: '#16a34a',
    badgeBg: 'bg-green-600/30 text-green-300 border-green-500/40',
    textColor: 'text-green-400',
    grupo: 'Interior'
  },
  'CPI-7': {
    id: 'CPI-7',
    nome: 'CPI-7',
    sigla: 'CPI-7',
    regiaoSede: 'Sorocaba, Botucatu e Itapetininga',
    color: '#0d9488',
    badgeBg: 'bg-teal-600/30 text-teal-300 border-teal-500/40',
    textColor: 'text-teal-400',
    grupo: 'Interior'
  },
  'CPI-8': {
    id: 'CPI-8',
    nome: 'CPI-8',
    sigla: 'CPI-8',
    regiaoSede: 'Presidente Prudente, Assis e Dracena',
    color: '#ea580c',
    badgeBg: 'bg-orange-600/30 text-orange-300 border-orange-500/40',
    textColor: 'text-orange-400',
    grupo: 'Interior'
  },
  'CPI-9': {
    id: 'CPI-9',
    nome: 'CPI-9',
    sigla: 'CPI-9',
    regiaoSede: 'Piracicaba, Limeira e Rio Claro',
    color: '#d97706',
    badgeBg: 'bg-amber-600/30 text-amber-300 border-amber-500/40',
    textColor: 'text-amber-400',
    grupo: 'Interior'
  },
  'CPI-10': {
    id: 'CPI-10',
    nome: 'CPI-10',
    sigla: 'CPI-10',
    regiaoSede: 'Araçatuba, Birigui e Andradina',
    color: '#eab308',
    badgeBg: 'bg-yellow-600/30 text-yellow-300 border-yellow-500/40',
    textColor: 'text-yellow-400',
    grupo: 'Interior'
  }
};

export const MUNICIPIO_TO_COMANDO_MAP: Record<string, string> = {
  // CPA/M-12 (8 municípios)
  'biritiba mirim': 'CPA/M-12',
  'ferraz de vasconcelos': 'CPA/M-12',
  'guararema': 'CPA/M-12',
  'itaquaquecetuba': 'CPA/M-12',
  'mogi das cruzes': 'CPA/M-12',
  'poa': 'CPA/M-12',
  'salesopolis': 'CPA/M-12',
  'suzano': 'CPA/M-12',

  // CPA/M-6 (7 municípios)
  'diadema': 'CPA/M-6',
  'maua': 'CPA/M-6',
  'ribeirao pires': 'CPA/M-6',
  'rio grande da serra': 'CPA/M-6',
  'santo andre': 'CPA/M-6',
  'sao bernardo do campo': 'CPA/M-6',
  'sao caetano do sul': 'CPA/M-6',

  // CPA/M-7 (8 municípios)
  'aruja': 'CPA/M-7',
  'caieiras': 'CPA/M-7',
  'cajamar': 'CPA/M-7',
  'francisco morato': 'CPA/M-7',
  'franco da rocha': 'CPA/M-7',
  'guarulhos': 'CPA/M-7',
  'mairipora': 'CPA/M-7',
  'santa isabel': 'CPA/M-7',

  // CPA/M-8 (15 municípios)
  'barueri': 'CPA/M-8',
  'carapicuiba': 'CPA/M-8',
  'cotia': 'CPA/M-8',
  'embu das artes': 'CPA/M-8',
  'embu guacu': 'CPA/M-8',
  'itapecerica da serra': 'CPA/M-8',
  'itapevi': 'CPA/M-8',
  'jandira': 'CPA/M-8',
  'juquitiba': 'CPA/M-8',
  'osasco': 'CPA/M-8',
  'pirapora do bom jesus': 'CPA/M-8',
  'santana de parnaiba': 'CPA/M-8',
  'sao lourenco da serra': 'CPA/M-8',
  'taboao da serra': 'CPA/M-8',
  'vargem grande paulista': 'CPA/M-8',

  // CPC (1 municípios)
  'sao paulo': 'CPC',

  // CPI-1 (39 municípios)
  'aparecida': 'CPI-1',
  'arapei': 'CPI-1',
  'areias': 'CPI-1',
  'bananal': 'CPI-1',
  'cacapava': 'CPI-1',
  'cachoeira paulista': 'CPI-1',
  'campos do jordao': 'CPI-1',
  'canas': 'CPI-1',
  'caraguatatuba': 'CPI-1',
  'cruzeiro': 'CPI-1',
  'cunha': 'CPI-1',
  'guaratingueta': 'CPI-1',
  'igarata': 'CPI-1',
  'ilhabela': 'CPI-1',
  'jacarei': 'CPI-1',
  'jambeiro': 'CPI-1',
  'lagoinha': 'CPI-1',
  'lavrinhas': 'CPI-1',
  'lorena': 'CPI-1',
  'monteiro lobato': 'CPI-1',
  'natividade da serra': 'CPI-1',
  'paraibuna': 'CPI-1',
  'pindamonhangaba': 'CPI-1',
  'piquete': 'CPI-1',
  'potim': 'CPI-1',
  'queluz': 'CPI-1',
  'redencao da serra': 'CPI-1',
  'roseira': 'CPI-1',
  'santa branca': 'CPI-1',
  'santo antonio do pinhal': 'CPI-1',
  'sao bento do sapucai': 'CPI-1',
  'sao jose do barreiro': 'CPI-1',
  'sao jose dos campos': 'CPI-1',
  'sao luiz do paraitinga': 'CPI-1',
  'sao sebastiao': 'CPI-1',
  'silveiras': 'CPI-1',
  'taubate': 'CPI-1',
  'tremembe': 'CPI-1',
  'ubatuba': 'CPI-1',

  // CPI-10 (43 municípios)
  'alto alegre': 'CPI-10',
  'andradina': 'CPI-10',
  'aracatuba': 'CPI-10',
  'auriflama': 'CPI-10',
  'avanhandava': 'CPI-10',
  'barbosa': 'CPI-10',
  'bento de abreu': 'CPI-10',
  'bilac': 'CPI-10',
  'birigui': 'CPI-10',
  'brauna': 'CPI-10',
  'brejo alegre': 'CPI-10',
  'buritama': 'CPI-10',
  'castilho': 'CPI-10',
  'clementina': 'CPI-10',
  'coroados': 'CPI-10',
  'gabriel monteiro': 'CPI-10',
  'gastao vidigal': 'CPI-10',
  'general salgado': 'CPI-10',
  'glicerio': 'CPI-10',
  'guaracai': 'CPI-10',
  'guararapes': 'CPI-10',
  'guzolandia': 'CPI-10',
  'ilha solteira': 'CPI-10',
  'itapura': 'CPI-10',
  'lavinia': 'CPI-10',
  'lourdes': 'CPI-10',
  'luiziania': 'CPI-10',
  'mirandopolis': 'CPI-10',
  'murutinga do sul': 'CPI-10',
  'nova castilho': 'CPI-10',
  'nova independencia': 'CPI-10',
  'nova luzitania': 'CPI-10',
  'penapolis': 'CPI-10',
  'pereira barreto': 'CPI-10',
  'piacatu': 'CPI-10',
  'rubiacea': 'CPI-10',
  'santo antonio do aracangua': 'CPI-10',
  'santopolis do aguapei': 'CPI-10',
  'sao joao de iracema': 'CPI-10',
  'sud mennucci': 'CPI-10',
  'suzanapolis': 'CPI-10',
  'turiuba': 'CPI-10',
  'valparaiso': 'CPI-10',

  // CPI-2 (38 municípios)
  'aguas de lindoia': 'CPI-2',
  'amparo': 'CPI-2',
  'atibaia': 'CPI-2',
  'bom jesus dos perdoes': 'CPI-2',
  'braganca paulista': 'CPI-2',
  'cabreuva': 'CPI-2',
  'campinas': 'CPI-2',
  'campo limpo paulista': 'CPI-2',
  'estiva gerbi': 'CPI-2',
  'holambra': 'CPI-2',
  'indaiatuba': 'CPI-2',
  'itapira': 'CPI-2',
  'itatiba': 'CPI-2',
  'itupeva': 'CPI-2',
  'jaguariuna': 'CPI-2',
  'jarinu': 'CPI-2',
  'joanopolis': 'CPI-2',
  'jundiai': 'CPI-2',
  'lindoia': 'CPI-2',
  'louveira': 'CPI-2',
  'mogi guacu': 'CPI-2',
  'mogi mirim': 'CPI-2',
  'monte alegre do sul': 'CPI-2',
  'morungaba': 'CPI-2',
  'nazare paulista': 'CPI-2',
  'paulinia': 'CPI-2',
  'pedra bela': 'CPI-2',
  'pedreira': 'CPI-2',
  'pinhalzinho': 'CPI-2',
  'piracaia': 'CPI-2',
  'santo antonio de posse': 'CPI-2',
  'serra negra': 'CPI-2',
  'socorro': 'CPI-2',
  'tuiuti': 'CPI-2',
  'valinhos': 'CPI-2',
  'vargem': 'CPI-2',
  'varzea paulista': 'CPI-2',
  'vinhedo': 'CPI-2',

  // CPI-3 (92 municípios)
  'altair': 'CPI-3',
  'altinopolis': 'CPI-3',
  'americo brasiliense': 'CPI-3',
  'aramina': 'CPI-3',
  'araraquara': 'CPI-3',
  'barretos': 'CPI-3',
  'barrinha': 'CPI-3',
  'batatais': 'CPI-3',
  'bebedouro': 'CPI-3',
  'boa esperanca do sul': 'CPI-3',
  'borborema': 'CPI-3',
  'brodowski': 'CPI-3',
  'buritizal': 'CPI-3',
  'cajobi': 'CPI-3',
  'cajuru': 'CPI-3',
  'candido rodrigues': 'CPI-3',
  'cassia dos coqueiros': 'CPI-3',
  'colina': 'CPI-3',
  'colombia': 'CPI-3',
  'cravinhos': 'CPI-3',
  'cristais paulista': 'CPI-3',
  'descalvado': 'CPI-3',
  'dobrada': 'CPI-3',
  'dourado': 'CPI-3',
  'dumont': 'CPI-3',
  'embauba': 'CPI-3',
  'fernando prestes': 'CPI-3',
  'franca': 'CPI-3',
  'guaira': 'CPI-3',
  'guara': 'CPI-3',
  'guaraci': 'CPI-3',
  'guariba': 'CPI-3',
  'guatapara': 'CPI-3',
  'ibate': 'CPI-3',
  'ibitinga': 'CPI-3',
  'igarapava': 'CPI-3',
  'ipua': 'CPI-3',
  'itapolis': 'CPI-3',
  'itirapua': 'CPI-3',
  'ituverava': 'CPI-3',
  'jaborandi': 'CPI-3',
  'jaboticabal': 'CPI-3',
  'jardinopolis': 'CPI-3',
  'jeriquara': 'CPI-3',
  'luis antonio': 'CPI-3',
  'luiz antonio': 'CPI-3',
  'luisantonio': 'CPI-3',
  'luizantonio': 'CPI-3',
  'matao': 'CPI-3',
  'miguelopolis': 'CPI-3',
  'monte alto': 'CPI-3',
  'monte azul paulista': 'CPI-3',
  'morro agudo': 'CPI-3',
  'motuca': 'CPI-3',
  'nova europa': 'CPI-3',
  'nuporanga': 'CPI-3',
  'olimpia': 'CPI-3',
  'orlandia': 'CPI-3',
  'patrocinio paulista': 'CPI-3',
  'pedregulho': 'CPI-3',
  'pirangi': 'CPI-3',
  'pitangueiras': 'CPI-3',
  'pontal': 'CPI-3',
  'porto ferreira': 'CPI-3',
  'pradopolis': 'CPI-3',
  'restinga': 'CPI-3',
  'ribeirao bonito': 'CPI-3',
  'ribeirao corrente': 'CPI-3',
  'ribeirao preto': 'CPI-3',
  'rifaina': 'CPI-3',
  'rincao': 'CPI-3',
  'sales oliveira': 'CPI-3',
  'santa cruz da esperanca': 'CPI-3',
  'santa ernestina': 'CPI-3',
  'santa lucia': 'CPI-3',
  'santa rita do passa quatro': 'CPI-3',
  'santa rosa de viterbo': 'CPI-3',
  'santo antonio da alegria': 'CPI-3',
  'sao carlos': 'CPI-3',
  'sao joaquim da barra': 'CPI-3',
  'sao jose da bela vista': 'CPI-3',
  'sao simao': 'CPI-3',
  'serra azul': 'CPI-3',
  'serrana': 'CPI-3',
  'sertaozinho': 'CPI-3',
  'severinia': 'CPI-3',
  'tabatinga': 'CPI-3',
  'taiacu': 'CPI-3',
  'taiuva': 'CPI-3',
  'taquaral': 'CPI-3',
  'taquaritinga': 'CPI-3',
  'terra roxa': 'CPI-3',
  'trabiju': 'CPI-3',
  'viradouro': 'CPI-3',
  'vista alegre do alto': 'CPI-3',

  // CPI-4 (76 municípios)
  'agudos': 'CPI-4',
  'alvaro de carvalho': 'CPI-4',
  'alvinlandia': 'CPI-4',
  'arco iris': 'CPI-4',
  'arealva': 'CPI-4',
  'avai': 'CPI-4',
  'balbinos': 'CPI-4',
  'bariri': 'CPI-4',
  'barra bonita': 'CPI-4',
  'bastos': 'CPI-4',
  'bauru': 'CPI-4',
  'bernardino de campos': 'CPI-4',
  'bocaina': 'CPI-4',
  'bora': 'CPI-4',
  'boraceia': 'CPI-4',
  'borebi': 'CPI-4',
  'cabralia paulista': 'CPI-4',
  'cafelandia': 'CPI-4',
  'canitar': 'CPI-4',
  'chavantes': 'CPI-4',
  'dois corregos': 'CPI-4',
  'duartina': 'CPI-4',
  'echapora': 'CPI-4',
  'espirito santo do turvo': 'CPI-4',
  'fernao': 'CPI-4',
  'galia': 'CPI-4',
  'garca': 'CPI-4',
  'getulina': 'CPI-4',
  'guaicara': 'CPI-4',
  'guaimbe': 'CPI-4',
  'guaranta': 'CPI-4',
  'herculandia': 'CPI-4',
  'iacanga': 'CPI-4',
  'iacri': 'CPI-4',
  'igaracu do tiete': 'CPI-4',
  'ipaussu': 'CPI-4',
  'itaju': 'CPI-4',
  'itapui': 'CPI-4',
  'jau': 'CPI-4',
  'julio mesquita': 'CPI-4',
  'lencois paulista': 'CPI-4',
  'lins': 'CPI-4',
  'lucianopolis': 'CPI-4',
  'lupercio': 'CPI-4',
  'macatuba': 'CPI-4',
  'marilia': 'CPI-4',
  'mineiros do tiete': 'CPI-4',
  'ocaucu': 'CPI-4',
  'oleo': 'CPI-4',
  'oriente': 'CPI-4',
  'oscar bressane': 'CPI-4',
  'ourinhos': 'CPI-4',
  'parapua': 'CPI-4',
  'paulistania': 'CPI-4',
  'pederneiras': 'CPI-4',
  'pirajui': 'CPI-4',
  'piratininga': 'CPI-4',
  'pompeia': 'CPI-4',
  'pongai': 'CPI-4',
  'presidente alves': 'CPI-4',
  'promissao': 'CPI-4',
  'quata': 'CPI-4',
  'queiroz': 'CPI-4',
  'quintana': 'CPI-4',
  'reginopolis': 'CPI-4',
  'ribeirao do sul': 'CPI-4',
  'rinopolis': 'CPI-4',
  'sabino': 'CPI-4',
  'salto grande': 'CPI-4',
  'santa cruz do rio pardo': 'CPI-4',
  'sao pedro do turvo': 'CPI-4',
  'timburi': 'CPI-4',
  'tupa': 'CPI-4',
  'ubirajara': 'CPI-4',
  'uru': 'CPI-4',
  'vera cruz': 'CPI-4',

  // CPI-5 (96 municípios)
  'adolfo': 'CPI-5',
  'alvares florence': 'CPI-5',
  'americo de campos': 'CPI-5',
  'aparecida d\'oeste': 'CPI-5',
  'ariranha': 'CPI-5',
  'aspasia': 'CPI-5',
  'bady bassitt': 'CPI-5',
  'balsamo': 'CPI-5',
  'cardoso': 'CPI-5',
  'catanduva': 'CPI-5',
  'catigua': 'CPI-5',
  'cedral': 'CPI-5',
  'cosmorama': 'CPI-5',
  'dirce reis': 'CPI-5',
  'dolcinopolis': 'CPI-5',
  'elisiario': 'CPI-5',
  'estrela d\'oeste': 'CPI-5',
  'fernandopolis': 'CPI-5',
  'floreal': 'CPI-5',
  'guapiacu': 'CPI-5',
  'guarani d\'oeste': 'CPI-5',
  'ibira': 'CPI-5',
  'icem': 'CPI-5',
  'indiapora': 'CPI-5',
  'ipigua': 'CPI-5',
  'irapua': 'CPI-5',
  'itajobi': 'CPI-5',
  'jaci': 'CPI-5',
  'jales': 'CPI-5',
  'jose bonifacio': 'CPI-5',
  'macaubal': 'CPI-5',
  'macedonia': 'CPI-5',
  'magda': 'CPI-5',
  'marapoama': 'CPI-5',
  'marinopolis': 'CPI-5',
  'mendonca': 'CPI-5',
  'meridiano': 'CPI-5',
  'mesopolis': 'CPI-5',
  'mira estrela': 'CPI-5',
  'mirassol': 'CPI-5',
  'mirassolandia': 'CPI-5',
  'moncoes': 'CPI-5',
  'monte aprazivel': 'CPI-5',
  'neves paulista': 'CPI-5',
  'nhandeara': 'CPI-5',
  'nipoa': 'CPI-5',
  'nova alianca': 'CPI-5',
  'nova canaa paulista': 'CPI-5',
  'nova granada': 'CPI-5',
  'novais': 'CPI-5',
  'novo horizonte': 'CPI-5',
  'onda verde': 'CPI-5',
  'orindiuva': 'CPI-5',
  'ouroeste': 'CPI-5',
  'palestina': 'CPI-5',
  'palmares paulista': 'CPI-5',
  'palmeira d\'oeste': 'CPI-5',
  'paraiso': 'CPI-5',
  'paranapua': 'CPI-5',
  'parisi': 'CPI-5',
  'paulo de faria': 'CPI-5',
  'pedranopolis': 'CPI-5',
  'pindorama': 'CPI-5',
  'planalto': 'CPI-5',
  'poloni': 'CPI-5',
  'pontalinda': 'CPI-5',
  'pontes gestal': 'CPI-5',
  'populina': 'CPI-5',
  'potirendaba': 'CPI-5',
  'riolandia': 'CPI-5',
  'rubineia': 'CPI-5',
  'sales': 'CPI-5',
  'santa adelia': 'CPI-5',
  'santa albertina': 'CPI-5',
  'santa clara d\'oeste': 'CPI-5',
  'santa fe do sul': 'CPI-5',
  'santa rita d\'oeste': 'CPI-5',
  'santa salete': 'CPI-5',
  'santana da ponte pensa': 'CPI-5',
  'sao francisco': 'CPI-5',
  'sao joao das duas pontes': 'CPI-5',
  'sao jose do rio preto': 'CPI-5',
  'sebastianopolis do sul': 'CPI-5',
  'tabapua': 'CPI-5',
  'tanabi': 'CPI-5',
  'tres fronteiras': 'CPI-5',
  'turmalina': 'CPI-5',
  'ubarana': 'CPI-5',
  'uchoa': 'CPI-5',
  'uniao paulista': 'CPI-5',
  'urania': 'CPI-5',
  'urupes': 'CPI-5',
  'valentim gentil': 'CPI-5',
  'vitoria brasil': 'CPI-5',
  'votuporanga': 'CPI-5',
  'zacarias': 'CPI-5',

  // CPI-6 (24 municípios)
  'barra do turvo': 'CPI-6',
  'bertioga': 'CPI-6',
  'cajati': 'CPI-6',
  'cananeia': 'CPI-6',
  'cubatao': 'CPI-6',
  'eldorado': 'CPI-6',
  'guaruja': 'CPI-6',
  'iguape': 'CPI-6',
  'ilha comprida': 'CPI-6',
  'iporanga': 'CPI-6',
  'itanhaem': 'CPI-6',
  'itariri': 'CPI-6',
  'jacupiranga': 'CPI-6',
  'juquia': 'CPI-6',
  'miracatu': 'CPI-6',
  'mongagua': 'CPI-6',
  'pariquera acu': 'CPI-6',
  'pedro de toledo': 'CPI-6',
  'peruibe': 'CPI-6',
  'praia grande': 'CPI-6',
  'registro': 'CPI-6',
  'santos': 'CPI-6',
  'sao vicente': 'CPI-6',
  'sete barras': 'CPI-6',

  // CPI-7 (78 municípios)
  'aguas de santa barbara': 'CPI-7',
  'alambari': 'CPI-7',
  'aluminio': 'CPI-7',
  'angatuba': 'CPI-7',
  'anhembi': 'CPI-7',
  'apiai': 'CPI-7',
  'aracariguama': 'CPI-7',
  'aracoiaba da serra': 'CPI-7',
  'arandu': 'CPI-7',
  'areiopolis': 'CPI-7',
  'avare': 'CPI-7',
  'barao de antonina': 'CPI-7',
  'barra do chapeu': 'CPI-7',
  'bofete': 'CPI-7',
  'boituva': 'CPI-7',
  'bom sucesso de itarare': 'CPI-7',
  'botucatu': 'CPI-7',
  'buri': 'CPI-7',
  'campina do monte alegre': 'CPI-7',
  'capao bonito': 'CPI-7',
  'capela do alto': 'CPI-7',
  'cerqueira cesar': 'CPI-7',
  'cerquilho': 'CPI-7',
  'cesario lange': 'CPI-7',
  'conchas': 'CPI-7',
  'coronel macedo': 'CPI-7',
  'fartura': 'CPI-7',
  'guapiara': 'CPI-7',
  'guarei': 'CPI-7',
  'iaras': 'CPI-7',
  'ibiuna': 'CPI-7',
  'ipero': 'CPI-7',
  'itabera': 'CPI-7',
  'itai': 'CPI-7',
  'itaoca': 'CPI-7',
  'itapetininga': 'CPI-7',
  'itapeva': 'CPI-7',
  'itapirapua paulista': 'CPI-7',
  'itaporanga': 'CPI-7',
  'itarare': 'CPI-7',
  'itatinga': 'CPI-7',
  'itu': 'CPI-7',
  'jumirim': 'CPI-7',
  'laranjal paulista': 'CPI-7',
  'mairinque': 'CPI-7',
  'manduri': 'CPI-7',
  'nova campina': 'CPI-7',
  'paranapanema': 'CPI-7',
  'pardinho': 'CPI-7',
  'pereiras': 'CPI-7',
  'piedade': 'CPI-7',
  'pilar do sul': 'CPI-7',
  'piraju': 'CPI-7',
  'porangaba': 'CPI-7',
  'porto feliz': 'CPI-7',
  'pratania': 'CPI-7',
  'quadra': 'CPI-7',
  'ribeira': 'CPI-7',
  'ribeirao branco': 'CPI-7',
  'ribeirao grande': 'CPI-7',
  'riversul': 'CPI-7',
  'salto': 'CPI-7',
  'salto de pirapora': 'CPI-7',
  'sao manuel': 'CPI-7',
  'sao miguel arcanjo': 'CPI-7',
  'sao roque': 'CPI-7',
  'sarapui': 'CPI-7',
  'sarutaia': 'CPI-7',
  'sorocaba': 'CPI-7',
  'taguai': 'CPI-7',
  'tapirai': 'CPI-7',
  'taquarituba': 'CPI-7',
  'taquarivai': 'CPI-7',
  'tatui': 'CPI-7',
  'tejupa': 'CPI-7',
  'tiete': 'CPI-7',
  'torre de pedra': 'CPI-7',
  'votorantim': 'CPI-7',

  // CPI-8 (67 municípios)
  'adamantina': 'CPI-8',
  'alfredo marcondes': 'CPI-8',
  'alvares machado': 'CPI-8',
  'anhumas': 'CPI-8',
  'assis': 'CPI-8',
  'caiabu': 'CPI-8',
  'caiua': 'CPI-8',
  'campos novos paulista': 'CPI-8',
  'candido mota': 'CPI-8',
  'cruzalia': 'CPI-8',
  'dracena': 'CPI-8',
  'emilianopolis': 'CPI-8',
  'estrela do norte': 'CPI-8',
  'euclides da cunha paulista': 'CPI-8',
  'flora rica': 'CPI-8',
  'florida paulista': 'CPI-8',
  'florinea': 'CPI-8',
  'ibirarema': 'CPI-8',
  'iepe': 'CPI-8',
  'indiana': 'CPI-8',
  'inubia paulista': 'CPI-8',
  'irapuru': 'CPI-8',
  'joao ramalho': 'CPI-8',
  'junqueiropolis': 'CPI-8',
  'lucelia': 'CPI-8',
  'lutecia': 'CPI-8',
  'maraba paulista': 'CPI-8',
  'maracai': 'CPI-8',
  'mariapolis': 'CPI-8',
  'martinopolis': 'CPI-8',
  'mirante do paranapanema': 'CPI-8',
  'monte castelo': 'CPI-8',
  'nantes': 'CPI-8',
  'narandiba': 'CPI-8',
  'nova guataporanga': 'CPI-8',
  'osvaldo cruz': 'CPI-8',
  'ouro verde': 'CPI-8',
  'pacaembu': 'CPI-8',
  'palmital': 'CPI-8',
  'panorama': 'CPI-8',
  'paraguacu paulista': 'CPI-8',
  'pauliceia': 'CPI-8',
  'pedrinhas paulista': 'CPI-8',
  'piquerobi': 'CPI-8',
  'pirapozinho': 'CPI-8',
  'platina': 'CPI-8',
  'pracinha': 'CPI-8',
  'presidente bernardes': 'CPI-8',
  'presidente epitacio': 'CPI-8',
  'presidente prudente': 'CPI-8',
  'presidente venceslau': 'CPI-8',
  'rancharia': 'CPI-8',
  'regente feijo': 'CPI-8',
  'ribeirao dos indios': 'CPI-8',
  'rosana': 'CPI-8',
  'sagres': 'CPI-8',
  'salmourao': 'CPI-8',
  'sandovalina': 'CPI-8',
  'santa mercedes': 'CPI-8',
  'santo anastacio': 'CPI-8',
  'santo expedito': 'CPI-8',
  'sao joao do pau d\'alho': 'CPI-8',
  'taciba': 'CPI-8',
  'tarabai': 'CPI-8',
  'taruma': 'CPI-8',
  'teodoro sampaio': 'CPI-8',
  'tupi paulista': 'CPI-8',

  // CPI-9 (52 municípios)
  'aguai': 'CPI-9',
  'aguas da prata': 'CPI-9',
  'aguas de sao pedro': 'CPI-9',
  'americana': 'CPI-9',
  'analandia': 'CPI-9',
  'araras': 'CPI-9',
  'artur nogueira': 'CPI-9',
  'brotas': 'CPI-9',
  'caconde': 'CPI-9',
  'capivari': 'CPI-9',
  'casa branca': 'CPI-9',
  'charqueada': 'CPI-9',
  'conchal': 'CPI-9',
  'cordeiropolis': 'CPI-9',
  'corumbatai': 'CPI-9',
  'cosmopolis': 'CPI-9',
  'divinolandia': 'CPI-9',
  'elias fausto': 'CPI-9',
  'engenheiro coelho': 'CPI-9',
  'espirito santo do pinhal': 'CPI-9',
  'hortolandia': 'CPI-9',
  'ipeuna': 'CPI-9',
  'iracemapolis': 'CPI-9',
  'itirapina': 'CPI-9',
  'itobi': 'CPI-9',
  'leme': 'CPI-9',
  'limeira': 'CPI-9',
  'mococa': 'CPI-9',
  'mombuca': 'CPI-9',
  'monte mor': 'CPI-9',
  'nova odessa': 'CPI-9',
  'piracicaba': 'CPI-9',
  'pirassununga': 'CPI-9',
  'rafard': 'CPI-9',
  'rio claro': 'CPI-9',
  'rio das pedras': 'CPI-9',
  'saltinho': 'CPI-9',
  'santa barbara d\'oeste': 'CPI-9',
  'santa cruz da conceicao': 'CPI-9',
  'santa cruz das palmeiras': 'CPI-9',
  'santa gertrudes': 'CPI-9',
  'santa maria da serra': 'CPI-9',
  'santo antonio do jardim': 'CPI-9',
  'sao joao da boa vista': 'CPI-9',
  'sao jose do rio pardo': 'CPI-9',
  'sao pedro': 'CPI-9',
  'sao sebastiao da grama': 'CPI-9',
  'sumare': 'CPI-9',
  'tambau': 'CPI-9',
  'tapiratiba': 'CPI-9',
  'torrinha': 'CPI-9',
  'vargem grande do sul': 'CPI-9',

};

// Fast lookup map from IBGE code (7 digits or 6 digits) directly to Command / CPA ID
export const IBGE_TO_COMANDO_MAP: Record<string, string> = {
  // CPA/M-12
  '3506607': 'CPA/M-12', '350660': 'CPA/M-12', // Biritiba Mirim
  '3515707': 'CPA/M-12', '351570': 'CPA/M-12', // Ferraz de Vasconcelos
  '3518305': 'CPA/M-12', '351830': 'CPA/M-12', // Guararema
  '3523107': 'CPA/M-12', '352310': 'CPA/M-12', // Itaquaquecetuba
  '3530607': 'CPA/M-12', '353060': 'CPA/M-12', // Mogi das Cruzes
  '3539806': 'CPA/M-12', '353980': 'CPA/M-12', // Poá
  '3545001': 'CPA/M-12', '354500': 'CPA/M-12', // Salesópolis
  '3552502': 'CPA/M-12', '355250': 'CPA/M-12', // Suzano

  // CPA/M-6
  '3513801': 'CPA/M-6', '351380': 'CPA/M-6', // Diadema
  '3529401': 'CPA/M-6', '352940': 'CPA/M-6', // Mauá
  '3543303': 'CPA/M-6', '354330': 'CPA/M-6', // Ribeirão Pires
  '3544103': 'CPA/M-6', '354410': 'CPA/M-6', // Rio Grande da Serra
  '3547809': 'CPA/M-6', '354780': 'CPA/M-6', // Santo André
  '3548708': 'CPA/M-6', '354870': 'CPA/M-6', // São Bernardo do Campo
  '3548807': 'CPA/M-6', '354880': 'CPA/M-6', // São Caetano do Sul

  // CPA/M-7
  '3503901': 'CPA/M-7', '350390': 'CPA/M-7', // Arujá
  '3509007': 'CPA/M-7', '350900': 'CPA/M-7', // Caieiras
  '3509205': 'CPA/M-7', '350920': 'CPA/M-7', // Cajamar
  '3516309': 'CPA/M-7', '351630': 'CPA/M-7', // Francisco Morato
  '3516408': 'CPA/M-7', '351640': 'CPA/M-7', // Franco da Rocha
  '3518800': 'CPA/M-7', '351880': 'CPA/M-7', // Guarulhos
  '3528502': 'CPA/M-7', '352850': 'CPA/M-7', // Mairiporã
  '3546801': 'CPA/M-7', '354680': 'CPA/M-7', // Santa Isabel

  // CPA/M-8
  '3505708': 'CPA/M-8', '350570': 'CPA/M-8', // Barueri
  '3510609': 'CPA/M-8', '351060': 'CPA/M-8', // Carapicuíba
  '3513009': 'CPA/M-8', '351300': 'CPA/M-8', // Cotia
  '3515004': 'CPA/M-8', '351500': 'CPA/M-8', // Embu das Artes
  '3515103': 'CPA/M-8', '351510': 'CPA/M-8', // Embu-Guaçu
  '3522208': 'CPA/M-8', '352220': 'CPA/M-8', // Itapecerica da Serra
  '3522505': 'CPA/M-8', '352250': 'CPA/M-8', // Itapevi
  '3525003': 'CPA/M-8', '352500': 'CPA/M-8', // Jandira
  '3526209': 'CPA/M-8', '352620': 'CPA/M-8', // Juquitiba
  '3534401': 'CPA/M-8', '353440': 'CPA/M-8', // Osasco
  '3539103': 'CPA/M-8', '353910': 'CPA/M-8', // Pirapora do Bom Jesus
  '3547304': 'CPA/M-8', '354730': 'CPA/M-8', // Santana de Parnaíba
  '3549953': 'CPA/M-8', '354995': 'CPA/M-8', // São Lourenço da Serra
  '3552809': 'CPA/M-8', '355280': 'CPA/M-8', // Taboão da Serra
  '3556453': 'CPA/M-8', '355645': 'CPA/M-8', // Vargem Grande Paulista

  // CPC
  '3550308': 'CPC', '355030': 'CPC', // São Paulo

  // CPI-1
  '3502507': 'CPI-1', '350250': 'CPI-1', // Aparecida
  '3503158': 'CPI-1', '350315': 'CPI-1', // Arapeí
  '3503505': 'CPI-1', '350350': 'CPI-1', // Areias
  '3504909': 'CPI-1', '350490': 'CPI-1', // Bananal
  '3508504': 'CPI-1', '350850': 'CPI-1', // Caçapava
  '3508603': 'CPI-1', '350860': 'CPI-1', // Cachoeira Paulista
  '3509700': 'CPI-1', '350970': 'CPI-1', // Campos do Jordão
  '3509957': 'CPI-1', '350995': 'CPI-1', // Canas
  '3510500': 'CPI-1', '351050': 'CPI-1', // Caraguatatuba
  '3513405': 'CPI-1', '351340': 'CPI-1', // Cruzeiro
  '3513603': 'CPI-1', '351360': 'CPI-1', // Cunha
  '3518404': 'CPI-1', '351840': 'CPI-1', // Guaratinguetá
  '3520202': 'CPI-1', '352020': 'CPI-1', // Igaratá
  '3520400': 'CPI-1', '352040': 'CPI-1', // Ilhabela
  '3524402': 'CPI-1', '352440': 'CPI-1', // Jacareí
  '3524907': 'CPI-1', '352490': 'CPI-1', // Jambeiro
  '3526308': 'CPI-1', '352630': 'CPI-1', // Lagoinha
  '3526605': 'CPI-1', '352660': 'CPI-1', // Lavrinhas
  '3527207': 'CPI-1', '352720': 'CPI-1', // Lorena
  '3531704': 'CPI-1', '353170': 'CPI-1', // Monteiro Lobato
  '3532306': 'CPI-1', '353230': 'CPI-1', // Natividade da Serra
  '3535606': 'CPI-1', '353560': 'CPI-1', // Paraibuna
  '3538006': 'CPI-1', '353800': 'CPI-1', // Pindamonhangaba
  '3538501': 'CPI-1', '353850': 'CPI-1', // Piquete
  '3540754': 'CPI-1', '354075': 'CPI-1', // Potim
  '3541901': 'CPI-1', '354190': 'CPI-1', // Queluz
  '3542305': 'CPI-1', '354230': 'CPI-1', // Redenção da Serra
  '3544301': 'CPI-1', '354430': 'CPI-1', // Roseira
  '3546009': 'CPI-1', '354600': 'CPI-1', // Santa Branca
  '3548203': 'CPI-1', '354820': 'CPI-1', // Santo Antônio do Pinhal
  '3548609': 'CPI-1', '354860': 'CPI-1', // São Bento do Sapucaí
  '3549607': 'CPI-1', '354960': 'CPI-1', // São José do Barreiro
  '3549904': 'CPI-1', '354990': 'CPI-1', // São José dos Campos
  '3550001': 'CPI-1', '355000': 'CPI-1', // São Luiz do Paraitinga
  '3550704': 'CPI-1', '355070': 'CPI-1', // São Sebastião
  '3552007': 'CPI-1', '355200': 'CPI-1', // Silveiras
  '3554102': 'CPI-1', '355410': 'CPI-1', // Taubaté
  '3554805': 'CPI-1', '355480': 'CPI-1', // Tremembé
  '3555406': 'CPI-1', '355540': 'CPI-1', // Ubatuba

  // CPI-10
  '3501103': 'CPI-10', '350110': 'CPI-10', // Alto Alegre
  '3502101': 'CPI-10', '350210': 'CPI-10', // Andradina
  '3502804': 'CPI-10', '350280': 'CPI-10', // Araçatuba
  '3504206': 'CPI-10', '350420': 'CPI-10', // Auriflama
  '3504404': 'CPI-10', '350440': 'CPI-10', // Avanhandava
  '3505104': 'CPI-10', '350510': 'CPI-10', // Barbosa
  '3506201': 'CPI-10', '350620': 'CPI-10', // Bento de Abreu
  '3506409': 'CPI-10', '350640': 'CPI-10', // Bilac
  '3506508': 'CPI-10', '350650': 'CPI-10', // Birigui
  '3507704': 'CPI-10', '350770': 'CPI-10', // Braúna
  '3507753': 'CPI-10', '350775': 'CPI-10', // Brejo Alegre
  '3508108': 'CPI-10', '350810': 'CPI-10', // Buritama
  '3511003': 'CPI-10', '351100': 'CPI-10', // Castilho
  '3511904': 'CPI-10', '351190': 'CPI-10', // Clementina
  '3512506': 'CPI-10', '351250': 'CPI-10', // Coroados
  '3516507': 'CPI-10', '351650': 'CPI-10', // Gabriel Monteiro
  '3516804': 'CPI-10', '351680': 'CPI-10', // Gastão Vidigal
  '3516903': 'CPI-10', '351690': 'CPI-10', // General Salgado
  '3517109': 'CPI-10', '351710': 'CPI-10', // Glicério
  '3517802': 'CPI-10', '351780': 'CPI-10', // Guaraçaí
  '3518206': 'CPI-10', '351820': 'CPI-10', // Guararapes
  '3518909': 'CPI-10', '351890': 'CPI-10', // Guzolândia
  '3520442': 'CPI-10', '352044': 'CPI-10', // Ilha Solteira
  '3523008': 'CPI-10', '352300': 'CPI-10', // Itapura
  '3526506': 'CPI-10', '352650': 'CPI-10', // Lavínia
  '3527256': 'CPI-10', '352725': 'CPI-10', // Lourdes
  '3527702': 'CPI-10', '352770': 'CPI-10', // Luiziânia
  '3530102': 'CPI-10', '353010': 'CPI-10', // Mirandópolis
  '3532108': 'CPI-10', '353210': 'CPI-10', // Murutinga do Sul
  '3532868': 'CPI-10', '353286': 'CPI-10', // Nova Castilho
  '3533205': 'CPI-10', '353320': 'CPI-10', // Nova Independência
  '3533304': 'CPI-10', '353330': 'CPI-10', // Nova Luzitânia
  '3537305': 'CPI-10', '353730': 'CPI-10', // Penápolis
  '3537404': 'CPI-10', '353740': 'CPI-10', // Pereira Barreto
  '3537701': 'CPI-10', '353770': 'CPI-10', // Piacatu
  '3544400': 'CPI-10', '354440': 'CPI-10', // Rubiácea
  '3548054': 'CPI-10', '354805': 'CPI-10', // Santo Antônio do Aracanguá
  '3548401': 'CPI-10', '354840': 'CPI-10', // Santópolis do Aguapeí
  '3549250': 'CPI-10', '354925': 'CPI-10', // São João de Iracema
  '3552304': 'CPI-10', '355230': 'CPI-10', // Sud Mennucci
  '3552551': 'CPI-10', '355255': 'CPI-10', // Suzanápolis
  '3555208': 'CPI-10', '355520': 'CPI-10', // Turiúba
  '3556305': 'CPI-10', '355630': 'CPI-10', // Valparaíso

  // CPI-2
  '3500501': 'CPI-2', '350050': 'CPI-2', // Águas de Lindóia
  '3501905': 'CPI-2', '350190': 'CPI-2', // Amparo
  '3504107': 'CPI-2', '350410': 'CPI-2', // Atibaia
  '3507100': 'CPI-2', '350710': 'CPI-2', // Bom Jesus dos Perdões
  '3507605': 'CPI-2', '350760': 'CPI-2', // Bragança Paulista
  '3508405': 'CPI-2', '350840': 'CPI-2', // Cabreúva
  '3509502': 'CPI-2', '350950': 'CPI-2', // Campinas
  '3509601': 'CPI-2', '350960': 'CPI-2', // Campo Limpo Paulista
  '3557303': 'CPI-2', '355730': 'CPI-2', // Estiva Gerbi
  '3519055': 'CPI-2', '351905': 'CPI-2', // Holambra
  '3520509': 'CPI-2', '352050': 'CPI-2', // Indaiatuba
  '3522604': 'CPI-2', '352260': 'CPI-2', // Itapira
  '3523404': 'CPI-2', '352340': 'CPI-2', // Itatiba
  '3524006': 'CPI-2', '352400': 'CPI-2', // Itupeva
  '3524709': 'CPI-2', '352470': 'CPI-2', // Jaguariúna
  '3525201': 'CPI-2', '352520': 'CPI-2', // Jarinu
  '3525508': 'CPI-2', '352550': 'CPI-2', // Joanópolis
  '3525904': 'CPI-2', '352590': 'CPI-2', // Jundiaí
  '3527009': 'CPI-2', '352700': 'CPI-2', // Lindóia
  '3527306': 'CPI-2', '352730': 'CPI-2', // Louveira
  '3530706': 'CPI-2', '353070': 'CPI-2', // Mogi Guaçu
  '3530805': 'CPI-2', '353080': 'CPI-2', // Mogi Mirim
  '3531209': 'CPI-2', '353120': 'CPI-2', // Monte Alegre do Sul
  '3532009': 'CPI-2', '353200': 'CPI-2', // Morungaba
  '3532405': 'CPI-2', '353240': 'CPI-2', // Nazaré Paulista
  '3536505': 'CPI-2', '353650': 'CPI-2', // Paulínia
  '3536802': 'CPI-2', '353680': 'CPI-2', // Pedra Bela
  '3537107': 'CPI-2', '353710': 'CPI-2', // Pedreira
  '3538204': 'CPI-2', '353820': 'CPI-2', // Pinhalzinho
  '3538600': 'CPI-2', '353860': 'CPI-2', // Piracaia
  '3548005': 'CPI-2', '354800': 'CPI-2', // Santo Antônio de Posse
  '3551603': 'CPI-2', '355160': 'CPI-2', // Serra Negra
  '3552106': 'CPI-2', '355210': 'CPI-2', // Socorro
  '3554953': 'CPI-2', '355495': 'CPI-2', // Tuiuti
  '3556206': 'CPI-2', '355620': 'CPI-2', // Valinhos
  '3556354': 'CPI-2', '355635': 'CPI-2', // Vargem
  '3556503': 'CPI-2', '355650': 'CPI-2', // Várzea Paulista
  '3556701': 'CPI-2', '355670': 'CPI-2', // Vinhedo

  // CPI-3
  '3500907': 'CPI-3', '350090': 'CPI-3', // Altair
  '3501004': 'CPI-3', '350100': 'CPI-3', // Altinópolis
  '3501707': 'CPI-3', '350170': 'CPI-3', // Américo Brasiliense
  '3503000': 'CPI-3', '350300': 'CPI-3', // Aramina
  '3503208': 'CPI-3', '350320': 'CPI-3', // Araraquara
  '3505500': 'CPI-3', '350550': 'CPI-3', // Barretos
  '3505609': 'CPI-3', '350560': 'CPI-3', // Barrinha
  '3505906': 'CPI-3', '350590': 'CPI-3', // Batatais
  '3506102': 'CPI-3', '350610': 'CPI-3', // Bebedouro
  '3506706': 'CPI-3', '350670': 'CPI-3', // Boa Esperança do Sul
  '3507407': 'CPI-3', '350740': 'CPI-3', // Borborema
  '3507803': 'CPI-3', '350780': 'CPI-3', // Brodowski
  '3508207': 'CPI-3', '350820': 'CPI-3', // Buritizal
  '3509304': 'CPI-3', '350930': 'CPI-3', // Cajobi
  '3509403': 'CPI-3', '350940': 'CPI-3', // Cajuru
  '3510104': 'CPI-3', '351010': 'CPI-3', // Cândido Rodrigues
  '3510906': 'CPI-3', '351090': 'CPI-3', // Cássia dos Coqueiros
  '3512001': 'CPI-3', '351200': 'CPI-3', // Colina
  '3512100': 'CPI-3', '351210': 'CPI-3', // Colômbia
  '3513108': 'CPI-3', '351310': 'CPI-3', // Cravinhos
  '3513207': 'CPI-3', '351320': 'CPI-3', // Cristais Paulista
  '3513702': 'CPI-3', '351370': 'CPI-3', // Descalvado
  '3514007': 'CPI-3', '351400': 'CPI-3', // Dobrada
  '3514304': 'CPI-3', '351430': 'CPI-3', // Dourado
  '3514601': 'CPI-3', '351460': 'CPI-3', // Dumont
  '3514957': 'CPI-3', '351495': 'CPI-3', // Embaúba
  '3515608': 'CPI-3', '351560': 'CPI-3', // Fernando Prestes
  '3516200': 'CPI-3', '351620': 'CPI-3', // Franca
  '3517406': 'CPI-3', '351740': 'CPI-3', // Guaíra
  '3517703': 'CPI-3', '351770': 'CPI-3', // Guará
  '3517901': 'CPI-3', '351790': 'CPI-3', // Guaraci
  '3518602': 'CPI-3', '351860': 'CPI-3', // Guariba
  '3518859': 'CPI-3', '351885': 'CPI-3', // Guatapará
  '3519303': 'CPI-3', '351930': 'CPI-3', // Ibaté
  '3519600': 'CPI-3', '351960': 'CPI-3', // Ibitinga
  '3520103': 'CPI-3', '352010': 'CPI-3', // Igarapava
  '3521309': 'CPI-3', '352130': 'CPI-3', // Ipuã
  '3522703': 'CPI-3', '352270': 'CPI-3', // Itápolis
  '3523701': 'CPI-3', '352370': 'CPI-3', // Itirapuã
  '3524105': 'CPI-3', '352410': 'CPI-3', // Ituverava
  '3524204': 'CPI-3', '352420': 'CPI-3', // Jaborandi
  '3524303': 'CPI-3', '352430': 'CPI-3', // Jaboticabal
  '3525102': 'CPI-3', '352510': 'CPI-3', // Jardinópolis
  '3525409': 'CPI-3', '352540': 'CPI-3', // Jeriquara
  '3527603': 'CPI-3', '352760': 'CPI-3', // Luís Antônio / Luiz Antônio
  '3529302': 'CPI-3', '352930': 'CPI-3', // Matão
  '3529708': 'CPI-3', '352970': 'CPI-3', // Miguelópolis
  '3531308': 'CPI-3', '353130': 'CPI-3', // Monte Alto
  '3531506': 'CPI-3', '353150': 'CPI-3', // Monte Azul Paulista
  '3531902': 'CPI-3', '353190': 'CPI-3', // Morro Agudo
  '3532058': 'CPI-3', '353205': 'CPI-3', // Motuca
  '3532900': 'CPI-3', '353290': 'CPI-3', // Nova Europa
  '3533601': 'CPI-3', '353360': 'CPI-3', // Nuporanga
  '3533908': 'CPI-3', '353390': 'CPI-3', // Olímpia
  '3534302': 'CPI-3', '353430': 'CPI-3', // Orlândia
  '3536307': 'CPI-3', '353630': 'CPI-3', // Patrocínio Paulista
  '3537008': 'CPI-3', '353700': 'CPI-3', // Pedregulho
  '3539004': 'CPI-3', '353900': 'CPI-3', // Pirangi
  '3539509': 'CPI-3', '353950': 'CPI-3', // Pitangueiras
  '3540200': 'CPI-3', '354020': 'CPI-3', // Pontal
  '3540705': 'CPI-3', '354070': 'CPI-3', // Porto Ferreira
  '3540903': 'CPI-3', '354090': 'CPI-3', // Pradópolis
  '3542701': 'CPI-3', '354270': 'CPI-3', // Restinga
  '3542909': 'CPI-3', '354290': 'CPI-3', // Ribeirão Bonito
  '3543105': 'CPI-3', '354310': 'CPI-3', // Ribeirão Corrente
  '3543402': 'CPI-3', '354340': 'CPI-3', // Ribeirão Preto
  '3543600': 'CPI-3', '354360': 'CPI-3', // Rifaina
  '3543709': 'CPI-3', '354370': 'CPI-3', // Rincão
  '3544905': 'CPI-3', '354490': 'CPI-3', // Sales Oliveira
  '3546256': 'CPI-3', '354625': 'CPI-3', // Santa Cruz da Esperança
  '3546504': 'CPI-3', '354650': 'CPI-3', // Santa Ernestina
  '3546900': 'CPI-3', '354690': 'CPI-3', // Santa Lúcia
  '3547502': 'CPI-3', '354750': 'CPI-3', // Santa Rita do Passa Quatro
  '3547601': 'CPI-3', '354760': 'CPI-3', // Santa Rosa de Viterbo
  '3547908': 'CPI-3', '354790': 'CPI-3', // Santo Antônio da Alegria
  '3548906': 'CPI-3', '354890': 'CPI-3', // São Carlos
  '3549409': 'CPI-3', '354940': 'CPI-3', // São Joaquim da Barra
  '3549508': 'CPI-3', '354950': 'CPI-3', // São José da Bela Vista
  '3550902': 'CPI-3', '355090': 'CPI-3', // São Simão
  '3551405': 'CPI-3', '355140': 'CPI-3', // Serra Azul
  '3551504': 'CPI-3', '355150': 'CPI-3', // Serrana
  '3551702': 'CPI-3', '355170': 'CPI-3', // Sertãozinho
  '3551900': 'CPI-3', '355190': 'CPI-3', // Severínia
  '3552700': 'CPI-3', '355270': 'CPI-3', // Tabatinga
  '3553104': 'CPI-3', '355310': 'CPI-3', // Taiaçu
  '3553203': 'CPI-3', '355320': 'CPI-3', // Taiúva
  '3553658': 'CPI-3', '355365': 'CPI-3', // Taquaral
  '3553708': 'CPI-3', '355370': 'CPI-3', // Taquaritinga
  '3554409': 'CPI-3', '355440': 'CPI-3', // Terra Roxa
  '3554755': 'CPI-3', '355475': 'CPI-3', // Trabiju
  '3556800': 'CPI-3', '355680': 'CPI-3', // Viradouro
  '3556909': 'CPI-3', '355690': 'CPI-3', // Vista Alegre do Alto

  // CPI-4
  '3500709': 'CPI-4', '350070': 'CPI-4', // Agudos
  '3501400': 'CPI-4', '350140': 'CPI-4', // Álvaro de Carvalho
  '3501509': 'CPI-4', '350150': 'CPI-4', // Alvinlândia
  '3503356': 'CPI-4', '350335': 'CPI-4', // Arco-Íris
  '3503406': 'CPI-4', '350340': 'CPI-4', // Arealva
  '3504305': 'CPI-4', '350430': 'CPI-4', // Avaí
  '3504701': 'CPI-4', '350470': 'CPI-4', // Balbinos
  '3505203': 'CPI-4', '350520': 'CPI-4', // Bariri
  '3505302': 'CPI-4', '350530': 'CPI-4', // Barra Bonita
  '3505807': 'CPI-4', '350580': 'CPI-4', // Bastos
  '3506003': 'CPI-4', '350600': 'CPI-4', // Bauru
  '3506300': 'CPI-4', '350630': 'CPI-4', // Bernardino de Campos
  '3506805': 'CPI-4', '350680': 'CPI-4', // Bocaina
  '3507209': 'CPI-4', '350720': 'CPI-4', // Borá
  '3507308': 'CPI-4', '350730': 'CPI-4', // Boracéia
  '3507456': 'CPI-4', '350745': 'CPI-4', // Borebi
  '3508306': 'CPI-4', '350830': 'CPI-4', // Cabrália Paulista
  '3508801': 'CPI-4', '350880': 'CPI-4', // Cafelândia
  '3510153': 'CPI-4', '351015': 'CPI-4', // Canitar
  '3557204': 'CPI-4', '355720': 'CPI-4', // Chavantes
  '3514106': 'CPI-4', '351410': 'CPI-4', // Dois Córregos
  '3514502': 'CPI-4', '351450': 'CPI-4', // Duartina
  '3514700': 'CPI-4', '351470': 'CPI-4', // Echaporã
  '3515194': 'CPI-4', '351519': 'CPI-4', // Espírito Santo do Turvo
  '3515657': 'CPI-4', '351565': 'CPI-4', // Fernão
  '3516606': 'CPI-4', '351660': 'CPI-4', // Gália
  '3516705': 'CPI-4', '351670': 'CPI-4', // Garça
  '3517000': 'CPI-4', '351700': 'CPI-4', // Getulina
  '3517208': 'CPI-4', '351720': 'CPI-4', // Guaiçara
  '3517307': 'CPI-4', '351730': 'CPI-4', // Guaimbê
  '3518107': 'CPI-4', '351810': 'CPI-4', // Guarantã
  '3519006': 'CPI-4', '351900': 'CPI-4', // Herculândia
  '3519105': 'CPI-4', '351910': 'CPI-4', // Iacanga
  '3519204': 'CPI-4', '351920': 'CPI-4', // Iacri
  '3520004': 'CPI-4', '352000': 'CPI-4', // Igaraçu do Tietê
  '3520905': 'CPI-4', '352090': 'CPI-4', // Ipaussu
  '3522000': 'CPI-4', '352200': 'CPI-4', // Itaju
  '3522901': 'CPI-4', '352290': 'CPI-4', // Itapuí
  '3525300': 'CPI-4', '352530': 'CPI-4', // Jaú
  '3525805': 'CPI-4', '352580': 'CPI-4', // Júlio Mesquita
  '3526803': 'CPI-4', '352680': 'CPI-4', // Lençóis Paulista
  '3527108': 'CPI-4', '352710': 'CPI-4', // Lins
  '3527504': 'CPI-4', '352750': 'CPI-4', // Lucianópolis
  '3527801': 'CPI-4', '352780': 'CPI-4', // Lupércio
  '3528007': 'CPI-4', '352800': 'CPI-4', // Macatuba
  '3529005': 'CPI-4', '352900': 'CPI-4', // Marília
  '3529807': 'CPI-4', '352980': 'CPI-4', // Mineiros do Tietê
  '3533700': 'CPI-4', '353370': 'CPI-4', // Ocauçu
  '3533809': 'CPI-4', '353380': 'CPI-4', // Óleo
  '3534104': 'CPI-4', '353410': 'CPI-4', // Oriente
  '3534500': 'CPI-4', '353450': 'CPI-4', // Oscar Bressane
  '3534708': 'CPI-4', '353470': 'CPI-4', // Ourinhos
  '3536000': 'CPI-4', '353600': 'CPI-4', // Parapuã
  '3536570': 'CPI-4', '353657': 'CPI-4', // Paulistânia
  '3536703': 'CPI-4', '353670': 'CPI-4', // Pederneiras
  '3538907': 'CPI-4', '353890': 'CPI-4', // Pirajuí
  '3539400': 'CPI-4', '353940': 'CPI-4', // Piratininga
  '3540002': 'CPI-4', '354000': 'CPI-4', // Pompéia
  '3540101': 'CPI-4', '354010': 'CPI-4', // Pongaí
  '3541109': 'CPI-4', '354110': 'CPI-4', // Presidente Alves
  '3541604': 'CPI-4', '354160': 'CPI-4', // Promissão
  '3541703': 'CPI-4', '354170': 'CPI-4', // Quatá
  '3541802': 'CPI-4', '354180': 'CPI-4', // Queiroz
  '3542008': 'CPI-4', '354200': 'CPI-4', // Quintana
  '3542503': 'CPI-4', '354250': 'CPI-4', // Reginópolis
  '3543204': 'CPI-4', '354320': 'CPI-4', // Ribeirão do Sul
  '3543808': 'CPI-4', '354380': 'CPI-4', // Rinópolis
  '3544608': 'CPI-4', '354460': 'CPI-4', // Sabino
  '3545407': 'CPI-4', '354540': 'CPI-4', // Salto Grande
  '3546405': 'CPI-4', '354640': 'CPI-4', // Santa Cruz do Rio Pardo
  '3550506': 'CPI-4', '355050': 'CPI-4', // São Pedro do Turvo
  '3554607': 'CPI-4', '355460': 'CPI-4', // Timburi
  '3555000': 'CPI-4', '355500': 'CPI-4', // Tupã
  '3555505': 'CPI-4', '355550': 'CPI-4', // Ubirajara
  '3555901': 'CPI-4', '355590': 'CPI-4', // Uru
  '3556602': 'CPI-4', '355660': 'CPI-4', // Vera Cruz

  // CPI-5
  '3500204': 'CPI-5', '350020': 'CPI-5', // Adolfo
  '3501202': 'CPI-5', '350120': 'CPI-5', // Álvares Florence
  '3501806': 'CPI-5', '350180': 'CPI-5', // Américo de Campos
  '3503703': 'CPI-5', '350370': 'CPI-5', // Ariranha
  '3503950': 'CPI-5', '350395': 'CPI-5', // Aspásia
  '3504602': 'CPI-5', '350460': 'CPI-5', // Bady Bassitt
  '3504800': 'CPI-5', '350480': 'CPI-5', // Bálsamo
  '3510708': 'CPI-5', '351070': 'CPI-5', // Cardoso
  '3511102': 'CPI-5', '351110': 'CPI-5', // Catanduva
  '3511201': 'CPI-5', '351120': 'CPI-5', // Catiguá
  '3511300': 'CPI-5', '351130': 'CPI-5', // Cedral
  '3512902': 'CPI-5', '351290': 'CPI-5', // Cosmorama
  '3513850': 'CPI-5', '351385': 'CPI-5', // Dirce Reis
  '3514205': 'CPI-5', '351420': 'CPI-5', // Dolcinópolis
  '3514924': 'CPI-5', '351492': 'CPI-5', // Elisiário
  '3515509': 'CPI-5', '351550': 'CPI-5', // Fernandópolis
  '3515905': 'CPI-5', '351590': 'CPI-5', // Floreal
  '3517505': 'CPI-5', '351750': 'CPI-5', // Guapiaçu
  '3519402': 'CPI-5', '351940': 'CPI-5', // Ibirá
  '3519808': 'CPI-5', '351980': 'CPI-5', // Icém
  '3520707': 'CPI-5', '352070': 'CPI-5', // Indiaporã
  '3521150': 'CPI-5', '352115': 'CPI-5', // Ipiguá
  '3521507': 'CPI-5', '352150': 'CPI-5', // Irapuã
  '3521903': 'CPI-5', '352190': 'CPI-5', // Itajobi
  '3524501': 'CPI-5', '352450': 'CPI-5', // Jaci
  '3524808': 'CPI-5', '352480': 'CPI-5', // Jales
  '3525706': 'CPI-5', '352570': 'CPI-5', // José Bonifácio
  '3528106': 'CPI-5', '352810': 'CPI-5', // Macaubal
  '3528205': 'CPI-5', '352820': 'CPI-5', // Macedônia
  '3528304': 'CPI-5', '352830': 'CPI-5', // Magda
  '3528858': 'CPI-5', '352885': 'CPI-5', // Marapoama
  '3529104': 'CPI-5', '352910': 'CPI-5', // Marinópolis
  '3529500': 'CPI-5', '352950': 'CPI-5', // Mendonça
  '3529609': 'CPI-5', '352960': 'CPI-5', // Meridiano
  '3529658': 'CPI-5', '352965': 'CPI-5', // Mesópolis
  '3530003': 'CPI-5', '353000': 'CPI-5', // Mira Estrela
  '3530300': 'CPI-5', '353030': 'CPI-5', // Mirassol
  '3530409': 'CPI-5', '353040': 'CPI-5', // Mirassolândia
  '3531001': 'CPI-5', '353100': 'CPI-5', // Monções
  '3531407': 'CPI-5', '353140': 'CPI-5', // Monte Aprazível
  '3532504': 'CPI-5', '353250': 'CPI-5', // Neves Paulista
  '3532603': 'CPI-5', '353260': 'CPI-5', // Nhandeara
  '3532702': 'CPI-5', '353270': 'CPI-5', // Nipoã
  '3532801': 'CPI-5', '353280': 'CPI-5', // Nova Aliança
  '3532843': 'CPI-5', '353284': 'CPI-5', // Nova Canaã Paulista
  '3533007': 'CPI-5', '353300': 'CPI-5', // Nova Granada
  '3533254': 'CPI-5', '353325': 'CPI-5', // Novais
  '3533502': 'CPI-5', '353350': 'CPI-5', // Novo Horizonte
  '3534005': 'CPI-5', '353400': 'CPI-5', // Onda Verde
  '3534203': 'CPI-5', '353420': 'CPI-5', // Orindiúva
  '3534757': 'CPI-5', '353475': 'CPI-5', // Ouroeste
  '3535002': 'CPI-5', '353500': 'CPI-5', // Palestina
  '3535101': 'CPI-5', '353510': 'CPI-5', // Palmares Paulista
  '3535705': 'CPI-5', '353570': 'CPI-5', // Paraíso
  '3535903': 'CPI-5', '353590': 'CPI-5', // Paranapuã
  '3536257': 'CPI-5', '353625': 'CPI-5', // Parisi
  '3536604': 'CPI-5', '353660': 'CPI-5', // Paulo de Faria
  '3536901': 'CPI-5', '353690': 'CPI-5', // Pedranópolis
  '3538105': 'CPI-5', '353810': 'CPI-5', // Pindorama
  '3539608': 'CPI-5', '353960': 'CPI-5', // Planalto
  '3539905': 'CPI-5', '353990': 'CPI-5', // Poloni
  '3540259': 'CPI-5', '354025': 'CPI-5', // Pontalinda
  '3540309': 'CPI-5', '354030': 'CPI-5', // Pontes Gestal
  '3540408': 'CPI-5', '354040': 'CPI-5', // Populina
  '3540804': 'CPI-5', '354080': 'CPI-5', // Potirendaba
  '3544202': 'CPI-5', '354420': 'CPI-5', // Riolândia
  '3544509': 'CPI-5', '354450': 'CPI-5', // Rubinéia
  '3544806': 'CPI-5', '354480': 'CPI-5', // Sales
  '3545605': 'CPI-5', '354560': 'CPI-5', // Santa Adélia
  '3545704': 'CPI-5', '354570': 'CPI-5', // Santa Albertina
  '3546603': 'CPI-5', '354660': 'CPI-5', // Santa Fé do Sul
  '3547650': 'CPI-5', '354765': 'CPI-5', // Santa Salete
  '3547205': 'CPI-5', '354720': 'CPI-5', // Santana da Ponte Pensa
  '3549003': 'CPI-5', '354900': 'CPI-5', // São Francisco
  '3549201': 'CPI-5', '354920': 'CPI-5', // São João das Duas Pontes
  '3549805': 'CPI-5', '354980': 'CPI-5', // São José do Rio Preto
  '3551306': 'CPI-5', '355130': 'CPI-5', // Sebastianópolis do Sul
  '3552601': 'CPI-5', '355260': 'CPI-5', // Tabapuã
  '3553401': 'CPI-5', '355340': 'CPI-5', // Tanabi
  '3554904': 'CPI-5', '355490': 'CPI-5', // Três Fronteiras
  '3555307': 'CPI-5', '355530': 'CPI-5', // Turmalina
  '3555356': 'CPI-5', '355535': 'CPI-5', // Ubarana
  '3555604': 'CPI-5', '355560': 'CPI-5', // Uchoa
  '3555703': 'CPI-5', '355570': 'CPI-5', // União Paulista
  '3555802': 'CPI-5', '355580': 'CPI-5', // Urânia
  '3556008': 'CPI-5', '355600': 'CPI-5', // Urupês
  '3556107': 'CPI-5', '355610': 'CPI-5', // Valentim Gentil
  '3556958': 'CPI-5', '355695': 'CPI-5', // Vitória Brasil
  '3557105': 'CPI-5', '355710': 'CPI-5', // Votuporanga
  '3557154': 'CPI-5', '355715': 'CPI-5', // Zacarias

  // CPI-6
  '3505401': 'CPI-6', '350540': 'CPI-6', // Barra do Turvo
  '3506359': 'CPI-6', '350635': 'CPI-6', // Bertioga
  '3509254': 'CPI-6', '350925': 'CPI-6', // Cajati
  '3509908': 'CPI-6', '350990': 'CPI-6', // Cananéia
  '3513504': 'CPI-6', '351350': 'CPI-6', // Cubatão
  '3514809': 'CPI-6', '351480': 'CPI-6', // Eldorado
  '3518701': 'CPI-6', '351870': 'CPI-6', // Guarujá
  '3520301': 'CPI-6', '352030': 'CPI-6', // Iguape
  '3520426': 'CPI-6', '352042': 'CPI-6', // Ilha Comprida
  '3521200': 'CPI-6', '352120': 'CPI-6', // Iporanga
  '3522109': 'CPI-6', '352210': 'CPI-6', // Itanhaém
  '3523305': 'CPI-6', '352330': 'CPI-6', // Itariri
  '3524600': 'CPI-6', '352460': 'CPI-6', // Jacupiranga
  '3526100': 'CPI-6', '352610': 'CPI-6', // Juquiá
  '3529906': 'CPI-6', '352990': 'CPI-6', // Miracatu
  '3531100': 'CPI-6', '353110': 'CPI-6', // Mongaguá
  '3536208': 'CPI-6', '353620': 'CPI-6', // Pariquera-Açu
  '3537206': 'CPI-6', '353720': 'CPI-6', // Pedro de Toledo
  '3537602': 'CPI-6', '353760': 'CPI-6', // Peruíbe
  '3541000': 'CPI-6', '354100': 'CPI-6', // Praia Grande
  '3542602': 'CPI-6', '354260': 'CPI-6', // Registro
  '3548500': 'CPI-6', '354850': 'CPI-6', // Santos
  '3551009': 'CPI-6', '355100': 'CPI-6', // São Vicente
  '3551801': 'CPI-6', '355180': 'CPI-6', // Sete Barras

  // CPI-7
  '3500550': 'CPI-7', '350055': 'CPI-7', // Águas de Santa Bárbara
  '3500758': 'CPI-7', '350075': 'CPI-7', // Alambari
  '3501152': 'CPI-7', '350115': 'CPI-7', // Alumínio
  '3502200': 'CPI-7', '350220': 'CPI-7', // Angatuba
  '3502309': 'CPI-7', '350230': 'CPI-7', // Anhembi
  '3502705': 'CPI-7', '350270': 'CPI-7', // Apiaí
  '3502754': 'CPI-7', '350275': 'CPI-7', // Araçariguama
  '3502903': 'CPI-7', '350290': 'CPI-7', // Araçoiaba da Serra
  '3503109': 'CPI-7', '350310': 'CPI-7', // Arandu
  '3503604': 'CPI-7', '350360': 'CPI-7', // Areiópolis
  '3504503': 'CPI-7', '350450': 'CPI-7', // Avaré
  '3505005': 'CPI-7', '350500': 'CPI-7', // Barão de Antonina
  '3505351': 'CPI-7', '350535': 'CPI-7', // Barra do Chapéu
  '3506904': 'CPI-7', '350690': 'CPI-7', // Bofete
  '3507001': 'CPI-7', '350700': 'CPI-7', // Boituva
  '3507159': 'CPI-7', '350715': 'CPI-7', // Bom Sucesso de Itararé
  '3507506': 'CPI-7', '350750': 'CPI-7', // Botucatu
  '3508009': 'CPI-7', '350800': 'CPI-7', // Buri
  '3509452': 'CPI-7', '350945': 'CPI-7', // Campina do Monte Alegre
  '3510203': 'CPI-7', '351020': 'CPI-7', // Capão Bonito
  '3510302': 'CPI-7', '351030': 'CPI-7', // Capela do Alto
  '3511409': 'CPI-7', '351140': 'CPI-7', // Cerqueira César
  '3511508': 'CPI-7', '351150': 'CPI-7', // Cerquilho
  '3511607': 'CPI-7', '351160': 'CPI-7', // Cesário Lange
  '3512308': 'CPI-7', '351230': 'CPI-7', // Conchas
  '3512605': 'CPI-7', '351260': 'CPI-7', // Coronel Macedo
  '3515400': 'CPI-7', '351540': 'CPI-7', // Fartura
  '3517604': 'CPI-7', '351760': 'CPI-7', // Guapiara
  '3518503': 'CPI-7', '351850': 'CPI-7', // Guareí
  '3519253': 'CPI-7', '351925': 'CPI-7', // Iaras
  '3519709': 'CPI-7', '351970': 'CPI-7', // Ibiúna
  '3521002': 'CPI-7', '352100': 'CPI-7', // Iperó
  '3521705': 'CPI-7', '352170': 'CPI-7', // Itaberá
  '3521804': 'CPI-7', '352180': 'CPI-7', // Itaí
  '3522158': 'CPI-7', '352215': 'CPI-7', // Itaoca
  '3522307': 'CPI-7', '352230': 'CPI-7', // Itapetininga
  '3522406': 'CPI-7', '352240': 'CPI-7', // Itapeva
  '3522653': 'CPI-7', '352265': 'CPI-7', // Itapirapuã Paulista
  '3522802': 'CPI-7', '352280': 'CPI-7', // Itaporanga
  '3523206': 'CPI-7', '352320': 'CPI-7', // Itararé
  '3523503': 'CPI-7', '352350': 'CPI-7', // Itatinga
  '3523909': 'CPI-7', '352390': 'CPI-7', // Itu
  '3525854': 'CPI-7', '352585': 'CPI-7', // Jumirim
  '3526407': 'CPI-7', '352640': 'CPI-7', // Laranjal Paulista
  '3528403': 'CPI-7', '352840': 'CPI-7', // Mairinque
  '3528601': 'CPI-7', '352860': 'CPI-7', // Manduri
  '3532827': 'CPI-7', '353282': 'CPI-7', // Nova Campina
  '3535804': 'CPI-7', '353580': 'CPI-7', // Paranapanema
  '3536109': 'CPI-7', '353610': 'CPI-7', // Pardinho
  '3537503': 'CPI-7', '353750': 'CPI-7', // Pereiras
  '3537800': 'CPI-7', '353780': 'CPI-7', // Piedade
  '3537909': 'CPI-7', '353790': 'CPI-7', // Pilar do Sul
  '3538808': 'CPI-7', '353880': 'CPI-7', // Piraju
  '3540507': 'CPI-7', '354050': 'CPI-7', // Porangaba
  '3540606': 'CPI-7', '354060': 'CPI-7', // Porto Feliz
  '3541059': 'CPI-7', '354105': 'CPI-7', // Pratânia
  '3541653': 'CPI-7', '354165': 'CPI-7', // Quadra
  '3542800': 'CPI-7', '354280': 'CPI-7', // Ribeira
  '3543006': 'CPI-7', '354300': 'CPI-7', // Ribeirão Branco
  '3543253': 'CPI-7', '354325': 'CPI-7', // Ribeirão Grande
  '3543501': 'CPI-7', '354350': 'CPI-7', // Riversul
  '3545209': 'CPI-7', '354520': 'CPI-7', // Salto
  '3545308': 'CPI-7', '354530': 'CPI-7', // Salto de Pirapora
  '3550100': 'CPI-7', '355010': 'CPI-7', // São Manuel
  '3550209': 'CPI-7', '355020': 'CPI-7', // São Miguel Arcanjo
  '3550605': 'CPI-7', '355060': 'CPI-7', // São Roque
  '3551108': 'CPI-7', '355110': 'CPI-7', // Sarapuí
  '3551207': 'CPI-7', '355120': 'CPI-7', // Sarutaiá
  '3552205': 'CPI-7', '355220': 'CPI-7', // Sorocaba
  '3553005': 'CPI-7', '355300': 'CPI-7', // Taguaí
  '3553500': 'CPI-7', '355350': 'CPI-7', // Tapiraí
  '3553807': 'CPI-7', '355380': 'CPI-7', // Taquarituba
  '3553856': 'CPI-7', '355385': 'CPI-7', // Taquarivaí
  '3554003': 'CPI-7', '355400': 'CPI-7', // Tatuí
  '3554201': 'CPI-7', '355420': 'CPI-7', // Tejupá
  '3554508': 'CPI-7', '355450': 'CPI-7', // Tietê
  '3554656': 'CPI-7', '355465': 'CPI-7', // Torre de Pedra
  '3557006': 'CPI-7', '355700': 'CPI-7', // Votorantim

  // CPI-8
  '3500105': 'CPI-8', '350010': 'CPI-8', // Adamantina
  '3500808': 'CPI-8', '350080': 'CPI-8', // Alfredo Marcondes
  '3501301': 'CPI-8', '350130': 'CPI-8', // Álvares Machado
  '3502408': 'CPI-8', '350240': 'CPI-8', // Anhumas
  '3504008': 'CPI-8', '350400': 'CPI-8', // Assis
  '3508900': 'CPI-8', '350890': 'CPI-8', // Caiabu
  '3509106': 'CPI-8', '350910': 'CPI-8', // Caiuá
  '3509809': 'CPI-8', '350980': 'CPI-8', // Campos Novos Paulista
  '3510005': 'CPI-8', '351000': 'CPI-8', // Cândido Mota
  '3513306': 'CPI-8', '351330': 'CPI-8', // Cruzália
  '3514403': 'CPI-8', '351440': 'CPI-8', // Dracena
  '3515129': 'CPI-8', '351512': 'CPI-8', // Emilianópolis
  '3515301': 'CPI-8', '351530': 'CPI-8', // Estrela do Norte
  '3515350': 'CPI-8', '351535': 'CPI-8', // Euclides da Cunha Paulista
  '3515806': 'CPI-8', '351580': 'CPI-8', // Flora Rica
  '3516002': 'CPI-8', '351600': 'CPI-8', // Flórida Paulista
  '3516101': 'CPI-8', '351610': 'CPI-8', // Florínea
  '3519501': 'CPI-8', '351950': 'CPI-8', // Ibirarema
  '3519907': 'CPI-8', '351990': 'CPI-8', // Iepê
  '3520608': 'CPI-8', '352060': 'CPI-8', // Indiana
  '3520806': 'CPI-8', '352080': 'CPI-8', // Inúbia Paulista
  '3521606': 'CPI-8', '352160': 'CPI-8', // Irapuru
  '3525607': 'CPI-8', '352560': 'CPI-8', // João Ramalho
  '3526001': 'CPI-8', '352600': 'CPI-8', // Junqueirópolis
  '3527405': 'CPI-8', '352740': 'CPI-8', // Lucélia
  '3527900': 'CPI-8', '352790': 'CPI-8', // Lutécia
  '3528700': 'CPI-8', '352870': 'CPI-8', // Marabá Paulista
  '3528809': 'CPI-8', '352880': 'CPI-8', // Maracaí
  '3528908': 'CPI-8', '352890': 'CPI-8', // Mariápolis
  '3529203': 'CPI-8', '352920': 'CPI-8', // Martinópolis
  '3530201': 'CPI-8', '353020': 'CPI-8', // Mirante do Paranapanema
  '3531605': 'CPI-8', '353160': 'CPI-8', // Monte Castelo
  '3532157': 'CPI-8', '353215': 'CPI-8', // Nantes
  '3532207': 'CPI-8', '353220': 'CPI-8', // Narandiba
  '3533106': 'CPI-8', '353310': 'CPI-8', // Nova Guataporanga
  '3534609': 'CPI-8', '353460': 'CPI-8', // Osvaldo Cruz
  '3534807': 'CPI-8', '353480': 'CPI-8', // Ouro Verde
  '3534906': 'CPI-8', '353490': 'CPI-8', // Pacaembu
  '3535309': 'CPI-8', '353530': 'CPI-8', // Palmital
  '3535408': 'CPI-8', '353540': 'CPI-8', // Panorama
  '3535507': 'CPI-8', '353550': 'CPI-8', // Paraguaçu Paulista
  '3536406': 'CPI-8', '353640': 'CPI-8', // Paulicéia
  '3537156': 'CPI-8', '353715': 'CPI-8', // Pedrinhas Paulista
  '3538303': 'CPI-8', '353830': 'CPI-8', // Piquerobi
  '3539202': 'CPI-8', '353920': 'CPI-8', // Pirapozinho
  '3539707': 'CPI-8', '353970': 'CPI-8', // Platina
  '3540853': 'CPI-8', '354085': 'CPI-8', // Pracinha
  '3541208': 'CPI-8', '354120': 'CPI-8', // Presidente Bernardes
  '3541307': 'CPI-8', '354130': 'CPI-8', // Presidente Epitácio
  '3541406': 'CPI-8', '354140': 'CPI-8', // Presidente Prudente
  '3541505': 'CPI-8', '354150': 'CPI-8', // Presidente Venceslau
  '3542206': 'CPI-8', '354220': 'CPI-8', // Rancharia
  '3542404': 'CPI-8', '354240': 'CPI-8', // Regente Feijó
  '3543238': 'CPI-8', '354323': 'CPI-8', // Ribeirão dos Índios
  '3544251': 'CPI-8', '354425': 'CPI-8', // Rosana
  '3544707': 'CPI-8', '354470': 'CPI-8', // Sagres
  '3545100': 'CPI-8', '354510': 'CPI-8', // Salmourão
  '3545506': 'CPI-8', '354550': 'CPI-8', // Sandovalina
  '3547106': 'CPI-8', '354710': 'CPI-8', // Santa Mercedes
  '3547700': 'CPI-8', '354770': 'CPI-8', // Santo Anastácio
  '3548302': 'CPI-8', '354830': 'CPI-8', // Santo Expedito
  '3552908': 'CPI-8', '355290': 'CPI-8', // Taciba
  '3553906': 'CPI-8', '355390': 'CPI-8', // Tarabai
  '3553955': 'CPI-8', '355395': 'CPI-8', // Tarumã
  '3554300': 'CPI-8', '355430': 'CPI-8', // Teodoro Sampaio
  '3555109': 'CPI-8', '355510': 'CPI-8', // Tupi Paulista

  // CPI-9
  '3500303': 'CPI-9', '350030': 'CPI-9', // Aguaí
  '3500402': 'CPI-9', '350040': 'CPI-9', // Águas da Prata
  '3500600': 'CPI-9', '350060': 'CPI-9', // Águas de São Pedro
  '3501608': 'CPI-9', '350160': 'CPI-9', // Americana
  '3502002': 'CPI-9', '350200': 'CPI-9', // Analândia
  '3503307': 'CPI-9', '350330': 'CPI-9', // Araras
  '3503802': 'CPI-9', '350380': 'CPI-9', // Artur Nogueira
  '3507902': 'CPI-9', '350790': 'CPI-9', // Brotas
  '3508702': 'CPI-9', '350870': 'CPI-9', // Caconde
  '3510401': 'CPI-9', '351040': 'CPI-9', // Capivari
  '3510807': 'CPI-9', '351080': 'CPI-9', // Casa Branca
  '3511706': 'CPI-9', '351170': 'CPI-9', // Charqueada
  '3512209': 'CPI-9', '351220': 'CPI-9', // Conchal
  '3512407': 'CPI-9', '351240': 'CPI-9', // Cordeirópolis
  '3512704': 'CPI-9', '351270': 'CPI-9', // Corumbataí
  '3512803': 'CPI-9', '351280': 'CPI-9', // Cosmópolis
  '3513900': 'CPI-9', '351390': 'CPI-9', // Divinolândia
  '3514908': 'CPI-9', '351490': 'CPI-9', // Elias Fausto
  '3515152': 'CPI-9', '351515': 'CPI-9', // Engenheiro Coelho
  '3515186': 'CPI-9', '351518': 'CPI-9', // Espírito Santo do Pinhal
  '3519071': 'CPI-9', '351907': 'CPI-9', // Hortolândia
  '3521101': 'CPI-9', '352110': 'CPI-9', // Ipeúna
  '3521408': 'CPI-9', '352140': 'CPI-9', // Iracemápolis
  '3523602': 'CPI-9', '352360': 'CPI-9', // Itirapina
  '3523800': 'CPI-9', '352380': 'CPI-9', // Itobi
  '3526704': 'CPI-9', '352670': 'CPI-9', // Leme
  '3526902': 'CPI-9', '352690': 'CPI-9', // Limeira
  '3530508': 'CPI-9', '353050': 'CPI-9', // Mococa
  '3530904': 'CPI-9', '353090': 'CPI-9', // Mombuca
  '3531803': 'CPI-9', '353180': 'CPI-9', // Monte Mor
  '3533403': 'CPI-9', '353340': 'CPI-9', // Nova Odessa
  '3538709': 'CPI-9', '353870': 'CPI-9', // Piracicaba
  '3539301': 'CPI-9', '353930': 'CPI-9', // Pirassununga
  '3542107': 'CPI-9', '354210': 'CPI-9', // Rafard
  '3543907': 'CPI-9', '354390': 'CPI-9', // Rio Claro
  '3544004': 'CPI-9', '354400': 'CPI-9', // Rio das Pedras
  '3545159': 'CPI-9', '354515': 'CPI-9', // Saltinho
  '3546207': 'CPI-9', '354620': 'CPI-9', // Santa Cruz da Conceição
  '3546306': 'CPI-9', '354630': 'CPI-9', // Santa Cruz das Palmeiras
  '3546702': 'CPI-9', '354670': 'CPI-9', // Santa Gertrudes
  '3547007': 'CPI-9', '354700': 'CPI-9', // Santa Maria da Serra
  '3548104': 'CPI-9', '354810': 'CPI-9', // Santo Antônio do Jardim
  '3549102': 'CPI-9', '354910': 'CPI-9', // São João da Boa Vista
  '3549706': 'CPI-9', '354970': 'CPI-9', // São José do Rio Pardo
  '3550407': 'CPI-9', '355040': 'CPI-9', // São Pedro
  '3550803': 'CPI-9', '355080': 'CPI-9', // São Sebastião da Grama
  '3552403': 'CPI-9', '355240': 'CPI-9', // Sumaré
  '3553302': 'CPI-9', '355330': 'CPI-9', // Tambaú
  '3553609': 'CPI-9', '355360': 'CPI-9', // Tapiratiba
  '3554706': 'CPI-9', '355470': 'CPI-9', // Torrinha
  '3556404': 'CPI-9', '355640': 'CPI-9', // Vargem Grande do Sul

};

/**
 * Returns the military police command or CPA ID for a given municipality name, IBGE code, or dynamic map
 */
export function getComandoForMunicipio(
  municipio?: string,
  codArea?: string,
  dynamicMunicipiosMap?: Record<string, MunicipioInfoAvancada>,
  uf?: string
): string {
  // 0. Verifica se é fora do Estado de São Paulo por UF ou código IBGE
  if (uf && uf.toUpperCase() !== 'SP' && uf.toUpperCase() !== 'BRA') {
    return 'FORA_SP';
  }
  if (codArea && codArea.trim().length >= 2 && !codArea.trim().startsWith('35')) {
    return 'FORA_SP';
  }

  // 1. Dynamic mapping from Google Sheets (Coluna A <-> Coluna B) if valid
  if (municipio && dynamicMunicipiosMap) {
    if (dynamicMunicipiosMap[municipio]?.grandeComando) {
      const sheetCmd = dynamicMunicipiosMap[municipio].grandeComando!.trim().toUpperCase();
      if (sheetCmd && (COMANDOS_SP[sheetCmd] || sheetCmd.includes('FORA') || sheetCmd.includes('INTERESTADUAL'))) {
        return sheetCmd.includes('FORA') || sheetCmd.includes('INTERESTADUAL') ? 'FORA_SP' : sheetCmd;
      }
    }
    
    // Case-insensitive / normalized lookup in dynamic map
    const cleanKey = municipio.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    for (const [key, val] of Object.entries(dynamicMunicipiosMap)) {
      if (key.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim() === cleanKey && val?.grandeComando) {
        const cmd = val.grandeComando.trim().toUpperCase();
        if (cmd && (COMANDOS_SP[cmd] || cmd.includes('FORA') || cmd.includes('INTERESTADUAL'))) {
          return cmd.includes('FORA') || cmd.includes('INTERESTADUAL') ? 'FORA_SP' : cmd;
        }
      }
    }
  }

  // 2. Direct IBGE code lookup (7 digits or 6 digits)
  if (codArea) {
    const cleanCod = String(codArea).trim();
    if (IBGE_TO_COMANDO_MAP[cleanCod]) {
      return IBGE_TO_COMANDO_MAP[cleanCod];
    }
    if (cleanCod.length >= 6 && IBGE_TO_COMANDO_MAP[cleanCod.slice(0, 6)]) {
      return IBGE_TO_COMANDO_MAP[cleanCod.slice(0, 6)];
    }

    // Resolve official IBGE name and match command
    const nameFromIbge = getMunicipioNameByIbge(cleanCod) || IBGE_645_TO_NAME_MAP[cleanCod] || (cleanCod.length >= 6 ? IBGE_645_TO_NAME_MAP[cleanCod.slice(0, 6)] : undefined);
    if (nameFromIbge) {
      const cleanIbgeName = nameFromIbge
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/['-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (MUNICIPIO_TO_COMANDO_MAP[cleanIbgeName]) {
        return MUNICIPIO_TO_COMANDO_MAP[cleanIbgeName];
      }
    }
  }

  // 3. Name lookup in MUNICIPIO_TO_COMANDO_MAP
  if (municipio) {
    const clean = municipio
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/['-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (MUNICIPIO_TO_COMANDO_MAP[clean]) {
      return MUNICIPIO_TO_COMANDO_MAP[clean];
    }

    // Try s/z interchangeable variants (e.g. luis / luiz)
    const zVariant = clean.replace(/s\b/g, 'z').replace(/s/g, 'z');
    if (MUNICIPIO_TO_COMANDO_MAP[zVariant]) {
      return MUNICIPIO_TO_COMANDO_MAP[zVariant];
    }
    const sVariant = clean.replace(/z/g, 's');
    if (MUNICIPIO_TO_COMANDO_MAP[sVariant]) {
      return MUNICIPIO_TO_COMANDO_MAP[sVariant];
    }

    // Fallback name variants (stripped spaces and hyphens)
    const stripped = clean.replace(/\s+/g, '');
    for (const [key, cmd] of Object.entries(MUNICIPIO_TO_COMANDO_MAP)) {
      if (key.replace(/\s+/g, '') === stripped) {
        return cmd;
      }
    }
  }

  return 'CPI-4'; // Default fallback
}

/**
 * Returns metadata of a given military police command or CPA ID
 */
export function getComandoMeta(comandoId: string): ComandoMeta {
  const cleanId = (comandoId || '').toUpperCase().trim();
  if (cleanId === 'FORA_SP' || cleanId === 'FORA DE SP' || cleanId.includes('INTERESTADUAL') || cleanId.includes('FORA')) {
    return COMANDOS_SP.FORA_SP;
  }
  return COMANDOS_SP[cleanId] || {
    id: cleanId,
    nome: `Comando ${cleanId}`,
    sigla: cleanId,
    regiaoSede: 'Estado de São Paulo',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/40',
    textColor: 'text-cyan-400',
    grupo: 'Interior'
  };
}
