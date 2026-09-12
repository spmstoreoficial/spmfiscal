import { MunicipioSP } from '../types';
import { getIbgePopulation } from './ibgePopData';
import { findMunicipioBrasil, searchMunicipalitiesBrasil, fetchIbgeMunicipalityInfo } from './brazilMunicipalities';

export const STATE_CENTERS: Record<string, { lat: number; lng: number }> = {
  SP: { lat: -23.5505, lng: -46.6333 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  MG: { lat: -19.9167, lng: -43.9345 },
  ES: { lat: -20.3155, lng: -40.3128 },
  BA: { lat: -12.9718, lng: -38.5016 },
  PE: { lat: -8.0476, lng: -34.8770 },
  AL: { lat: -9.6658, lng: -35.7353 },
  PB: { lat: -7.1153, lng: -34.8610 },
  RN: { lat: -5.7945, lng: -35.2110 },
  CE: { lat: -3.7319, lng: -38.5267 },
  PI: { lat: -5.0892, lng: -42.8016 },
  MA: { lat: -2.5297, lng: -44.3028 },
  PA: { lat: -1.4558, lng: -48.4902 },
  AP: { lat: 0.0352, lng: -51.0704 },
  AM: { lat: -3.1190, lng: -60.0217 },
  RO: { lat: -10.9472, lng: -62.1544 },
  AC: { lat: -9.9749, lng: -67.8243 },
  RR: { lat: 2.8195, lng: -60.6712 },
  GO: { lat: -16.6864, lng: -49.2646 },
  MT: { lat: -15.6010, lng: -56.0979 },
  MS: { lat: -20.4428, lng: -54.6461 },
  PR: { lat: -25.4295, lng: -49.2712 },
  SC: { lat: -27.5954, lng: -48.5480 },
  RS: { lat: -30.0346, lng: -51.2177 },
  TO: { lat: -10.1753, lng: -48.2982 },
  SE: { lat: -10.9472, lng: -37.0677 }
};

export const SP_MUNICIPALITIES: MunicipioSP[] = [
  { nome: 'Adamantina', codigoIbge: '3500105', lat: -21.5838, lng: -51.0696, regiao: 'Região de Presidente Prudente', populacao: 34687 },
  { nome: 'Adolfo', codigoIbge: '3500204', lat: -21.2831, lng: -49.6575, regiao: 'Região de São José do Rio Preto', populacao: 4351 },
  { nome: 'Aguaí', codigoIbge: '3500303', lat: -22.0332, lng: -47.0595, regiao: 'Região de Campinas', populacao: 32072 },
  { nome: 'Águas da Prata', codigoIbge: '3500402', lat: -21.921, lng: -46.7002, regiao: 'Região de Campinas', populacao: 7369 },
  { nome: 'Águas de Lindóia', codigoIbge: '3500501', lat: -22.4769, lng: -46.6001, regiao: 'Região de Campinas', populacao: 17930 },
  { nome: 'Águas de Santa Bárbara', codigoIbge: '3500550', lat: -22.8632, lng: -49.2537, regiao: 'Região de Sorocaba', populacao: 7177 },
  { nome: 'Águas de São Pedro', codigoIbge: '3500600', lat: -22.5993, lng: -47.8766, regiao: 'Região de Campinas', populacao: 2780 },
  { nome: 'Agudos', codigoIbge: '3500709', lat: -22.585, lng: -49.1395, regiao: 'Região de Bauru', populacao: 37680 },
  { nome: 'Alambari', codigoIbge: '3500758', lat: -23.5345, lng: -47.8539, regiao: 'Região de Sorocaba', populacao: 6141 },
  { nome: 'Alfredo Marcondes', codigoIbge: '3500808', lat: -21.9335, lng: -51.3976, regiao: 'Região de Presidente Prudente', populacao: 4445 },
  { nome: 'Altair', codigoIbge: '3500907', lat: -20.5452, lng: -49.0919, regiao: 'Região de São José do Rio Preto', populacao: 3451 },
  { nome: 'Altinópolis', codigoIbge: '3501004', lat: -21.0118, lng: -47.3848, regiao: 'Região de Ribeirão Preto', populacao: 16818 },
  { nome: 'Alto Alegre', codigoIbge: '3501103', lat: -21.6136, lng: -50.1948, regiao: 'Região de Araçatuba', populacao: 3841 },
  { nome: 'Alumínio', codigoIbge: '3501152', lat: -23.5251, lng: -47.2774, regiao: 'Região de Sorocaba', populacao: 17301 },
  { nome: 'Álvares Florence', codigoIbge: '3501202', lat: -20.2746, lng: -49.9143, regiao: 'Região de São José do Rio Preto', populacao: 3915 },
  { nome: 'Álvares Machado', codigoIbge: '3501301', lat: -22.1264, lng: -51.5057, regiao: 'Região de Presidente Prudente', populacao: 27255 },
  { nome: 'Álvaro de Carvalho', codigoIbge: '3501400', lat: -22.0851, lng: -49.7366, regiao: 'Região de Marília', populacao: 4808 },
  { nome: 'Alvinlândia', codigoIbge: '3501509', lat: -22.4438, lng: -49.7551, regiao: 'Região de Marília', populacao: 2885 },
  { nome: 'Americana', codigoIbge: '3501608', lat: -22.7175, lng: -47.2873, regiao: 'Região de Campinas', populacao: 237240 },
  { nome: 'Américo Brasiliense', codigoIbge: '3501707', lat: -21.7202, lng: -48.0338, regiao: 'Região de Araraquara', populacao: 33019 },
  { nome: 'Américo de Campos', codigoIbge: '3501806', lat: -20.2685, lng: -49.7553, regiao: 'Região de São José do Rio Preto', populacao: 5870 },
  { nome: 'Amparo', codigoIbge: '3501905', lat: -22.7018, lng: -46.7965, regiao: 'Região de Campinas', populacao: 68008 },
  { nome: 'Analândia', codigoIbge: '3502002', lat: -22.1335, lng: -47.6805, regiao: 'Região de Campinas', populacao: 4589 },
  { nome: 'Andradina', codigoIbge: '3502101', lat: -20.8646, lng: -51.3166, regiao: 'Região de Araçatuba', populacao: 59783 },
  { nome: 'Angatuba', codigoIbge: '3502200', lat: -23.4741, lng: -48.4291, regiao: 'Região de Sorocaba', populacao: 24022 },
  { nome: 'Anhembi', codigoIbge: '3502309', lat: -22.823, lng: -48.1583, regiao: 'Região de Bauru', populacao: 5674 },
  { nome: 'Anhumas', codigoIbge: '3502408', lat: -22.3427, lng: -51.4217, regiao: 'Região de Presidente Prudente', populacao: 4023 },
  { nome: 'Aparecida', codigoIbge: '3502507', lat: -22.9034, lng: -45.2374, regiao: 'Região de São José dos Campos', populacao: 32569 },
  { nome: 'Aparecida d\'Oeste', codigoIbge: '3502606', lat: -20.4816, lng: -50.9189, regiao: 'Região de São José do Rio Preto', populacao: 4086 },
  { nome: 'Apiaí', codigoIbge: '3502705', lat: -24.3992, lng: -48.8275, regiao: 'Região de Sorocaba', populacao: 24585 },
  { nome: 'Araçariguama', codigoIbge: '3502754', lat: -23.4199, lng: -47.0808, regiao: 'Região de Sorocaba', populacao: 21522 },
  { nome: 'Araçatuba', codigoIbge: '3502804', lat: -21.1443, lng: -50.5763, regiao: 'Região de Araçatuba', populacao: 200124 },
  { nome: 'Araçoiaba da Serra', codigoIbge: '3502903', lat: -23.5651, lng: -47.6703, regiao: 'Região de Sorocaba', populacao: 32443 },
  { nome: 'Aramina', codigoIbge: '3503000', lat: -20.1696, lng: -47.8285, regiao: 'Região de Ribeirão Preto', populacao: 5420 },
  { nome: 'Arandu', codigoIbge: '3503109', lat: -23.1586, lng: -49.0675, regiao: 'Região de Sorocaba', populacao: 6885 },
  { nome: 'Arapeí', codigoIbge: '3503158', lat: -22.6664, lng: -44.4374, regiao: 'Região de São José dos Campos', populacao: 2330 },
  { nome: 'Araraquara', codigoIbge: '3503208', lat: -21.8182, lng: -48.191, regiao: 'Região de Araraquara', populacao: 242228 },
  { nome: 'Araras', codigoIbge: '3503307', lat: -22.3187, lng: -47.3041, regiao: 'Região de Campinas', populacao: 130866 },
  { nome: 'Arco-Íris', codigoIbge: '3503356', lat: -21.7474, lng: -50.4281, regiao: 'Região de Marília', populacao: 2044 },
  { nome: 'Arealva', codigoIbge: '3503406', lat: -22.0668, lng: -48.9903, regiao: 'Região de Bauru', populacao: 8130 },
  { nome: 'Areias', codigoIbge: '3503505', lat: -22.6737, lng: -44.7163, regiao: 'Região de São José dos Campos', populacao: 3577 },
  { nome: 'Areiópolis', codigoIbge: '3503604', lat: -22.6113, lng: -48.6562, regiao: 'Região de Bauru', populacao: 10130 },
  { nome: 'Ariranha', codigoIbge: '3503703', lat: -21.179, lng: -48.7815, regiao: 'Região de São José do Rio Preto', populacao: 7602 },
  { nome: 'Artur Nogueira', codigoIbge: '3503802', lat: -22.553, lng: -47.1283, regiao: 'Região de Campinas', populacao: 51456 },
  { nome: 'Arujá', codigoIbge: '3503901', lat: -23.391, lng: -46.3115, regiao: 'Região de São Paulo', populacao: 86678 },
  { nome: 'Aspásia', codigoIbge: '3503950', lat: -20.1791, lng: -50.7336, regiao: 'Região de São José do Rio Preto', populacao: 1842 },
  { nome: 'Assis', codigoIbge: '3504008', lat: -22.5996, lng: -50.4339, regiao: 'Região de Marília', populacao: 101409 },
  { nome: 'Atibaia', codigoIbge: '3504107', lat: -23.1361, lng: -46.6001, regiao: 'Região de Campinas', populacao: 158647 },
  { nome: 'Auriflama', codigoIbge: '3504206', lat: -20.6264, lng: -50.5934, regiao: 'Região de Araçatuba', populacao: 13692 },
  { nome: 'Avaí', codigoIbge: '3504305', lat: -22.192, lng: -49.3085, regiao: 'Região de Bauru', populacao: 4483 },
  { nome: 'Avanhandava', codigoIbge: '3504404', lat: -21.4746, lng: -49.9495, regiao: 'Região de Araçatuba', populacao: 11263 },
  { nome: 'Avaré', codigoIbge: '3504503', lat: -23.0504, lng: -48.8926, regiao: 'Região de Sorocaba', populacao: 92805 },
  { nome: 'Bady Bassitt', codigoIbge: '3504602', lat: -20.9245, lng: -49.4324, regiao: 'Região de São José do Rio Preto', populacao: 27260 },
  { nome: 'Balbinos', codigoIbge: '3504701', lat: -21.8962, lng: -49.3321, regiao: 'Região de Bauru', populacao: 3887 },
  { nome: 'Bálsamo', codigoIbge: '3504800', lat: -20.703, lng: -49.5506, regiao: 'Região de São José do Rio Preto', populacao: 9596 },
  { nome: 'Bananal', codigoIbge: '3504909', lat: -22.7295, lng: -44.3389, regiao: 'Região de São José dos Campos', populacao: 9969 },
  { nome: 'Barão de Antonina', codigoIbge: '3505005', lat: -23.5718, lng: -49.5666, regiao: 'Região de Sorocaba', populacao: 3531 },
  { nome: 'Barbosa', codigoIbge: '3505104', lat: -21.2955, lng: -49.9154, regiao: 'Região de Araçatuba', populacao: 5640 },
  { nome: 'Bariri', codigoIbge: '3505203', lat: -22.067, lng: -48.7155, regiao: 'Região de Bauru', populacao: 31595 },
  { nome: 'Barra Bonita', codigoIbge: '3505302', lat: -22.4713, lng: -48.5406, regiao: 'Região de Bauru', populacao: 34346 },
  { nome: 'Barra do Chapéu', codigoIbge: '3505351', lat: -24.4387, lng: -49.0922, regiao: 'Região de Sorocaba', populacao: 5179 },
  { nome: 'Barra do Turvo', codigoIbge: '3505401', lat: -24.8794, lng: -48.4127, regiao: 'Região de Sorocaba', populacao: 6876 },
  { nome: 'Barretos', codigoIbge: '3505500', lat: -20.5244, lng: -48.6608, regiao: 'Região de Ribeirão Preto', populacao: 122485 },
  { nome: 'Barrinha', codigoIbge: '3505609', lat: -21.2195, lng: -48.0971, regiao: 'Região de Ribeirão Preto', populacao: 32092 },
  { nome: 'Barueri', codigoIbge: '3505708', lat: -23.5004, lng: -46.8737, regiao: 'Região de São Paulo', populacao: 316473 },
  { nome: 'Bastos', codigoIbge: '3505807', lat: -21.938, lng: -50.7547, regiao: 'Região de Marília', populacao: 21503 },
  { nome: 'Batatais', codigoIbge: '3505906', lat: -20.82, lng: -47.5592, regiao: 'Região de Ribeirão Preto', populacao: 58402 },
  { nome: 'Bauru', codigoIbge: '3506003', lat: -22.2626, lng: -49.1231, regiao: 'Região de Bauru', populacao: 379146 },
  { nome: 'Bebedouro', codigoIbge: '3506102', lat: -20.939, lng: -48.5309, regiao: 'Região de Ribeirão Preto', populacao: 76373 },
  { nome: 'Bento de Abreu', codigoIbge: '3506201', lat: -21.3268, lng: -50.8565, regiao: 'Região de Araçatuba', populacao: 2606 },
  { nome: 'Bernardino de Campos', codigoIbge: '3506300', lat: -23.026, lng: -49.4845, regiao: 'Região de Marília', populacao: 11607 },
  { nome: 'Bertioga', codigoIbge: '3506359', lat: -23.8259, lng: -46.0257, regiao: 'Região de São Paulo', populacao: 64188 },
  { nome: 'Bilac', codigoIbge: '3506409', lat: -21.4238, lng: -50.484, regiao: 'Região de Araçatuba', populacao: 7319 },
  { nome: 'Birigui', codigoIbge: '3506508', lat: -21.2484, lng: -50.3438, regiao: 'Região de Araçatuba', populacao: 118979 },
  { nome: 'Biritiba Mirim', codigoIbge: '3506607', lat: -23.6187, lng: -46.0201, regiao: 'Região de São Paulo', populacao: 29683 },
  { nome: 'Boa Esperança do Sul', codigoIbge: '3506706', lat: -21.9075, lng: -48.4821, regiao: 'Região de Araraquara', populacao: 12978 },
  { nome: 'Bocaina', codigoIbge: '3506805', lat: -22.0955, lng: -48.5169, regiao: 'Região de Bauru', populacao: 11259 },
  { nome: 'Bofete', codigoIbge: '3506904', lat: -23.1239, lng: -48.2865, regiao: 'Região de Bauru', populacao: 10460 },
  { nome: 'Boituva', codigoIbge: '3507001', lat: -23.3071, lng: -47.688, regiao: 'Região de Sorocaba', populacao: 61081 },
  { nome: 'Bom Jesus dos Perdões', codigoIbge: '3507100', lat: -23.1649, lng: -46.4695, regiao: 'Região de Campinas', populacao: 22006 },
  { nome: 'Bom Sucesso de Itararé', codigoIbge: '3507159', lat: -24.3148, lng: -49.1716, regiao: 'Região de Sorocaba', populacao: 3555 },
  { nome: 'Borá', codigoIbge: '3507209', lat: -22.2494, lng: -50.5002, regiao: 'Região de Marília', populacao: 907 },
  { nome: 'Boracéia', codigoIbge: '3507308', lat: -22.1695, lng: -48.7781, regiao: 'Região de Bauru', populacao: 4715 },
  { nome: 'Borborema', codigoIbge: '3507407', lat: -21.6262, lng: -49.037, regiao: 'Região de Araraquara', populacao: 14226 },
  { nome: 'Borebi', codigoIbge: '3507456', lat: -22.6664, lng: -48.9879, regiao: 'Região de Bauru', populacao: 2713 },
  { nome: 'Botucatu', codigoIbge: '3507506', lat: -22.8781, lng: -48.5154, regiao: 'Região de Bauru', populacao: 145155 },
  { nome: 'Bragança Paulista', codigoIbge: '3507605', lat: -22.9429, lng: -46.5594, regiao: 'Região de Campinas', populacao: 176811 },
  { nome: 'Braúna', codigoIbge: '3507704', lat: -21.5566, lng: -50.3485, regiao: 'Região de Araçatuba', populacao: 5356 },
  { nome: 'Brejo Alegre', codigoIbge: '3507753', lat: -21.1691, lng: -50.2179, regiao: 'Região de Araçatuba', populacao: 2565 },
  { nome: 'Brodowski', codigoIbge: '3507803', lat: -21.0496, lng: -47.6345, regiao: 'Região de Ribeirão Preto', populacao: 25201 },
  { nome: 'Brotas', codigoIbge: '3507902', lat: -22.274, lng: -48.0729, regiao: 'Região de Bauru', populacao: 23898 },
  { nome: 'Buri', codigoIbge: '3508009', lat: -23.7181, lng: -48.5357, regiao: 'Região de Sorocaba', populacao: 20250 },
  { nome: 'Buritama', codigoIbge: '3508108', lat: -21.0461, lng: -50.1816, regiao: 'Região de Araçatuba', populacao: 17210 },
  { nome: 'Buritizal', codigoIbge: '3508207', lat: -20.2147, lng: -47.7136, regiao: 'Região de Ribeirão Preto', populacao: 4356 },
  { nome: 'Cabrália Paulista', codigoIbge: '3508306', lat: -22.4896, lng: -49.3828, regiao: 'Região de Bauru', populacao: 4299 },
  { nome: 'Cabreúva', codigoIbge: '3508405', lat: -23.3146, lng: -47.079, regiao: 'Região de Campinas', populacao: 47011 },
  { nome: 'Caçapava', codigoIbge: '3508504', lat: -23.1056, lng: -45.718, regiao: 'Região de São José dos Campos', populacao: 96202 },
  { nome: 'Cachoeira Paulista', codigoIbge: '3508603', lat: -22.6914, lng: -45.0023, regiao: 'Região de São José dos Campos', populacao: 31564 },
  { nome: 'Caconde', codigoIbge: '3508702', lat: -21.5431, lng: -46.6276, regiao: 'Região de Campinas', populacao: 17101 },
  { nome: 'Cafelândia', codigoIbge: '3508801', lat: -21.7386, lng: -49.5581, regiao: 'Região de Bauru', populacao: 16654 },
  { nome: 'Caiabu', codigoIbge: '3508900', lat: -21.9458, lng: -51.2374, regiao: 'Região de Presidente Prudente', populacao: 3712 },
  { nome: 'Caieiras', codigoIbge: '3509007', lat: -23.3797, lng: -46.7388, regiao: 'Região de São Paulo', populacao: 95032 },
  { nome: 'Caiuá', codigoIbge: '3509106', lat: -21.7722, lng: -51.9712, regiao: 'Região de Presidente Prudente', populacao: 5466 },
  { nome: 'Cajamar', codigoIbge: '3509205', lat: -23.3493, lng: -46.8745, regiao: 'Região de São Paulo', populacao: 92689 },
  { nome: 'Cajati', codigoIbge: '3509254', lat: -24.7727, lng: -48.2109, regiao: 'Região de Sorocaba', populacao: 28515 },
  { nome: 'Cajobi', codigoIbge: '3509304', lat: -20.8816, lng: -48.851, regiao: 'Região de Ribeirão Preto', populacao: 9133 },
  { nome: 'Cajuru', codigoIbge: '3509403', lat: -21.2648, lng: -47.3145, regiao: 'Região de Ribeirão Preto', populacao: 23830 },
  { nome: 'Campina do Monte Alegre', codigoIbge: '3509452', lat: -23.6107, lng: -48.4589, regiao: 'Região de Sorocaba', populacao: 5954 },
  { nome: 'Campinas', codigoIbge: '3509502', lat: -22.8987, lng: -47.0467, regiao: 'Região de Campinas', populacao: 1139047 },
  { nome: 'Campo Limpo Paulista', codigoIbge: '3509601', lat: -23.2177, lng: -46.7597, regiao: 'Região de Campinas', populacao: 77632 },
  { nome: 'Campos do Jordão', codigoIbge: '3509700', lat: -22.6978, lng: -45.5301, regiao: 'Região de São José dos Campos', populacao: 46974 },
  { nome: 'Campos Novos Paulista', codigoIbge: '3509809', lat: -22.6097, lng: -50.0026, regiao: 'Região de Marília', populacao: 4888 },
  { nome: 'Cananéia', codigoIbge: '3509908', lat: -25.2475, lng: -48.0009, regiao: 'Região de Sorocaba', populacao: 12289 },
  { nome: 'Canas', codigoIbge: '3509957', lat: -22.7439, lng: -45.0278, regiao: 'Região de São José dos Campos', populacao: 4931 },
  { nome: 'Cândido Mota', codigoIbge: '3510005', lat: -22.8088, lng: -50.3986, regiao: 'Região de Marília', populacao: 29449 },
  { nome: 'Cândido Rodrigues', codigoIbge: '3510104', lat: -21.3386, lng: -48.6306, regiao: 'Região de Araraquara', populacao: 2889 },
  { nome: 'Canitar', codigoIbge: '3510153', lat: -23.012, lng: -49.7852, regiao: 'Região de Marília', populacao: 6283 },
  { nome: 'Capão Bonito', codigoIbge: '3510203', lat: -24.0479, lng: -48.2956, regiao: 'Região de Sorocaba', populacao: 46337 },
  { nome: 'Capela do Alto', codigoIbge: '3510302', lat: -23.47, lng: -47.747, regiao: 'Região de Sorocaba', populacao: 22866 },
  { nome: 'Capivari', codigoIbge: '3510401', lat: -22.9884, lng: -47.4833, regiao: 'Região de Campinas', populacao: 50068 },
  { nome: 'Caraguatatuba', codigoIbge: '3510500', lat: -23.5966, lng: -45.2865, regiao: 'Região de São José dos Campos', populacao: 134873 },
  { nome: 'Carapicuíba', codigoIbge: '3510609', lat: -23.5532, lng: -46.8435, regiao: 'Região de São Paulo', populacao: 386984 },
  { nome: 'Cardoso', codigoIbge: '3510708', lat: -20.0789, lng: -49.9572, regiao: 'Região de São José do Rio Preto', populacao: 11345 },
  { nome: 'Casa Branca', codigoIbge: '3510807', lat: -21.7985, lng: -47.0833, regiao: 'Região de Campinas', populacao: 28083 },
  { nome: 'Cássia dos Coqueiros', codigoIbge: '3510906', lat: -21.2609, lng: -47.1402, regiao: 'Região de Ribeirão Preto', populacao: 2799 },
  { nome: 'Castilho', codigoIbge: '3511003', lat: -21.0074, lng: -51.6221, regiao: 'Região de Araçatuba', populacao: 19977 },
  { nome: 'Catanduva', codigoIbge: '3511102', lat: -21.1261, lng: -48.9515, regiao: 'Região de São José do Rio Preto', populacao: 115791 },
  { nome: 'Catiguá', codigoIbge: '3511201', lat: -21.0597, lng: -49.0542, regiao: 'Região de São José do Rio Preto', populacao: 7003 },
  { nome: 'Cedral', codigoIbge: '3511300', lat: -20.9145, lng: -49.2593, regiao: 'Região de São José do Rio Preto', populacao: 12618 },
  { nome: 'Cerqueira César', codigoIbge: '3511409', lat: -23.0408, lng: -49.1215, regiao: 'Região de Sorocaba', populacao: 21469 },
  { nome: 'Cerquilho', codigoIbge: '3511508', lat: -23.1924, lng: -47.7678, regiao: 'Região de Sorocaba', populacao: 44695 },
  { nome: 'Cesário Lange', codigoIbge: '3511607', lat: -23.2152, lng: -47.8821, regiao: 'Região de Sorocaba', populacao: 19048 },
  { nome: 'Charqueada', codigoIbge: '3511706', lat: -22.5331, lng: -47.7396, regiao: 'Região de Campinas', populacao: 15535 },
  { nome: 'Clementina', codigoIbge: '3511904', lat: -21.5713, lng: -50.4594, regiao: 'Região de Araçatuba', populacao: 6982 },
  { nome: 'Colina', codigoIbge: '3512001', lat: -20.7566, lng: -48.5818, regiao: 'Região de Ribeirão Preto', populacao: 18486 },
  { nome: 'Colômbia', codigoIbge: '3512100', lat: -20.2738, lng: -48.7031, regiao: 'Região de Ribeirão Preto', populacao: 6629 },
  { nome: 'Conchal', codigoIbge: '3512209', lat: -22.3473, lng: -47.1369, regiao: 'Região de Campinas', populacao: 28101 },
  { nome: 'Conchas', codigoIbge: '3512308', lat: -22.9611, lng: -48.068, regiao: 'Região de Bauru', populacao: 15232 },
  { nome: 'Cordeirópolis', codigoIbge: '3512407', lat: -22.4821, lng: -47.4035, regiao: 'Região de Campinas', populacao: 24514 },
  { nome: 'Coroados', codigoIbge: '3512506', lat: -21.3713, lng: -50.3056, regiao: 'Região de Araçatuba', populacao: 5400 },
  { nome: 'Coronel Macedo', codigoIbge: '3512605', lat: -23.6181, lng: -49.3041, regiao: 'Região de Sorocaba', populacao: 4280 },
  { nome: 'Corumbataí', codigoIbge: '3512704', lat: -22.2218, lng: -47.6017, regiao: 'Região de Campinas', populacao: 4195 },
  { nome: 'Cosmópolis', codigoIbge: '3512803', lat: -22.6627, lng: -47.1759, regiao: 'Região de Campinas', populacao: 59773 },
  { nome: 'Cosmorama', codigoIbge: '3512902', lat: -20.4186, lng: -49.7512, regiao: 'Região de São José do Rio Preto', populacao: 8719 },
  { nome: 'Cotia', codigoIbge: '3513009', lat: -23.6721, lng: -46.956, regiao: 'Região de São Paulo', populacao: 274413 },
  { nome: 'Cravinhos', codigoIbge: '3513108', lat: -21.3346, lng: -47.7539, regiao: 'Região de Ribeirão Preto', populacao: 33281 },
  { nome: 'Cristais Paulista', codigoIbge: '3513207', lat: -20.3582, lng: -47.3764, regiao: 'Região de Ribeirão Preto', populacao: 9272 },
  { nome: 'Cruzália', codigoIbge: '3513306', lat: -22.7335, lng: -50.7652, regiao: 'Região de Marília', populacao: 2108 },
  { nome: 'Cruzeiro', codigoIbge: '3513405', lat: -22.5596, lng: -45.0066, regiao: 'Região de São José dos Campos', populacao: 74961 },
  { nome: 'Cubatão', codigoIbge: '3513504', lat: -23.8568, lng: -46.4122, regiao: 'Região de São Paulo', populacao: 112476 },
  { nome: 'Cunha', codigoIbge: '3513603', lat: -23.0328, lng: -44.9148, regiao: 'Região de São José dos Campos', populacao: 22110 },
  { nome: 'Descalvado', codigoIbge: '3513702', lat: -21.8723, lng: -47.6535, regiao: 'Região de Araraquara', populacao: 31756 },
  { nome: 'Diadema', codigoIbge: '3513801', lat: -23.69, lng: -46.613, regiao: 'Região de São Paulo', populacao: 393237 },
  { nome: 'Dirce Reis', codigoIbge: '3513850', lat: -20.454, lng: -50.6272, regiao: 'Região de São José do Rio Preto', populacao: 1620 },
  { nome: 'Divinolândia', codigoIbge: '3513900', lat: -21.662, lng: -46.6977, regiao: 'Região de Campinas', populacao: 11158 },
  { nome: 'Dobrada', codigoIbge: '3514007', lat: -21.5141, lng: -48.3735, regiao: 'Região de Araraquara', populacao: 8759 },
  { nome: 'Dois Córregos', codigoIbge: '3514106', lat: -22.3814, lng: -48.3405, regiao: 'Região de Bauru', populacao: 24510 },
  { nome: 'Dolcinópolis', codigoIbge: '3514205', lat: -20.1138, lng: -50.5258, regiao: 'Região de São José do Rio Preto', populacao: 2207 },
  { nome: 'Dourado', codigoIbge: '3514304', lat: -22.1203, lng: -48.3499, regiao: 'Região de Araraquara', populacao: 8096 },
  { nome: 'Dracena', codigoIbge: '3514403', lat: -21.5779, lng: -51.5987, regiao: 'Região de Presidente Prudente', populacao: 45474 },
  { nome: 'Duartina', codigoIbge: '3514502', lat: -22.3954, lng: -49.431, regiao: 'Região de Bauru', populacao: 12328 },
  { nome: 'Dumont', codigoIbge: '3514601', lat: -21.2415, lng: -47.9859, regiao: 'Região de Ribeirão Preto', populacao: 9471 },
  { nome: 'Echaporã', codigoIbge: '3514700', lat: -22.4139, lng: -50.1936, regiao: 'Região de Marília', populacao: 6205 },
  { nome: 'Eldorado', codigoIbge: '3514809', lat: -24.5187, lng: -48.263, regiao: 'Região de Sorocaba', populacao: 13069 },
  { nome: 'Elias Fausto', codigoIbge: '3514908', lat: -23.0538, lng: -47.3869, regiao: 'Região de Campinas', populacao: 17699 },
  { nome: 'Elisiário', codigoIbge: '3514924', lat: -21.1538, lng: -49.0946, regiao: 'Região de São José do Rio Preto', populacao: 3138 },
  { nome: 'Embaúba', codigoIbge: '3514957', lat: -20.945, lng: -48.8592, regiao: 'Região de São José do Rio Preto', populacao: 2323 },
  { nome: 'Embu das Artes', codigoIbge: '3515004', lat: -23.6464, lng: -46.85, regiao: 'Região de São Paulo', populacao: 250691 },
  { nome: 'Embu-Guaçu', codigoIbge: '3515103', lat: -23.8476, lng: -46.8371, regiao: 'Região de São Paulo', populacao: 66970 },
  { nome: 'Emilianópolis', codigoIbge: '3515129', lat: -21.7893, lng: -51.477, regiao: 'Região de Presidente Prudente', populacao: 3014 },
  { nome: 'Engenheiro Coelho', codigoIbge: '3515152', lat: -22.487, lng: -47.1745, regiao: 'Região de Campinas', populacao: 19566 },
  { nome: 'Espírito Santo do Pinhal', codigoIbge: '3515186', lat: -22.19, lng: -46.7841, regiao: 'Região de Campinas', populacao: 39816 },
  { nome: 'Espírito Santo do Turvo', codigoIbge: '3515194', lat: -22.6645, lng: -49.4221, regiao: 'Região de Marília', populacao: 4157 },
  { nome: 'Estrela d\'Oeste', codigoIbge: '3515202', lat: -20.2728, lng: -50.4086, regiao: 'Região de São José do Rio Preto', populacao: 9417 },
  { nome: 'Estrela do Norte', codigoIbge: '3515301', lat: -22.4829, lng: -51.6859, regiao: 'Região de Presidente Prudente', populacao: 2703 },
  { nome: 'Euclides da Cunha Paulista', codigoIbge: '3515350', lat: -22.5064, lng: -52.5697, regiao: 'Região de Presidente Prudente', populacao: 7924 },
  { nome: 'Fartura', codigoIbge: '3515400', lat: -23.4011, lng: -49.5289, regiao: 'Região de Marília', populacao: 16641 },
  { nome: 'Fernandópolis', codigoIbge: '3515509', lat: -20.2935, lng: -50.2915, regiao: 'Região de São José do Rio Preto', populacao: 71186 },
  { nome: 'Fernando Prestes', codigoIbge: '3515608', lat: -21.3118, lng: -48.6951, regiao: 'Região de São José do Rio Preto', populacao: 5942 },
  { nome: 'Fernão', codigoIbge: '3515657', lat: -22.3694, lng: -49.5458, regiao: 'Região de Marília', populacao: 1656 },
  { nome: 'Ferraz de Vasconcelos', codigoIbge: '3515707', lat: -23.5626, lng: -46.3753, regiao: 'Região de São Paulo', populacao: 179198 },
  { nome: 'Flora Rica', codigoIbge: '3515806', lat: -21.694, lng: -51.3747, regiao: 'Região de Presidente Prudente', populacao: 1487 },
  { nome: 'Floreal', codigoIbge: '3515905', lat: -20.6554, lng: -50.1558, regiao: 'Região de São José do Rio Preto', populacao: 2733 },
  { nome: 'Flórida Paulista', codigoIbge: '3516002', lat: -21.5453, lng: -51.1716, regiao: 'Região de Presidente Prudente', populacao: 12958 },
  { nome: 'Florínea', codigoIbge: '3516101', lat: -22.8748, lng: -50.684, regiao: 'Região de Marília', populacao: 3851 },
  { nome: 'Franca', codigoIbge: '3516200', lat: -20.5777, lng: -47.3461, regiao: 'Região de Ribeirão Preto', populacao: 352536 },
  { nome: 'Francisco Morato', codigoIbge: '3516309', lat: -23.2685, lng: -46.7194, regiao: 'Região de São Paulo', populacao: 165139 },
  { nome: 'Franco da Rocha', codigoIbge: '3516408', lat: -23.3074, lng: -46.7275, regiao: 'Região de São Paulo', populacao: 144849 },
  { nome: 'Gabriel Monteiro', codigoIbge: '3516507', lat: -21.501, lng: -50.5691, regiao: 'Região de Araçatuba', populacao: 2763 },
  { nome: 'Gália', codigoIbge: '3516606', lat: -22.3403, lng: -49.5778, regiao: 'Região de Marília', populacao: 6380 },
  { nome: 'Garça', codigoIbge: '3516705', lat: -22.2252, lng: -49.7076, regiao: 'Região de Marília', populacao: 42110 },
  { nome: 'Gastão Vidigal', codigoIbge: '3516804', lat: -20.8056, lng: -50.1899, regiao: 'Região de Araçatuba', populacao: 3252 },
  { nome: 'Gavião Peixoto', codigoIbge: '3516853', lat: -21.8087, lng: -48.461, regiao: 'Região de Araraquara', populacao: 4702 },
  { nome: 'General Salgado', codigoIbge: '3516903', lat: -20.6186, lng: -50.4325, regiao: 'Região de Araçatuba', populacao: 10312 },
  { nome: 'Getulina', codigoIbge: '3517000', lat: -21.7597, lng: -50.0651, regiao: 'Região de Marília', populacao: 10232 },
  { nome: 'Glicério', codigoIbge: '3517109', lat: -21.3114, lng: -50.1782, regiao: 'Região de Araçatuba', populacao: 4138 },
  { nome: 'Guaiçara', codigoIbge: '3517208', lat: -21.5585, lng: -49.7615, regiao: 'Região de Bauru', populacao: 11239 },
  { nome: 'Guaimbê', codigoIbge: '3517307', lat: -21.869, lng: -49.8537, regiao: 'Região de Marília', populacao: 5512 },
  { nome: 'Guaíra', codigoIbge: '3517406', lat: -20.2985, lng: -48.3481, regiao: 'Região de Ribeirão Preto', populacao: 39279 },
  { nome: 'Guapiaçu', codigoIbge: '3517505', lat: -20.7278, lng: -49.1742, regiao: 'Região de São José do Rio Preto', populacao: 21711 },
  { nome: 'Guapiara', codigoIbge: '3517604', lat: -24.2202, lng: -48.5417, regiao: 'Região de Sorocaba', populacao: 17071 },
  { nome: 'Guará', codigoIbge: '3517703', lat: -20.4875, lng: -47.7962, regiao: 'Região de Ribeirão Preto', populacao: 18606 },
  { nome: 'Guaraçaí', codigoIbge: '3517802', lat: -21.1197, lng: -51.313, regiao: 'Região de Araçatuba', populacao: 7441 },
  { nome: 'Guaraci', codigoIbge: '3517901', lat: -20.4274, lng: -48.9871, regiao: 'Região de Ribeirão Preto', populacao: 10350 },
  { nome: 'Guarani d\'Oeste', codigoIbge: '3518008', lat: -20.0626, lng: -50.3522, regiao: 'Região de São José do Rio Preto', populacao: 1968 },
  { nome: 'Guarantã', codigoIbge: '3518107', lat: -21.9196, lng: -49.5768, regiao: 'Região de Bauru', populacao: 6427 },
  { nome: 'Guararapes', codigoIbge: '3518206', lat: -21.3357, lng: -50.7165, regiao: 'Região de Araçatuba', populacao: 31043 },
  { nome: 'Guararema', codigoIbge: '3518305', lat: -23.4268, lng: -46.0658, regiao: 'Região de São Paulo', populacao: 31236 },
  { nome: 'Guaratinguetá', codigoIbge: '3518404', lat: -22.8208, lng: -45.2103, regiao: 'Região de São José dos Campos', populacao: 118044 },
  { nome: 'Guareí', codigoIbge: '3518503', lat: -23.3634, lng: -48.2308, regiao: 'Região de Sorocaba', populacao: 15013 },
  { nome: 'Guariba', codigoIbge: '3518602', lat: -21.3881, lng: -48.2034, regiao: 'Região de Ribeirão Preto', populacao: 37498 },
  { nome: 'Guarujá', codigoIbge: '3518701', lat: -23.9496, lng: -46.2277, regiao: 'Região de São Paulo', populacao: 287634 },
  { nome: 'Guarulhos', codigoIbge: '3518800', lat: -23.3968, lng: -46.4483, regiao: 'Região de São Paulo', populacao: 1291771 },
  { nome: 'Guatapará', codigoIbge: '3518859', lat: -21.4794, lng: -47.9959, regiao: 'Região de Ribeirão Preto', populacao: 7320 },
  { nome: 'Guzolândia', codigoIbge: '3518909', lat: -20.6134, lng: -50.7185, regiao: 'Região de Araçatuba', populacao: 4246 },
  { nome: 'Herculândia', codigoIbge: '3519006', lat: -21.9457, lng: -50.3737, regiao: 'Região de Marília', populacao: 9125 },
  { nome: 'Holambra', codigoIbge: '3519055', lat: -22.6412, lng: -47.0641, regiao: 'Região de Campinas', populacao: 15094 },
  { nome: 'Hortolândia', codigoIbge: '3519071', lat: -22.8734, lng: -47.2182, regiao: 'Região de Campinas', populacao: 236641 },
  { nome: 'Iacanga', codigoIbge: '3519105', lat: -21.9169, lng: -49.0535, regiao: 'Região de Bauru', populacao: 10437 },
  { nome: 'Iacri', codigoIbge: '3519204', lat: -21.7824, lng: -50.613, regiao: 'Região de Marília', populacao: 6131 },
  { nome: 'Iaras', codigoIbge: '3519253', lat: -22.8323, lng: -49.0997, regiao: 'Região de Sorocaba', populacao: 8010 },
  { nome: 'Ibaté', codigoIbge: '3519303', lat: -21.9467, lng: -48.0277, regiao: 'Região de Araraquara', populacao: 32178 },
  { nome: 'Ibirá', codigoIbge: '3519402', lat: -21.0813, lng: -49.2153, regiao: 'Região de São José do Rio Preto', populacao: 11690 },
  { nome: 'Ibirarema', codigoIbge: '3519501', lat: -22.8212, lng: -50.0823, regiao: 'Região de Marília', populacao: 6385 },
  { nome: 'Ibitinga', codigoIbge: '3519600', lat: -21.7846, lng: -48.8434, regiao: 'Região de Araraquara', populacao: 60033 },
  { nome: 'Ibiúna', codigoIbge: '3519709', lat: -23.8308, lng: -47.2155, regiao: 'Região de Sorocaba', populacao: 75605 },
  { nome: 'Icém', codigoIbge: '3519808', lat: -20.382, lng: -49.2166, regiao: 'Região de São José do Rio Preto', populacao: 7819 },
  { nome: 'Iepê', codigoIbge: '3519907', lat: -22.673, lng: -51.0171, regiao: 'Região de Presidente Prudente', populacao: 7619 },
  { nome: 'Igaraçu do Tietê', codigoIbge: '3520004', lat: -22.539, lng: -48.585, regiao: 'Região de Bauru', populacao: 23106 },
  { nome: 'Igarapava', codigoIbge: '3520103', lat: -20.0712, lng: -47.6925, regiao: 'Região de Ribeirão Preto', populacao: 26212 },
  { nome: 'Igaratá', codigoIbge: '3520202', lat: -23.1346, lng: -46.1477, regiao: 'Região de São José dos Campos', populacao: 10605 },
  { nome: 'Iguape', codigoIbge: '3520301', lat: -24.5384, lng: -47.4985, regiao: 'Região de Sorocaba', populacao: 29115 },
  { nome: 'Ilhabela', codigoIbge: '3520400', lat: -23.9182, lng: -45.2958, regiao: 'Região de São José dos Campos', populacao: 34934 },
  { nome: 'Ilha Comprida', codigoIbge: '3520426', lat: -24.8781, lng: -47.7453, regiao: 'Região de Sorocaba', populacao: 13419 },
  { nome: 'Ilha Solteira', codigoIbge: '3520442', lat: -20.4625, lng: -51.2608, regiao: 'Região de Araçatuba', populacao: 25549 },
  { nome: 'Indaiatuba', codigoIbge: '3520509', lat: -23.1006, lng: -47.1811, regiao: 'Região de Campinas', populacao: 255748 },
  { nome: 'Indiana', codigoIbge: '3520608', lat: -22.1131, lng: -51.2593, regiao: 'Região de Presidente Prudente', populacao: 5090 },
  { nome: 'Indiaporã', codigoIbge: '3520707', lat: -19.9532, lng: -50.2474, regiao: 'Região de São José do Rio Preto', populacao: 4035 },
  { nome: 'Inúbia Paulista', codigoIbge: '3520806', lat: -21.7341, lng: -50.9534, regiao: 'Região de Presidente Prudente', populacao: 3615 },
  { nome: 'Ipaussu', codigoIbge: '3520905', lat: -23.0787, lng: -49.6069, regiao: 'Região de Marília', populacao: 13712 },
  { nome: 'Iperó', codigoIbge: '3521002', lat: -23.3859, lng: -47.6421, regiao: 'Região de Sorocaba', populacao: 36459 },
  { nome: 'Ipeúna', codigoIbge: '3521101', lat: -22.4387, lng: -47.6986, regiao: 'Região de Campinas', populacao: 6831 },
  { nome: 'Ipiguá', codigoIbge: '3521150', lat: -20.6403, lng: -49.406, regiao: 'Região de São José do Rio Preto', populacao: 6761 },
  { nome: 'Iporanga', codigoIbge: '3521200', lat: -24.4976, lng: -48.5505, regiao: 'Região de Sorocaba', populacao: 4046 },
  { nome: 'Ipuã', codigoIbge: '3521309', lat: -20.3946, lng: -48.0547, regiao: 'Região de Ribeirão Preto', populacao: 14454 },
  { nome: 'Iracemápolis', codigoIbge: '3521408', lat: -22.6099, lng: -47.5245, regiao: 'Região de Campinas', populacao: 21967 },
  { nome: 'Irapuã', codigoIbge: '3521507', lat: -21.249, lng: -49.4016, regiao: 'Região de São José do Rio Preto', populacao: 6867 },
  { nome: 'Irapuru', codigoIbge: '3521606', lat: -21.4474, lng: -51.3426, regiao: 'Região de Presidente Prudente', populacao: 7085 },
  { nome: 'Itaberá', codigoIbge: '3521705', lat: -23.8995, lng: -49.1447, regiao: 'Região de Sorocaba', populacao: 17983 },
  { nome: 'Itaí', codigoIbge: '3521804', lat: -23.5136, lng: -49.0775, regiao: 'Região de Sorocaba', populacao: 25180 },
  { nome: 'Itajobi', codigoIbge: '3521903', lat: -21.3532, lng: -49.0522, regiao: 'Região de São José do Rio Preto', populacao: 16989 },
  { nome: 'Itaju', codigoIbge: '3522000', lat: -21.9351, lng: -48.7899, regiao: 'Região de Bauru', populacao: 3618 },
  { nome: 'Itanhaém', codigoIbge: '3522109', lat: -24.0511, lng: -46.8359, regiao: 'Região de São Paulo', populacao: 112476 },
  { nome: 'Itaoca', codigoIbge: '3522158', lat: -24.6186, lng: -48.8502, regiao: 'Região de Sorocaba', populacao: 3422 },
  { nome: 'Itapecerica da Serra', codigoIbge: '3522208', lat: -23.7439, lng: -46.8548, regiao: 'Região de São Paulo', populacao: 158522 },
  { nome: 'Itapetininga', codigoIbge: '3522307', lat: -23.6535, lng: -48.1263, regiao: 'Região de Sorocaba', populacao: 157790 },
  { nome: 'Itapeva', codigoIbge: '3522406', lat: -23.9488, lng: -48.832, regiao: 'Região de Sorocaba', populacao: 89728 },
  { nome: 'Itapevi', codigoIbge: '3522505', lat: -23.5545, lng: -46.9774, regiao: 'Região de São Paulo', populacao: 232297 },
  { nome: 'Itapira', codigoIbge: '3522604', lat: -22.422, lng: -46.772, regiao: 'Região de Campinas', populacao: 72022 },
  { nome: 'Itapirapuã Paulista', codigoIbge: '3522653', lat: -24.5556, lng: -49.219, regiao: 'Região de Sorocaba', populacao: 4306 },
  { nome: 'Itápolis', codigoIbge: '3522703', lat: -21.5618, lng: -48.8261, regiao: 'Região de Araraquara', populacao: 39493 },
  { nome: 'Itaporanga', codigoIbge: '3522802', lat: -23.6683, lng: -49.4756, regiao: 'Região de Sorocaba', populacao: 14085 },
  { nome: 'Itapuí', codigoIbge: '3522901', lat: -22.2447, lng: -48.6937, regiao: 'Região de Bauru', populacao: 13659 },
  { nome: 'Itapura', codigoIbge: '3523008', lat: -20.6037, lng: -51.4225, regiao: 'Região de Araçatuba', populacao: 3979 },
  { nome: 'Itaquaquecetuba', codigoIbge: '3523107', lat: -23.4592, lng: -46.3323, regiao: 'Região de São Paulo', populacao: 369275 },
  { nome: 'Itararé', codigoIbge: '3523206', lat: -24.0698, lng: -49.3311, regiao: 'Região de Sorocaba', populacao: 44438 },
  { nome: 'Itariri', codigoIbge: '3523305', lat: -24.2858, lng: -47.1336, regiao: 'Região de São Paulo', populacao: 15528 },
  { nome: 'Itatiba', codigoIbge: '3523404', lat: -23.0111, lng: -46.8082, regiao: 'Região de Campinas', populacao: 121590 },
  { nome: 'Itatinga', codigoIbge: '3523503', lat: -23.1242, lng: -48.6214, regiao: 'Região de Bauru', populacao: 19070 },
  { nome: 'Itirapina', codigoIbge: '3523602', lat: -22.2944, lng: -47.8359, regiao: 'Região de Araraquara', populacao: 16148 },
  { nome: 'Itirapuã', codigoIbge: '3523701', lat: -20.6502, lng: -47.1657, regiao: 'Região de Ribeirão Preto', populacao: 5779 },
  { nome: 'Itobi', codigoIbge: '3523800', lat: -21.7511, lng: -46.9305, regiao: 'Região de Campinas', populacao: 8046 },
  { nome: 'Itu', codigoIbge: '3523909', lat: -23.3093, lng: -47.2839, regiao: 'Região de Sorocaba', populacao: 168240 },
  { nome: 'Itupeva', codigoIbge: '3524006', lat: -23.1401, lng: -47.0595, regiao: 'Região de Campinas', populacao: 70616 },
  { nome: 'Ituverava', codigoIbge: '3524105', lat: -20.2983, lng: -47.8268, regiao: 'Região de Ribeirão Preto', populacao: 37571 },
  { nome: 'Jaborandi', codigoIbge: '3524204', lat: -20.6475, lng: -48.4061, regiao: 'Região de Ribeirão Preto', populacao: 6221 },
  { nome: 'Jaboticabal', codigoIbge: '3524303', lat: -21.2055, lng: -48.2947, regiao: 'Região de Ribeirão Preto', populacao: 71821 },
  { nome: 'Jacareí', codigoIbge: '3524402', lat: -23.2911, lng: -45.9748, regiao: 'Região de São José dos Campos', populacao: 240275 },
  { nome: 'Jaci', codigoIbge: '3524501', lat: -20.9421, lng: -49.5784, regiao: 'Região de São José do Rio Preto', populacao: 7613 },
  { nome: 'Jacupiranga', codigoIbge: '3524600', lat: -24.7757, lng: -48.0428, regiao: 'Região de Sorocaba', populacao: 16097 },
  { nome: 'Jaguariúna', codigoIbge: '3524709', lat: -22.6849, lng: -47.0191, regiao: 'Região de Campinas', populacao: 59347 },
  { nome: 'Jales', codigoIbge: '3524808', lat: -20.2858, lng: -50.561, regiao: 'Região de São José do Rio Preto', populacao: 48776 },
  { nome: 'Jambeiro', codigoIbge: '3524907', lat: -23.28, lng: -45.7148, regiao: 'Região de São José dos Campos', populacao: 6397 },
  { nome: 'Jandira', codigoIbge: '3525003', lat: -23.5406, lng: -46.8977, regiao: 'Região de São Paulo', populacao: 118045 },
  { nome: 'Jardinópolis', codigoIbge: '3525102', lat: -20.9982, lng: -47.8176, regiao: 'Região de Ribeirão Preto', populacao: 45282 },
  { nome: 'Jarinu', codigoIbge: '3525201', lat: -23.0994, lng: -46.7309, regiao: 'Região de Campinas', populacao: 37535 },
  { nome: 'Jaú', codigoIbge: '3525300', lat: -22.2764, lng: -48.5326, regiao: 'Região de Bauru', populacao: 133497 },
  { nome: 'Jeriquara', codigoIbge: '3525409', lat: -20.3342, lng: -47.5741, regiao: 'Região de Ribeirão Preto', populacao: 3863 },
  { nome: 'Joanópolis', codigoIbge: '3525508', lat: -22.9374, lng: -46.2193, regiao: 'Região de Campinas', populacao: 12815 },
  { nome: 'João Ramalho', codigoIbge: '3525607', lat: -22.2385, lng: -50.7788, regiao: 'Região de Presidente Prudente', populacao: 4371 },
  { nome: 'José Bonifácio', codigoIbge: '3525706', lat: -21.0809, lng: -49.7629, regiao: 'Região de São José do Rio Preto', populacao: 36633 },
  { nome: 'Júlio Mesquita', codigoIbge: '3525805', lat: -21.9847, lng: -49.789, regiao: 'Região de Marília', populacao: 4254 },
  { nome: 'Jumirim', codigoIbge: '3525854', lat: -23.1026, lng: -47.8006, regiao: 'Região de Sorocaba', populacao: 3056 },
  { nome: 'Jundiaí', codigoIbge: '3525904', lat: -23.1862, lng: -46.8933, regiao: 'Região de Campinas', populacao: 443221 },
  { nome: 'Junqueirópolis', codigoIbge: '3526001', lat: -21.4111, lng: -51.4357, regiao: 'Região de Presidente Prudente', populacao: 20448 },
  { nome: 'Juquiá', codigoIbge: '3526100', lat: -24.1978, lng: -47.6473, regiao: 'Região de Sorocaba', populacao: 17154 },
  { nome: 'Juquitiba', codigoIbge: '3526209', lat: -23.9587, lng: -47.0258, regiao: 'Região de São Paulo', populacao: 27404 },
  { nome: 'Lagoinha', codigoIbge: '3526308', lat: -23.0854, lng: -45.1989, regiao: 'Região de São José dos Campos', populacao: 5083 },
  { nome: 'Laranjal Paulista', codigoIbge: '3526407', lat: -23.0147, lng: -47.8594, regiao: 'Região de Campinas', populacao: 26261 },
  { nome: 'Lavínia', codigoIbge: '3526506', lat: -21.1556, lng: -51.0359, regiao: 'Região de Araçatuba', populacao: 9689 },
  { nome: 'Lavrinhas', codigoIbge: '3526605', lat: -22.5217, lng: -44.883, regiao: 'Região de São José dos Campos', populacao: 7171 },
  { nome: 'Leme', codigoIbge: '3526704', lat: -22.1739, lng: -47.3288, regiao: 'Região de Campinas', populacao: 98161 },
  { nome: 'Lençóis Paulista', codigoIbge: '3526803', lat: -22.664, lng: -48.8109, regiao: 'Região de Bauru', populacao: 66505 },
  { nome: 'Limeira', codigoIbge: '3526902', lat: -22.6117, lng: -47.3733, regiao: 'Região de Campinas', populacao: 291869 },
  { nome: 'Lindóia', codigoIbge: '3527009', lat: -22.5096, lng: -46.6534, regiao: 'Região de Campinas', populacao: 7014 },
  { nome: 'Lins', codigoIbge: '3527108', lat: -21.6614, lng: -49.6896, regiao: 'Região de Bauru', populacao: 74779 },
  { nome: 'Lorena', codigoIbge: '3527207', lat: -22.7767, lng: -45.066, regiao: 'Região de São José dos Campos', populacao: 84855 },
  { nome: 'Lourdes', codigoIbge: '3527256', lat: -20.9424, lng: -50.2387, regiao: 'Região de Araçatuba', populacao: 1950 },
  { nome: 'Louveira', codigoIbge: '3527306', lat: -23.0818, lng: -46.9318, regiao: 'Região de Campinas', populacao: 51847 },
  { nome: 'Lucélia', codigoIbge: '3527405', lat: -21.6419, lng: -51.0027, regiao: 'Região de Presidente Prudente', populacao: 20061 },
  { nome: 'Lucianópolis', codigoIbge: '3527504', lat: -22.4814, lng: -49.545, regiao: 'Região de Bauru', populacao: 2372 },
  { nome: 'Luís Antônio', codigoIbge: '3527603', lat: -21.5618, lng: -47.8146, regiao: 'Região de Ribeirão Preto', populacao: 12265 },
  { nome: 'Luiziânia', codigoIbge: '3527702', lat: -21.6797, lng: -50.3635, regiao: 'Região de Araçatuba', populacao: 4701 },
  { nome: 'Lupércio', codigoIbge: '3527801', lat: -22.4301, lng: -49.8136, regiao: 'Região de Marília', populacao: 3981 },
  { nome: 'Lutécia', codigoIbge: '3527900', lat: -22.3109, lng: -50.374, regiao: 'Região de Marília', populacao: 2661 },
  { nome: 'Macatuba', codigoIbge: '3528007', lat: -22.4968, lng: -48.7063, regiao: 'Região de Bauru', populacao: 16829 },
  { nome: 'Macaubal', codigoIbge: '3528106', lat: -20.8588, lng: -49.9836, regiao: 'Região de São José do Rio Preto', populacao: 7481 },
  { nome: 'Macedônia', codigoIbge: '3528205', lat: -20.0884, lng: -50.1772, regiao: 'Região de São José do Rio Preto', populacao: 3963 },
  { nome: 'Magda', codigoIbge: '3528304', lat: -20.5743, lng: -50.2235, regiao: 'Região de Araçatuba', populacao: 3165 },
  { nome: 'Mairinque', codigoIbge: '3528403', lat: -23.5019, lng: -47.2368, regiao: 'Região de Sorocaba', populacao: 50027 },
  { nome: 'Mairiporã', codigoIbge: '3528502', lat: -23.3163, lng: -46.5604, regiao: 'Região de São Paulo', populacao: 93853 },
  { nome: 'Manduri', codigoIbge: '3528601', lat: -23.0556, lng: -49.3075, regiao: 'Região de Sorocaba', populacao: 9871 },
  { nome: 'Marabá Paulista', codigoIbge: '3528700', lat: -22.1195, lng: -52.0573, regiao: 'Região de Presidente Prudente', populacao: 4573 },
  { nome: 'Maracaí', codigoIbge: '3528809', lat: -22.6682, lng: -50.8132, regiao: 'Região de Marília', populacao: 12673 },
  { nome: 'Marapoama', codigoIbge: '3528858', lat: -21.2627, lng: -49.147, regiao: 'Região de São José do Rio Preto', populacao: 3292 },
  { nome: 'Mariápolis', codigoIbge: '3528908', lat: -21.7778, lng: -51.1627, regiao: 'Região de Presidente Prudente', populacao: 3513 },
  { nome: 'Marília', codigoIbge: '3529005', lat: -22.1846, lng: -49.9829, regiao: 'Região de Marília', populacao: 237627 },
  { nome: 'Marinópolis', codigoIbge: '3529104', lat: -20.4887, lng: -50.8317, regiao: 'Região de São José do Rio Preto', populacao: 1860 },
  { nome: 'Martinópolis', codigoIbge: '3529203', lat: -22.1827, lng: -51.1251, regiao: 'Região de Presidente Prudente', populacao: 24881 },
  { nome: 'Matão', codigoIbge: '3529302', lat: -21.5918, lng: -48.4531, regiao: 'Região de Araraquara', populacao: 79033 },
  { nome: 'Mauá', codigoIbge: '3529401', lat: -23.6538, lng: -46.4501, regiao: 'Região de São Paulo', populacao: 418261 },
  { nome: 'Mendonça', codigoIbge: '3529500', lat: -21.1985, lng: -49.5726, regiao: 'Região de São José do Rio Preto', populacao: 6159 },
  { nome: 'Meridiano', codigoIbge: '3529609', lat: -20.4157, lng: -50.2011, regiao: 'Região de São José do Rio Preto', populacao: 4572 },
  { nome: 'Mesópolis', codigoIbge: '3529658', lat: -19.9503, lng: -50.6183, regiao: 'Região de São José do Rio Preto', populacao: 1952 },
  { nome: 'Miguelópolis', codigoIbge: '3529708', lat: -20.1823, lng: -48.1656, regiao: 'Região de Ribeirão Preto', populacao: 19441 },
  { nome: 'Mineiros do Tietê', codigoIbge: '3529807', lat: -22.4536, lng: -48.4424, regiao: 'Região de Bauru', populacao: 11230 },
  { nome: 'Miracatu', codigoIbge: '3529906', lat: -24.1753, lng: -47.3605, regiao: 'Região de Sorocaba', populacao: 18553 },
  { nome: 'Mira Estrela', codigoIbge: '3530003', lat: -19.9631, lng: -50.1265, regiao: 'Região de São José do Rio Preto', populacao: 3126 },
  { nome: 'Mirandópolis', codigoIbge: '3530102', lat: -21.1242, lng: -51.1553, regiao: 'Região de Araçatuba', populacao: 27983 },
  { nome: 'Mirante do Paranapanema', codigoIbge: '3530201', lat: -22.3205, lng: -51.9617, regiao: 'Região de Presidente Prudente', populacao: 15917 },
  { nome: 'Mirassol', codigoIbge: '3530300', lat: -20.8334, lng: -49.5031, regiao: 'Região de São José do Rio Preto', populacao: 63337 },
  { nome: 'Mirassolândia', codigoIbge: '3530409', lat: -20.6039, lng: -49.4919, regiao: 'Região de São José do Rio Preto', populacao: 4669 },
  { nome: 'Mococa', codigoIbge: '3530508', lat: -21.4527, lng: -47.0129, regiao: 'Região de Campinas', populacao: 67681 },
  { nome: 'Mogi das Cruzes', codigoIbge: '3530607', lat: -23.5598, lng: -46.1908, regiao: 'Região de São Paulo', populacao: 451505 },
  { nome: 'Mogi Guaçu', codigoIbge: '3530706', lat: -22.2551, lng: -47.0105, regiao: 'Região de Campinas', populacao: 153658 },
  { nome: 'Mogi Mirim', codigoIbge: '3530805', lat: -22.4378, lng: -46.9987, regiao: 'Região de Campinas', populacao: 92558 },
  { nome: 'Mombuca', codigoIbge: '3530904', lat: -22.952, lng: -47.5978, regiao: 'Região de Campinas', populacao: 3722 },
  { nome: 'Monções', codigoIbge: '3531001', lat: -20.8693, lng: -50.0892, regiao: 'Região de Araçatuba', populacao: 1937 },
  { nome: 'Mongaguá', codigoIbge: '3531100', lat: -24.057, lng: -46.6603, regiao: 'Região de São Paulo', populacao: 61951 },
  { nome: 'Monte Alegre do Sul', codigoIbge: '3531209', lat: -22.7064, lng: -46.6745, regiao: 'Região de Campinas', populacao: 8627 },
  { nome: 'Monte Alto', codigoIbge: '3531308', lat: -21.2513, lng: -48.5542, regiao: 'Região de Ribeirão Preto', populacao: 47574 },
  { nome: 'Monte Aprazível', codigoIbge: '3531407', lat: -20.7422, lng: -49.785, regiao: 'Região de São José do Rio Preto', populacao: 22280 },
  { nome: 'Monte Azul Paulista', codigoIbge: '3531506', lat: -20.9108, lng: -48.6835, regiao: 'Região de Ribeirão Preto', populacao: 18151 },
  { nome: 'Monte Castelo', codigoIbge: '3531605', lat: -21.219, lng: -51.5779, regiao: 'Região de Presidente Prudente', populacao: 4222 },
  { nome: 'Monteiro Lobato', codigoIbge: '3531704', lat: -22.9265, lng: -45.8111, regiao: 'Região de São José dos Campos', populacao: 4138 },
  { nome: 'Monte Mor', codigoIbge: '3531803', lat: -22.9541, lng: -47.2938, regiao: 'Região de Campinas', populacao: 64662 },
  { nome: 'Morro Agudo', codigoIbge: '3531902', lat: -20.6579, lng: -48.1914, regiao: 'Região de Ribeirão Preto', populacao: 27933 },
  { nome: 'Morungaba', codigoIbge: '3532009', lat: -22.8855, lng: -46.7839, regiao: 'Região de Campinas', populacao: 13720 },
  { nome: 'Motuca', codigoIbge: '3532058', lat: -21.4913, lng: -48.1529, regiao: 'Região de Araraquara', populacao: 4034 },
  { nome: 'Murutinga do Sul', codigoIbge: '3532108', lat: -20.9914, lng: -51.2983, regiao: 'Região de Araçatuba', populacao: 3737 },
  { nome: 'Nantes', codigoIbge: '3532157', lat: -22.604, lng: -51.2267, regiao: 'Região de Presidente Prudente', populacao: 2660 },
  { nome: 'Narandiba', codigoIbge: '3532207', lat: -22.5438, lng: -51.5111, regiao: 'Região de Presidente Prudente', populacao: 5713 },
  { nome: 'Natividade da Serra', codigoIbge: '3532306', lat: -23.399, lng: -45.3874, regiao: 'Região de São José dos Campos', populacao: 6999 },
  { nome: 'Nazaré Paulista', codigoIbge: '3532405', lat: -23.1857, lng: -46.3682, regiao: 'Região de Campinas', populacao: 18217 },
  { nome: 'Neves Paulista', codigoIbge: '3532504', lat: -20.8739, lng: -49.6508, regiao: 'Região de São José do Rio Preto', populacao: 9699 },
  { nome: 'Nhandeara', codigoIbge: '3532603', lat: -20.6539, lng: -50.056, regiao: 'Região de São José do Rio Preto', populacao: 9852 },
  { nome: 'Nipoã', codigoIbge: '3532702', lat: -20.8931, lng: -49.7735, regiao: 'Região de São José do Rio Preto', populacao: 4750 },
  { nome: 'Nova Aliança', codigoIbge: '3532801', lat: -21.0571, lng: -49.521, regiao: 'Região de São José do Rio Preto', populacao: 6693 },
  { nome: 'Nova Campina', codigoIbge: '3532827', lat: -24.1951, lng: -48.9591, regiao: 'Região de Sorocaba', populacao: 8497 },
  { nome: 'Nova Canaã Paulista', codigoIbge: '3532843', lat: -20.369, lng: -50.9118, regiao: 'Região de São José do Rio Preto', populacao: 2032 },
  { nome: 'Nova Castilho', codigoIbge: '3532868', lat: -20.7865, lng: -50.3581, regiao: 'Região de Araçatuba', populacao: 1062 },
  { nome: 'Nova Europa', codigoIbge: '3532900', lat: -21.7884, lng: -48.5644, regiao: 'Região de Araraquara', populacao: 9311 },
  { nome: 'Nova Granada', codigoIbge: '3533007', lat: -20.4596, lng: -49.3123, regiao: 'Região de São José do Rio Preto', populacao: 19419 },
  { nome: 'Nova Guataporanga', codigoIbge: '3533106', lat: -21.3155, lng: -51.6476, regiao: 'Região de Presidente Prudente', populacao: 2156 },
  { nome: 'Nova Independência', codigoIbge: '3533205', lat: -21.151, lng: -51.534, regiao: 'Região de Araçatuba', populacao: 4609 },
  { nome: 'Novais', codigoIbge: '3533254', lat: -20.9838, lng: -48.9113, regiao: 'Região de São José do Rio Preto', populacao: 4412 },
  { nome: 'Nova Luzitânia', codigoIbge: '3533304', lat: -20.8727, lng: -50.2413, regiao: 'Região de Araçatuba', populacao: 2837 },
  { nome: 'Nova Odessa', codigoIbge: '3533403', lat: -22.7805, lng: -47.2615, regiao: 'Região de Campinas', populacao: 62019 },
  { nome: 'Novo Horizonte', codigoIbge: '3533502', lat: -21.4549, lng: -49.2952, regiao: 'Região de São José do Rio Preto', populacao: 38324 },
  { nome: 'Nuporanga', codigoIbge: '3533601', lat: -20.6884, lng: -47.7251, regiao: 'Região de Ribeirão Preto', populacao: 7391 },
  { nome: 'Ocauçu', codigoIbge: '3533700', lat: -22.4403, lng: -49.9496, regiao: 'Região de Marília', populacao: 4331 },
  { nome: 'Óleo', codigoIbge: '3533809', lat: -22.9515, lng: -49.3885, regiao: 'Região de Sorocaba', populacao: 2512 },
  { nome: 'Olímpia', codigoIbge: '3533908', lat: -20.6903, lng: -48.9935, regiao: 'Região de Ribeirão Preto', populacao: 55074 },
  { nome: 'Onda Verde', codigoIbge: '3534005', lat: -20.6115, lng: -49.2457, regiao: 'Região de São José do Rio Preto', populacao: 4771 },
  { nome: 'Oriente', codigoIbge: '3534104', lat: -22.1374, lng: -50.0964, regiao: 'Região de Marília', populacao: 6085 },
  { nome: 'Orindiúva', codigoIbge: '3534203', lat: -20.2298, lng: -49.3669, regiao: 'Região de São José do Rio Preto', populacao: 6024 },
  { nome: 'Orlândia', codigoIbge: '3534302', lat: -20.7018, lng: -47.8982, regiao: 'Região de Ribeirão Preto', populacao: 38319 },
  { nome: 'Osasco', codigoIbge: '3534401', lat: -23.5308, lng: -46.7864, regiao: 'Região de São Paulo', populacao: 728615 },
  { nome: 'Oscar Bressane', codigoIbge: '3534500', lat: -22.2916, lng: -50.2549, regiao: 'Região de Marília', populacao: 2470 },
  { nome: 'Osvaldo Cruz', codigoIbge: '3534609', lat: -21.6737, lng: -50.8362, regiao: 'Região de Presidente Prudente', populacao: 31272 },
  { nome: 'Ourinhos', codigoIbge: '3534708', lat: -22.9549, lng: -49.8566, regiao: 'Região de Marília', populacao: 103970 },
  { nome: 'Ouroeste', codigoIbge: '3534757', lat: -19.9286, lng: -50.4116, regiao: 'Região de São José do Rio Preto', populacao: 10294 },
  { nome: 'Ouro Verde', codigoIbge: '3534807', lat: -21.5362, lng: -51.7516, regiao: 'Região de Presidente Prudente', populacao: 7779 },
  { nome: 'Pacaembu', codigoIbge: '3534906', lat: -21.4845, lng: -51.2735, regiao: 'Região de Presidente Prudente', populacao: 14877 },
  { nome: 'Palestina', codigoIbge: '3535002', lat: -20.2986, lng: -49.5251, regiao: 'Região de São José do Rio Preto', populacao: 11476 },
  { nome: 'Palmares Paulista', codigoIbge: '3535101', lat: -21.1035, lng: -48.8212, regiao: 'Região de São José do Rio Preto', populacao: 9650 },
  { nome: 'Palmeira d\'Oeste', codigoIbge: '3535200', lat: -20.4629, lng: -50.7486, regiao: 'Região de São José do Rio Preto', populacao: 8903 },
  { nome: 'Palmital', codigoIbge: '3535309', lat: -22.8265, lng: -50.2334, regiao: 'Região de Marília', populacao: 19594 },
  { nome: 'Panorama', codigoIbge: '3535408', lat: -21.508, lng: -51.8766, regiao: 'Região de Presidente Prudente', populacao: 14964 },
  { nome: 'Paraguaçu Paulista', codigoIbge: '3535507', lat: -22.4586, lng: -50.6454, regiao: 'Região de Marília', populacao: 41120 },
  { nome: 'Paraibuna', codigoIbge: '3535606', lat: -23.4806, lng: -45.6491, regiao: 'Região de São José dos Campos', populacao: 17667 },
  { nome: 'Paraíso', codigoIbge: '3535705', lat: -21.0154, lng: -48.7691, regiao: 'Região de São José do Rio Preto', populacao: 6099 },
  { nome: 'Paranapanema', codigoIbge: '3535804', lat: -23.4842, lng: -48.75, regiao: 'Região de Sorocaba', populacao: 19395 },
  { nome: 'Paranapuã', codigoIbge: '3535903', lat: -20.0566, lng: -50.594, regiao: 'Região de São José do Rio Preto', populacao: 4031 },
  { nome: 'Parapuã', codigoIbge: '3536000', lat: -21.8439, lng: -50.8278, regiao: 'Região de Marília', populacao: 10580 },
  { nome: 'Pardinho', codigoIbge: '3536109', lat: -23.0941, lng: -48.3827, regiao: 'Região de Bauru', populacao: 7153 },
  { nome: 'Pariquera-Açu', codigoIbge: '3536208', lat: -24.6612, lng: -47.8404, regiao: 'Região de Sorocaba', populacao: 19233 },
  { nome: 'Parisi', codigoIbge: '3536257', lat: -20.266, lng: -50.0388, regiao: 'Região de São José do Rio Preto', populacao: 2892 },
  { nome: 'Patrocínio Paulista', codigoIbge: '3536307', lat: -20.6741, lng: -47.2797, regiao: 'Região de Ribeirão Preto', populacao: 14512 },
  { nome: 'Paulicéia', codigoIbge: '3536406', lat: -21.1605, lng: -51.758, regiao: 'Região de Presidente Prudente', populacao: 7955 },
  { nome: 'Paulínia', codigoIbge: '3536505', lat: -22.7368, lng: -47.1382, regiao: 'Região de Campinas', populacao: 110537 },
  { nome: 'Paulistânia', codigoIbge: '3536570', lat: -22.5707, lng: -49.3063, regiao: 'Região de Bauru', populacao: 2090 },
  { nome: 'Paulo de Faria', codigoIbge: '3536604', lat: -20.0899, lng: -49.48, regiao: 'Região de São José do Rio Preto', populacao: 7400 },
  { nome: 'Pederneiras', codigoIbge: '3536703', lat: -22.3006, lng: -48.8762, regiao: 'Região de Bauru', populacao: 44827 },
  { nome: 'Pedra Bela', codigoIbge: '3536802', lat: -22.7696, lng: -46.441, regiao: 'Região de Campinas', populacao: 6557 },
  { nome: 'Pedranópolis', codigoIbge: '3536901', lat: -20.1919, lng: -50.0898, regiao: 'Região de São José do Rio Preto', populacao: 2787 },
  { nome: 'Pedregulho', codigoIbge: '3537008', lat: -20.1477, lng: -47.4456, regiao: 'Região de Ribeirão Preto', populacao: 15525 },
  { nome: 'Pedreira', codigoIbge: '3537107', lat: -22.7493, lng: -46.8896, regiao: 'Região de Campinas', populacao: 43112 },
  { nome: 'Pedrinhas Paulista', codigoIbge: '3537156', lat: -22.8054, lng: -50.8111, regiao: 'Região de Marília', populacao: 2804 },
  { nome: 'Pedro de Toledo', codigoIbge: '3537206', lat: -24.1779, lng: -47.1773, regiao: 'Região de São Paulo', populacao: 11281 },
  { nome: 'Penápolis', codigoIbge: '3537305', lat: -21.382, lng: -50.1175, regiao: 'Região de Araçatuba', populacao: 61679 },
  { nome: 'Pereira Barreto', codigoIbge: '3537404', lat: -20.6462, lng: -51.0995, regiao: 'Região de Araçatuba', populacao: 24095 },
  { nome: 'Pereiras', codigoIbge: '3537503', lat: -23.1213, lng: -47.9777, regiao: 'Região de Sorocaba', populacao: 8737 },
  { nome: 'Peruíbe', codigoIbge: '3537602', lat: -24.3898, lng: -46.9039, regiao: 'Região de São Paulo', populacao: 68352 },
  { nome: 'Piacatu', codigoIbge: '3537701', lat: -21.5715, lng: -50.6637, regiao: 'Região de Araçatuba', populacao: 5519 },
  { nome: 'Piedade', codigoIbge: '3537800', lat: -23.7976, lng: -47.4354, regiao: 'Região de Sorocaba', populacao: 52970 },
  { nome: 'Pilar do Sul', codigoIbge: '3537909', lat: -23.8612, lng: -47.7272, regiao: 'Região de Sorocaba', populacao: 27619 },
  { nome: 'Pindamonhangaba', codigoIbge: '3538006', lat: -22.8862, lng: -45.4579, regiao: 'Região de São José dos Campos', populacao: 165428 },
  { nome: 'Pindorama', codigoIbge: '3538105', lat: -21.2033, lng: -48.9112, regiao: 'Região de São José do Rio Preto', populacao: 14542 },
  { nome: 'Pinhalzinho', codigoIbge: '3538204', lat: -22.7782, lng: -46.5746, regiao: 'Região de Campinas', populacao: 15224 },
  { nome: 'Piquerobi', codigoIbge: '3538303', lat: -21.8405, lng: -51.7479, regiao: 'Região de Presidente Prudente', populacao: 3264 },
  { nome: 'Piquete', codigoIbge: '3538501', lat: -22.5997, lng: -45.1653, regiao: 'Região de São José dos Campos', populacao: 12490 },
  { nome: 'Piracaia', codigoIbge: '3538600', lat: -23.0527, lng: -46.2973, regiao: 'Região de Campinas', populacao: 26029 },
  { nome: 'Piracicaba', codigoIbge: '3538709', lat: -22.711, lng: -47.7793, regiao: 'Região de Campinas', populacao: 423323 },
  { nome: 'Piraju', codigoIbge: '3538808', lat: -23.1947, lng: -49.3904, regiao: 'Região de Marília', populacao: 29436 },
  { nome: 'Pirajuí', codigoIbge: '3538907', lat: -21.9386, lng: -49.3836, regiao: 'Região de Bauru', populacao: 22431 },
  { nome: 'Pirangi', codigoIbge: '3539004', lat: -21.0869, lng: -48.6795, regiao: 'Região de São José do Rio Preto', populacao: 10885 },
  { nome: 'Pirapora do Bom Jesus', codigoIbge: '3539103', lat: -23.3695, lng: -46.9746, regiao: 'Região de São Paulo', populacao: 18370 },
  { nome: 'Pirapozinho', codigoIbge: '3539202', lat: -22.4219, lng: -51.5902, regiao: 'Região de Presidente Prudente', populacao: 25348 },
  { nome: 'Pirassununga', codigoIbge: '3539301', lat: -22.0003, lng: -47.3742, regiao: 'Região de Araraquara', populacao: 73545 },
  { nome: 'Piratininga', codigoIbge: '3539400', lat: -22.4224, lng: -49.187, regiao: 'Região de Bauru', populacao: 15108 },
  { nome: 'Pitangueiras', codigoIbge: '3539509', lat: -21.0135307, lng: -48.2293391, regiao: 'Região de Ribeirão Preto', populacao: 33674, uf: 'SP' },
  { nome: 'Planalto', codigoIbge: '3539608', lat: -21.0078, lng: -49.9349, regiao: 'Região de São José do Rio Preto', populacao: 4389 },
  { nome: 'Platina', codigoIbge: '3539707', lat: -22.6237, lng: -50.2071, regiao: 'Região de Marília', populacao: 3025 },
  { nome: 'Poá', codigoIbge: '3539806', lat: -23.5344, lng: -46.3505, regiao: 'Região de São Paulo', populacao: 103765 },
  { nome: 'Poloni', codigoIbge: '3539905', lat: -20.7352, lng: -49.819, regiao: 'Região de São José do Rio Preto', populacao: 5592 },
  { nome: 'Pompéia', codigoIbge: '3540002', lat: -22.0513, lng: -50.2065, regiao: 'Região de Marília', populacao: 20196 },
  { nome: 'Pongaí', codigoIbge: '3540101', lat: -21.7283, lng: -49.3629, regiao: 'Região de Bauru', populacao: 3395 },
  { nome: 'Pontal', codigoIbge: '3540200', lat: -20.9713, lng: -48.0711, regiao: 'Região de Ribeirão Preto', populacao: 37607 },
  { nome: 'Pontalinda', codigoIbge: '3540259', lat: -20.4608, lng: -50.5261, regiao: 'Região de São José do Rio Preto', populacao: 4127 },
  { nome: 'Pontes Gestal', codigoIbge: '3540309', lat: -20.1738, lng: -49.7531, regiao: 'Região de São José do Rio Preto', populacao: 2387 },
  { nome: 'Populina', codigoIbge: '3540408', lat: -19.9142, lng: -50.5114, regiao: 'Região de São José do Rio Preto', populacao: 4127 },
  { nome: 'Porangaba', codigoIbge: '3540507', lat: -23.1598, lng: -48.123, regiao: 'Região de Sorocaba', populacao: 10451 },
  { nome: 'Porto Feliz', codigoIbge: '3540606', lat: -23.223, lng: -47.5232, regiao: 'Região de Sorocaba', populacao: 56497 },
  { nome: 'Porto Ferreira', codigoIbge: '3540705', lat: -21.8375, lng: -47.4363, regiao: 'Região de Araraquara', populacao: 52649 },
  { nome: 'Potim', codigoIbge: '3540754', lat: -22.827, lng: -45.3075, regiao: 'Região de São José dos Campos', populacao: 20392 },
  { nome: 'Potirendaba', codigoIbge: '3540804', lat: -21.1031, lng: -49.3974, regiao: 'Região de São José do Rio Preto', populacao: 18496 },
  { nome: 'Pracinha', codigoIbge: '3540853', lat: -21.8372, lng: -51.0787, regiao: 'Região de Presidente Prudente', populacao: 2578 },
  { nome: 'Pradópolis', codigoIbge: '3540903', lat: -21.3495, lng: -48.076, regiao: 'Região de Ribeirão Preto', populacao: 17078 },
  { nome: 'Praia Grande', codigoIbge: '3541000', lat: -24.0035, lng: -46.4958, regiao: 'Região de São Paulo', populacao: 349935 },
  { nome: 'Pratânia', codigoIbge: '3541059', lat: -22.8186, lng: -48.6939, regiao: 'Região de Bauru', populacao: 5126 },
  { nome: 'Presidente Alves', codigoIbge: '3541109', lat: -22.1087, lng: -49.4117, regiao: 'Região de Bauru', populacao: 3804 },
  { nome: 'Presidente Bernardes', codigoIbge: '3541208', lat: -22.1239, lng: -51.6324, regiao: 'Região de Presidente Prudente', populacao: 14490 },
  { nome: 'Presidente Epitácio', codigoIbge: '3541307', lat: -21.9141, lng: -52.1616, regiao: 'Região de Presidente Prudente', populacao: 39505 },
  { nome: 'Presidente Prudente', codigoIbge: '3541406', lat: -21.9654, lng: -51.328, regiao: 'Região de Presidente Prudente', populacao: 225668 },
  { nome: 'Presidente Venceslau', codigoIbge: '3541505', lat: -21.7708, lng: -51.8407, regiao: 'Região de Presidente Prudente', populacao: 35201 },
  { nome: 'Promissão', codigoIbge: '3541604', lat: -21.5126, lng: -49.8807, regiao: 'Região de Bauru', populacao: 35131 },
  { nome: 'Quadra', codigoIbge: '3541653', lat: -23.2929, lng: -48.0441, regiao: 'Região de Sorocaba', populacao: 3405 },
  { nome: 'Quatá', codigoIbge: '3541703', lat: -22.2107, lng: -50.6524, regiao: 'Região de Presidente Prudente', populacao: 13163 },
  { nome: 'Queiroz', codigoIbge: '3541802', lat: -21.7911, lng: -50.2463, regiao: 'Região de Marília', populacao: 3265 },
  { nome: 'Queluz', codigoIbge: '3541901', lat: -22.5148, lng: -44.78, regiao: 'Região de São José dos Campos', populacao: 9159 },
  { nome: 'Quintana', codigoIbge: '3542008', lat: -22.0917, lng: -50.362, regiao: 'Região de Marília', populacao: 7038 },
  { nome: 'Rafard', codigoIbge: '3542107', lat: -23.0291, lng: -47.587, regiao: 'Região de Campinas', populacao: 8965 },
  { nome: 'Rancharia', codigoIbge: '3542206', lat: -22.3379, lng: -50.9149, regiao: 'Região de Presidente Prudente', populacao: 28588 },
  { nome: 'Redenção da Serra', codigoIbge: '3542305', lat: -23.2543, lng: -45.5058, regiao: 'Região de São José dos Campos', populacao: 4494 },
  { nome: 'Regente Feijó', codigoIbge: '3542404', lat: -22.2037, lng: -51.3011, regiao: 'Região de Presidente Prudente', populacao: 20145 },
  { nome: 'Reginópolis', codigoIbge: '3542503', lat: -21.8906, lng: -49.1856, regiao: 'Região de Bauru', populacao: 7662 },
  { nome: 'Registro', codigoIbge: '3542602', lat: -24.5191, lng: -47.8639, regiao: 'Região de Sorocaba', populacao: 59947 },
  { nome: 'Restinga', codigoIbge: '3542701', lat: -20.6755, lng: -47.5195, regiao: 'Região de Ribeirão Preto', populacao: 6404 },
  { nome: 'Ribeira', codigoIbge: '3542800', lat: -24.6186, lng: -49.0278, regiao: 'Região de Sorocaba', populacao: 3132 },
  { nome: 'Ribeirão Bonito', codigoIbge: '3542909', lat: -22.0425, lng: -48.184, regiao: 'Região de Araraquara', populacao: 10989 },
  { nome: 'Ribeirão Branco', codigoIbge: '3543006', lat: -24.2559, lng: -48.7852, regiao: 'Região de Sorocaba', populacao: 18627 },
  { nome: 'Ribeirão Corrente', codigoIbge: '3543105', lat: -20.442, lng: -47.577, regiao: 'Região de Ribeirão Preto', populacao: 4608 },
  { nome: 'Ribeirão do Sul', codigoIbge: '3543204', lat: -22.7505, lng: -49.9256, regiao: 'Região de Marília', populacao: 4677 },
  { nome: 'Ribeirão dos Índios', codigoIbge: '3543238', lat: -21.7763, lng: -51.5754, regiao: 'Região de Presidente Prudente', populacao: 2025 },
  { nome: 'Ribeirão Grande', codigoIbge: '3543253', lat: -24.1918, lng: -48.3571, regiao: 'Região de Sorocaba', populacao: 7450 },
  { nome: 'Ribeirão Pires', codigoIbge: '3543303', lat: -23.7046, lng: -46.3973, regiao: 'Região de São Paulo', populacao: 115559 },
  { nome: 'Ribeirão Preto', codigoIbge: '3543402', lat: -21.2066, lng: -47.8213, regiao: 'Região de Ribeirão Preto', populacao: 698642 },
  { nome: 'Riversul', codigoIbge: '3543501', lat: -23.8366, lng: -49.4568, regiao: 'Região de Sorocaba', populacao: 5599 },
  { nome: 'Rifaina', codigoIbge: '3543600', lat: -20.0647, lng: -47.4493, regiao: 'Região de Ribeirão Preto', populacao: 4049 },
  { nome: 'Rincão', codigoIbge: '3543709', lat: -21.5735, lng: -48, regiao: 'Região de Araraquara', populacao: 9098 },
  { nome: 'Rinópolis', codigoIbge: '3543808', lat: -21.6609, lng: -50.7309, regiao: 'Região de Marília', populacao: 9259 },
  { nome: 'Rio Claro', codigoIbge: '3543907', lat: -22.402, lng: -47.6106, regiao: 'Região de Campinas', populacao: 201418 },
  { nome: 'Rio das Pedras', codigoIbge: '3544004', lat: -22.8422, lng: -47.5901, regiao: 'Região de Campinas', populacao: 31328 },
  { nome: 'Rio Grande da Serra', codigoIbge: '3544103', lat: -23.7399, lng: -46.3808, regiao: 'Região de São Paulo', populacao: 44170 },
  { nome: 'Riolândia', codigoIbge: '3544202', lat: -20.0464, lng: -49.7246, regiao: 'Região de São José do Rio Preto', populacao: 10309 },
  { nome: 'Rosana', codigoIbge: '3544251', lat: -22.5043, lng: -52.8487, regiao: 'Região de Presidente Prudente', populacao: 17440 },
  { nome: 'Roseira', codigoIbge: '3544301', lat: -22.9276, lng: -45.296, regiao: 'Região de São José dos Campos', populacao: 10832 },
  { nome: 'Rubiácea', codigoIbge: '3544400', lat: -21.3626, lng: -50.7958, regiao: 'Região de Araçatuba', populacao: 2700 },
  { nome: 'Rubinéia', codigoIbge: '3544509', lat: -20.2665, lng: -51.006, regiao: 'Região de São José do Rio Preto', populacao: 3833 },
  { nome: 'Sabino', codigoIbge: '3544608', lat: -21.4798, lng: -49.5786, regiao: 'Região de Bauru', populacao: 5112 },
  { nome: 'Sagres', codigoIbge: '3544707', lat: -21.8643, lng: -51.0022, regiao: 'Região de Presidente Prudente', populacao: 2474 },
  { nome: 'Sales', codigoIbge: '3544806', lat: -21.3377, lng: -49.5199, regiao: 'Região de São José do Rio Preto', populacao: 6437 },
  { nome: 'Sales Oliveira', codigoIbge: '3544905', lat: -20.8191, lng: -47.8454, regiao: 'Região de Ribeirão Preto', populacao: 11411 },
  { nome: 'Salesópolis', codigoIbge: '3545001', lat: -23.588, lng: -45.8462, regiao: 'Região de São Paulo', populacao: 15202 },
  { nome: 'Salmourão', codigoIbge: '3545100', lat: -21.585, lng: -50.8747, regiao: 'Região de Presidente Prudente', populacao: 4808 },
  { nome: 'Saltinho', codigoIbge: '3545159', lat: -22.8618, lng: -47.7302, regiao: 'Região de Campinas', populacao: 8161 },
  { nome: 'Salto', codigoIbge: '3545209', lat: -23.17, lng: -47.3056, regiao: 'Região de Sorocaba', populacao: 134319 },
  { nome: 'Salto de Pirapora', codigoIbge: '3545308', lat: -23.655, lng: -47.6028, regiao: 'Região de Sorocaba', populacao: 43748 },
  { nome: 'Salto Grande', codigoIbge: '3545407', lat: -22.8729, lng: -49.9675, regiao: 'Região de Marília', populacao: 9050 },
  { nome: 'Sandovalina', codigoIbge: '3545506', lat: -22.4566, lng: -51.8428, regiao: 'Região de Presidente Prudente', populacao: 3645 },
  { nome: 'Santa Adélia', codigoIbge: '3545605', lat: -21.3135, lng: -48.8205, regiao: 'Região de São José do Rio Preto', populacao: 14018 },
  { nome: 'Santa Albertina', codigoIbge: '3545704', lat: -20.0242, lng: -50.715, regiao: 'Região de São José do Rio Preto', populacao: 6393 },
  { nome: 'Santa Bárbara d\'Oeste', codigoIbge: '3545803', lat: -22.7919, lng: -47.4369, regiao: 'Região de Campinas', populacao: 183347 },
  { nome: 'Santa Branca', codigoIbge: '3546009', lat: -23.4185, lng: -45.8617, regiao: 'Região de São José dos Campos', populacao: 13975 },
  { nome: 'Santa Clara d\'Oeste', codigoIbge: '3546108', lat: -20.0761, lng: -50.9082, regiao: 'Região de São José do Rio Preto', populacao: 2598 },
  { nome: 'Santa Cruz da Conceição', codigoIbge: '3546207', lat: -22.1139, lng: -47.4916, regiao: 'Região de Campinas', populacao: 4277 },
  { nome: 'Santa Cruz da Esperança', codigoIbge: '3546256', lat: -21.2632, lng: -47.4526, regiao: 'Região de Ribeirão Preto', populacao: 2116 },
  { nome: 'Santa Cruz das Palmeiras', codigoIbge: '3546306', lat: -21.8807, lng: -47.2467, regiao: 'Região de Campinas', populacao: 28864 },
  { nome: 'Santa Cruz do Rio Pardo', codigoIbge: '3546405', lat: -22.7871, lng: -49.5871, regiao: 'Região de Marília', populacao: 46442 },
  { nome: 'Santa Ernestina', codigoIbge: '3546504', lat: -21.4548, lng: -48.3759, regiao: 'Região de Ribeirão Preto', populacao: 6118 },
  { nome: 'Santa Fé do Sul', codigoIbge: '3546603', lat: -20.251, lng: -50.9456, regiao: 'Região de São José do Rio Preto', populacao: 34794 },
  { nome: 'Santa Gertrudes', codigoIbge: '3546702', lat: -22.4715, lng: -47.5285, regiao: 'Região de Campinas', populacao: 23611 },
  { nome: 'Santa Isabel', codigoIbge: '3546801', lat: -23.2947, lng: -46.2362, regiao: 'Região de São Paulo', populacao: 53174 },
  { nome: 'Santa Lúcia', codigoIbge: '3546900', lat: -21.661, lng: -48.0751, regiao: 'Região de Araraquara', populacao: 7149 },
  { nome: 'Santa Maria da Serra', codigoIbge: '3547007', lat: -22.5376, lng: -48.1552, regiao: 'Região de Campinas', populacao: 5243 },
  { nome: 'Santa Mercedes', codigoIbge: '3547106', lat: -21.3095, lng: -51.7387, regiao: 'Região de Presidente Prudente', populacao: 2956 },
  { nome: 'Santana da Ponte Pensa', codigoIbge: '3547205', lat: -20.2443, lng: -50.7952, regiao: 'Região de São José do Rio Preto', populacao: 1670 },
  { nome: 'Santana de Parnaíba', codigoIbge: '3547304', lat: -23.449, lng: -46.9224, regiao: 'Região de São Paulo', populacao: 154105 },
  { nome: 'Santa Rita d\'Oeste', codigoIbge: '3547403', lat: -20.0917, lng: -50.8135, regiao: 'Região de São José do Rio Preto', populacao: 2733 },
  { nome: 'Santa Rita do Passa Quatro', codigoIbge: '3547502', lat: -21.6963, lng: -47.4952, regiao: 'Região de Araraquara', populacao: 24833 },
  { nome: 'Santa Rosa de Viterbo', codigoIbge: '3547601', lat: -21.4962, lng: -47.3568, regiao: 'Região de Ribeirão Preto', populacao: 23411 },
  { nome: 'Santa Salete', codigoIbge: '3547650', lat: -20.2673, lng: -50.7254, regiao: 'Região de São José do Rio Preto', populacao: 1645 },
  { nome: 'Santo Anastácio', codigoIbge: '3547700', lat: -22.0356, lng: -51.7074, regiao: 'Região de Presidente Prudente', populacao: 17963 },
  { nome: 'Santo André', codigoIbge: '3547809', lat: -23.7297, lng: -46.4399, regiao: 'Região de São Paulo', populacao: 748919 },
  { nome: 'Santo Antônio da Alegria', codigoIbge: '3547908', lat: -21.0847, lng: -47.2005, regiao: 'Região de Ribeirão Preto', populacao: 6775 },
  { nome: 'Santo Antônio de Posse', codigoIbge: '3548005', lat: -22.6078, lng: -46.9443, regiao: 'Região de Campinas', populacao: 23244 },
  { nome: 'Santo Antônio do Aracanguá', codigoIbge: '3548054', lat: -20.8604, lng: -50.5256, regiao: 'Região de Araçatuba', populacao: 8379 },
  { nome: 'Santo Antônio do Jardim', codigoIbge: '3548104', lat: -22.1303, lng: -46.6804, regiao: 'Região de Campinas', populacao: 6126 },
  { nome: 'Santo Antônio do Pinhal', codigoIbge: '3548203', lat: -22.8168, lng: -45.704, regiao: 'Região de São José dos Campos', populacao: 7133 },
  { nome: 'Santo Expedito', codigoIbge: '3548302', lat: -21.8245, lng: -51.3659, regiao: 'Região de Presidente Prudente', populacao: 3000 },
  { nome: 'Santópolis do Aguapeí', codigoIbge: '3548401', lat: -21.67, lng: -50.5176, regiao: 'Região de Araçatuba', populacao: 3899 },
  { nome: 'Santos', codigoIbge: '3548500', lat: -23.8613, lng: -46.2674, regiao: 'Região de São Paulo', populacao: 418608 },
  { nome: 'São Bento do Sapucaí', codigoIbge: '3548609', lat: -22.6621, lng: -45.6802, regiao: 'Região de São José dos Campos', populacao: 11674 },
  { nome: 'São Bernardo do Campo', codigoIbge: '3548708', lat: -23.7995, lng: -46.5536, regiao: 'Região de São Paulo', populacao: 810729 },
  { nome: 'São Caetano do Sul', codigoIbge: '3548807', lat: -23.6234, lng: -46.5621, regiao: 'Região de São Paulo', populacao: 165655 },
  { nome: 'São Carlos', codigoIbge: '3548906', lat: -21.9019, lng: -47.8762, regiao: 'Região de Araraquara', populacao: 254857 },
  { nome: 'São Francisco', codigoIbge: '3549003', lat: -20.3603, lng: -50.6786, regiao: 'Região de São José do Rio Preto', populacao: 2602 },
  { nome: 'São João da Boa Vista', codigoIbge: '3549102', lat: -21.97, lng: -46.7986, regiao: 'Região de Campinas', populacao: 92547 },
  { nome: 'São João das Duas Pontes', codigoIbge: '3549201', lat: -20.4198, lng: -50.3891, regiao: 'Região de São José do Rio Preto', populacao: 2580 },
  { nome: 'São João de Iracema', codigoIbge: '3549250', lat: -20.5129, lng: -50.365, regiao: 'Região de São José do Rio Preto', populacao: 1846 },
  { nome: 'São João do Pau d\'Alho', codigoIbge: '3549300', lat: -21.2062, lng: -51.6675, regiao: 'Região de Presidente Prudente', populacao: 2242 },
  { nome: 'São Joaquim da Barra', codigoIbge: '3549409', lat: -20.5346, lng: -47.9294, regiao: 'Região de Ribeirão Preto', populacao: 48558 },
  { nome: 'São José da Bela Vista', codigoIbge: '3549508', lat: -20.595, lng: -47.6274, regiao: 'Região de Ribeirão Preto', populacao: 7626 },
  { nome: 'São José do Barreiro', codigoIbge: '3549607', lat: -22.7361, lng: -44.5859, regiao: 'Região de São José dos Campos', populacao: 3853 },
  { nome: 'São José do Rio Pardo', codigoIbge: '3549706', lat: -21.5936, lng: -46.9015, regiao: 'Região de Campinas', populacao: 52205 },
  { nome: 'São José do Rio Preto', codigoIbge: '3549805', lat: -20.7979, lng: -49.3651, regiao: 'Região de São José do Rio Preto', populacao: 480393 },
  { nome: 'São José dos Campos', codigoIbge: '3549904', lat: -23.0913, lng: -45.915, regiao: 'Região de São José dos Campos', populacao: 697054 },
  { nome: 'São Lourenço da Serra', codigoIbge: '3549953', lat: -23.8436, lng: -46.932, regiao: 'Região de São Paulo', populacao: 16067 },
  { nome: 'São Luiz do Paraitinga', codigoIbge: '3550001', lat: -23.2585, lng: -45.2303, regiao: 'Região de São José dos Campos', populacao: 10337 },
  { nome: 'São Manuel', codigoIbge: '3550100', lat: -22.6826, lng: -48.566, regiao: 'Região de Bauru', populacao: 37289 },
  { nome: 'São Miguel Arcanjo', codigoIbge: '3550209', lat: -23.9364, lng: -47.9915, regiao: 'Região de Sorocaba', populacao: 32039 },
  { nome: 'São Paulo', codigoIbge: '3550308', lat: -23.6305, lng: -46.631, regiao: 'Região de São Paulo', populacao: 11451999 },
  { nome: 'São Pedro', codigoIbge: '3550407', lat: -22.5582, lng: -47.9053, regiao: 'Região de Campinas', populacao: 38256 },
  { nome: 'São Pedro do Turvo', codigoIbge: '3550506', lat: -22.7045, lng: -49.7494, regiao: 'Região de Marília', populacao: 7217 },
  { nome: 'São Roque', codigoIbge: '3550605', lat: -23.5414, lng: -47.1194, regiao: 'Região de Sorocaba', populacao: 79484 },
  { nome: 'São Sebastião', codigoIbge: '3550704', lat: -23.8523, lng: -45.5236, regiao: 'Região de São José dos Campos', populacao: 81595 },
  { nome: 'São Sebastião da Grama', codigoIbge: '3550803', lat: -21.7496, lng: -46.7548, regiao: 'Região de Campinas', populacao: 10441 },
  { nome: 'São Simão', codigoIbge: '3550902', lat: -21.4529, lng: -47.5721, regiao: 'Região de Ribeirão Preto', populacao: 13442 },
  { nome: 'São Vicente', codigoIbge: '3551009', lat: -23.9644, lng: -46.4955, regiao: 'Região de São Paulo', populacao: 329911 },
  { nome: 'Sarapuí', codigoIbge: '3551108', lat: -23.6564, lng: -47.7724, regiao: 'Região de Sorocaba', populacao: 10369 },
  { nome: 'Sarutaiá', codigoIbge: '3551207', lat: -23.2574, lng: -49.482, regiao: 'Região de Marília', populacao: 3704 },
  { nome: 'Sebastianópolis do Sul', codigoIbge: '3551306', lat: -20.6128, lng: -49.9213, regiao: 'Região de São José do Rio Preto', populacao: 3130 },
  { nome: 'Serra Azul', codigoIbge: '3551405', lat: -21.2846, lng: -47.5373, regiao: 'Região de Ribeirão Preto', populacao: 12746 },
  { nome: 'Serrana', codigoIbge: '3551504', lat: -21.2104, lng: -47.6149, regiao: 'Região de Ribeirão Preto', populacao: 43909 },
  { nome: 'Serra Negra', codigoIbge: '3551603', lat: -22.5811, lng: -46.6877, regiao: 'Região de Campinas', populacao: 29894 },
  { nome: 'Sertãozinho', codigoIbge: '3551702', lat: -21.1206, lng: -48.0129, regiao: 'Região de Ribeirão Preto', populacao: 126887 },
  { nome: 'Sete Barras', codigoIbge: '3551801', lat: -24.2852, lng: -47.9324, regiao: 'Região de Sorocaba', populacao: 12730 },
  { nome: 'Severínia', codigoIbge: '3551900', lat: -20.7876, lng: -48.7891, regiao: 'Região de Ribeirão Preto', populacao: 14576 },
  { nome: 'Silveiras', codigoIbge: '3552007', lat: -22.74, lng: -44.8451, regiao: 'Região de São José dos Campos', populacao: 6186 },
  { nome: 'Socorro', codigoIbge: '3552106', lat: -22.6067, lng: -46.5155, regiao: 'Região de Campinas', populacao: 40122 },
  { nome: 'Sorocaba', codigoIbge: '3552205', lat: -23.4705, lng: -47.4478, regiao: 'Região de Sorocaba', populacao: 723682 },
  { nome: 'Sud Mennucci', codigoIbge: '3552304', lat: -20.6156, lng: -50.8816, regiao: 'Região de Araçatuba', populacao: 7355 },
  { nome: 'Sumaré', codigoIbge: '3552403', lat: -22.8376, lng: -47.2497, regiao: 'Região de Campinas', populacao: 279545 },
  { nome: 'Suzano', codigoIbge: '3552502', lat: -23.6016, lng: -46.3075, regiao: 'Região de São Paulo', populacao: 307429 },
  { nome: 'Suzanápolis', codigoIbge: '3552551', lat: -20.5038, lng: -51.0752, regiao: 'Região de São José do Rio Preto', populacao: 3408 },
  { nome: 'Tabapuã', codigoIbge: '3552601', lat: -20.9412, lng: -49.0155, regiao: 'Região de São José do Rio Preto', populacao: 11323 },
  { nome: 'Tabatinga', codigoIbge: '3552700', lat: -21.727, lng: -48.6385, regiao: 'Região de Araraquara', populacao: 14769 },
  { nome: 'Taboão da Serra', codigoIbge: '3552809', lat: -23.6153, lng: -46.7902, regiao: 'Região de São Paulo', populacao: 273542 },
  { nome: 'Taciba', codigoIbge: '3552908', lat: -22.5185, lng: -51.3388, regiao: 'Região de Presidente Prudente', populacao: 6260 },
  { nome: 'Taguaí', codigoIbge: '3553005', lat: -23.4856, lng: -49.4119, regiao: 'Região de Sorocaba', populacao: 12669 },
  { nome: 'Taiaçu', codigoIbge: '3553104', lat: -21.1256, lng: -48.538, regiao: 'Região de Ribeirão Preto', populacao: 5677 },
  { nome: 'Taiúva', codigoIbge: '3553203', lat: -21.1314, lng: -48.4252, regiao: 'Região de Ribeirão Preto', populacao: 6548 },
  { nome: 'Tambaú', codigoIbge: '3553302', lat: -21.5892, lng: -47.2283, regiao: 'Região de Campinas', populacao: 21435 },
  { nome: 'Tanabi', codigoIbge: '3553401', lat: -20.5032, lng: -49.6345, regiao: 'Região de São José do Rio Preto', populacao: 25265 },
  { nome: 'Tapiraí', codigoIbge: '3553500', lat: -24.0089, lng: -47.6352, regiao: 'Região de Sorocaba', populacao: 7996 },
  { nome: 'Tapiratiba', codigoIbge: '3553609', lat: -21.448, lng: -46.7367, regiao: 'Região de Campinas', populacao: 11816 },
  { nome: 'Taquaral', codigoIbge: '3553658', lat: -21.0654, lng: -48.4006, regiao: 'Região de Ribeirão Preto', populacao: 2619 },
  { nome: 'Taquaritinga', codigoIbge: '3553708', lat: -21.4272, lng: -48.5475, regiao: 'Região de Araraquara', populacao: 52260 },
  { nome: 'Taquarituba', codigoIbge: '3553807', lat: -23.5258, lng: -49.224, regiao: 'Região de Sorocaba', populacao: 24350 },
  { nome: 'Taquarivaí', codigoIbge: '3553856', lat: -23.9464, lng: -48.6798, regiao: 'Região de Sorocaba', populacao: 6876 },
  { nome: 'Tarabai', codigoIbge: '3553906', lat: -22.3513, lng: -51.6241, regiao: 'Região de Presidente Prudente', populacao: 6536 },
  { nome: 'Tarumã', codigoIbge: '3553955', lat: -22.7609, lng: -50.5881, regiao: 'Região de Marília', populacao: 14882 },
  { nome: 'Tatuí', codigoIbge: '3554003', lat: -23.3465, lng: -47.847, regiao: 'Região de Sorocaba', populacao: 123942 },
  { nome: 'Taubaté', codigoIbge: '3554102', lat: -23.0734, lng: -45.5041, regiao: 'Região de São José dos Campos', populacao: 310739 },
  { nome: 'Tejupá', codigoIbge: '3554201', lat: -23.3419, lng: -49.3081, regiao: 'Região de Marília', populacao: 4127 },
  { nome: 'Teodoro Sampaio', codigoIbge: '3554300', lat: -22.4231, lng: -52.3853, regiao: 'Região de Presidente Prudente', populacao: 22173 },
  { nome: 'Terra Roxa', codigoIbge: '3554409', lat: -20.7685, lng: -48.3613, regiao: 'Região de Ribeirão Preto', populacao: 7904 },
  { nome: 'Tietê', codigoIbge: '3554508', lat: -23.0476, lng: -47.712, regiao: 'Região de Sorocaba', populacao: 37663 },
  { nome: 'Timburi', codigoIbge: '3554607', lat: -23.1875, lng: -49.6118, regiao: 'Região de Marília', populacao: 2464 },
  { nome: 'Torre de Pedra', codigoIbge: '3554656', lat: -23.2499, lng: -48.2097, regiao: 'Região de Sorocaba', populacao: 2046 },
  { nome: 'Torrinha', codigoIbge: '3554706', lat: -22.4747, lng: -48.1541, regiao: 'Região de Bauru', populacao: 9335 },
  { nome: 'Trabiju', codigoIbge: '3554755', lat: -22.0314, lng: -48.3495, regiao: 'Região de Araraquara', populacao: 1682 },
  { nome: 'Tremembé', codigoIbge: '3554805', lat: -22.9356, lng: -45.5997, regiao: 'Região de São José dos Campos', populacao: 51173 },
  { nome: 'Três Fronteiras', codigoIbge: '3554904', lat: -20.2838, lng: -50.8734, regiao: 'Região de São José do Rio Preto', populacao: 6804 },
  { nome: 'Tuiuti', codigoIbge: '3554953', lat: -22.8425, lng: -46.6925, regiao: 'Região de Campinas', populacao: 6778 },
  { nome: 'Tupã', codigoIbge: '3555000', lat: -21.9432, lng: -50.5185, regiao: 'Região de Marília', populacao: 63928 },
  { nome: 'Tupi Paulista', codigoIbge: '3555109', lat: -21.3797, lng: -51.5753, regiao: 'Região de Presidente Prudente', populacao: 15854 },
  { nome: 'Turiúba', codigoIbge: '3555208', lat: -20.9355, lng: -50.1065, regiao: 'Região de Araçatuba', populacao: 1818 },
  { nome: 'Turmalina', codigoIbge: '3555307', lat: -20.0593, lng: -50.4595, regiao: 'Região de São José do Rio Preto', populacao: 1669 },
  { nome: 'Ubarana', codigoIbge: '3555356', lat: -21.2241, lng: -49.7335, regiao: 'Região de São José do Rio Preto', populacao: 5365 },
  { nome: 'Ubatuba', codigoIbge: '3555406', lat: -23.567, lng: -45.1543, regiao: 'Região de São José dos Campos', populacao: 92981 },
  { nome: 'Ubirajara', codigoIbge: '3555505', lat: -22.5393, lng: -49.6629, regiao: 'Região de Bauru', populacao: 5132 },
  { nome: 'Uchoa', codigoIbge: '3555604', lat: -20.9291, lng: -49.1465, regiao: 'Região de São José do Rio Preto', populacao: 10394 },
  { nome: 'União Paulista', codigoIbge: '3555703', lat: -20.8904, lng: -49.8903, regiao: 'Região de São José do Rio Preto', populacao: 1603 },
  { nome: 'Urânia', codigoIbge: '3555802', lat: -20.2193, lng: -50.6575, regiao: 'Região de São José do Rio Preto', populacao: 8833 },
  { nome: 'Uru', codigoIbge: '3555901', lat: -21.7678, lng: -49.2997, regiao: 'Região de Bauru', populacao: 1387 },
  { nome: 'Urupês', codigoIbge: '3556008', lat: -21.197, lng: -49.2822, regiao: 'Região de São José do Rio Preto', populacao: 13744 },
  { nome: 'Valentim Gentil', codigoIbge: '3556107', lat: -20.4291, lng: -50.1207, regiao: 'Região de São José do Rio Preto', populacao: 14098 },
  { nome: 'Valinhos', codigoIbge: '3556206', lat: -22.974, lng: -46.9783, regiao: 'Região de Campinas', populacao: 126373 },
  { nome: 'Valparaíso', codigoIbge: '3556305', lat: -21.2092, lng: -50.9377, regiao: 'Região de Araçatuba', populacao: 24241 },
  { nome: 'Vargem', codigoIbge: '3556354', lat: -22.8929, lng: -46.4134, regiao: 'Região de Campinas', populacao: 10512 },
  { nome: 'Vargem Grande do Sul', codigoIbge: '3556404', lat: -21.8638, lng: -46.8842, regiao: 'Região de Campinas', populacao: 40133 },
  { nome: 'Vargem Grande Paulista', codigoIbge: '3556453', lat: -23.6203, lng: -47.0155, regiao: 'Região de São Paulo', populacao: 50415 },
  { nome: 'Várzea Paulista', codigoIbge: '3556503', lat: -23.2185, lng: -46.8224, regiao: 'Região de Campinas', populacao: 115771 },
  { nome: 'Vera Cruz', codigoIbge: '3556602', lat: -22.2433, lng: -49.8345, regiao: 'Região de Marília', populacao: 10176 },
  { nome: 'Vinhedo', codigoIbge: '3556701', lat: -23.053, lng: -46.9815, regiao: 'Região de Campinas', populacao: 76540 },
  { nome: 'Viradouro', codigoIbge: '3556800', lat: -20.8752, lng: -48.3061, regiao: 'Região de Ribeirão Preto', populacao: 17414 },
  { nome: 'Vista Alegre do Alto', codigoIbge: '3556909', lat: -21.1803, lng: -48.6499, regiao: 'Região de São José do Rio Preto', populacao: 8109 },
  { nome: 'Vitória Brasil', codigoIbge: '3556958', lat: -20.195, lng: -50.4804, regiao: 'Região de São José do Rio Preto', populacao: 1794 },
  { nome: 'Votorantim', codigoIbge: '3557006', lat: -23.5775, lng: -47.4121, regiao: 'Região de Sorocaba', populacao: 127923 },
  { nome: 'Votuporanga', codigoIbge: '3557105', lat: -20.483, lng: -50.016, regiao: 'Região de São José do Rio Preto', populacao: 96634 },
  { nome: 'Zacarias', codigoIbge: '3557154', lat: -21.1108, lng: -50.0564, regiao: 'Região de Araçatuba', populacao: 2692 },
  { nome: 'Chavantes', codigoIbge: '3557204', lat: -23.0312, lng: -49.7287, regiao: 'Região de Marília', populacao: 12211 },
  { nome: 'Estiva Gerbi', codigoIbge: '3557303', lat: -22.2334, lng: -46.943, regiao: 'Região de Campinas', populacao: 11295 },
];

/**
 * Normalizes city name for comparison (lowercased, accents removed)
 */
export function normalizeCityName(cityName: string): string {
  if (!cityName) return '';
  return cityName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(prefeitura\s+(municipal\s+)?(de\s+)?)/i, '')
    .trim();
}

/**
 * Known phonetic, typo and alternative aliases for SP cities
 */
export const CITY_ALIASES: Record<string, string> = {
  'sao paulo sp': 'São Paulo',
  'sp': 'São Paulo',
  'capital': 'São Paulo',
  'sampa': 'São Paulo',
  'mogi mirim': 'Mogi Mirim',
  'moji mirim': 'Mogi Mirim',
  'mogi guacu': 'Mogi Guaçu',
  'moji guacu': 'Mogi Guaçu',
  'santa barbara': 'Santa Bárbara d\'Oeste',
  'santa barbara d oeste': 'Santa Bárbara d\'Oeste',
  'santa barbara doeste': 'Santa Bárbara d\'Oeste',
  'sao jose dos campos': 'São José dos Campos',
  'sjc': 'São José dos Campos',
  'sao jose do rio preto': 'São José do Rio Preto',
  'sjrp': 'São José do Rio Preto',
  'rio preto': 'São José do Rio Preto',
  'sao bernardo': 'São Bernardo do Campo',
  'sbc': 'São Bernardo do Campo',
  'santo andre': 'Santo André',
  'sao caetano': 'São Caetano do Sul',
  'embu': 'Embu das Artes',
  'ferraz': 'Ferraz de Vasconcelos',
  'itaqua': 'Itaquaquecetuba',
  'suzano': 'Suzano',
  'braganca': 'Bragança Paulista',
  'monte mor': 'Monte Mor',
  'barretos': 'Barretos',
  'pitangueiras': 'Pitangueiras',
  'espirito santo do pinhal': 'Espírito Santo do Pinhal',
  'lencois paulista': 'Lençóis Paulista',
  'sao roque': 'São Roque',
  'sao carlos': 'São Carlos',
  'piracicaba': 'Piracicaba',
  'araraquara': 'Araraquara',
  'limeira': 'Limeira',
  'indaiatuba': 'Indaiatuba',
  'americana': 'Americana',
  'campinas': 'Campinas',
  'santos': 'Santos',
  'osasco': 'Osasco',
  'guarulhos': 'Guarulhos',
  'sorocaba': 'Sorocaba',
  'bauru': 'Bauru',
  'franca': 'Franca',
  'taubate': 'Taubaté',
  'extrama': 'Extrema',
  'extrema': 'Extrema',
  'extrama mg': 'Extrema',
  'extrema mg': 'Extrema',
  'extrama-mg': 'Extrema',
  'extrema-mg': 'Extrema'
};

/**
 * High-accuracy coordinates for strategic and neighboring interstate Brazilian municipalities
 */
export const BRAZIL_INTERSTATE_MUNICIPALITIES: MunicipioSP[] = [
  // Minas Gerais (MG) - Sul de Minas & Divisa SP
  { nome: 'Extrema', codigoIbge: '3125101', lat: -22.8547, lng: -46.3186, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas / Divisa SP)', populacao: 36780 },
  { nome: 'Camanducaia', codigoIbge: '3110509', lat: -22.7561, lng: -46.1436, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 21800 },
  { nome: 'Cambuí', codigoIbge: '3110608', lat: -22.6125, lng: -46.0575, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 29800 },
  { nome: 'Itapeva', codigoIbge: '3133600', lat: -22.7128, lng: -46.2208, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 9800 },
  { nome: 'Toledo', codigoIbge: '3169000', lat: -22.7444, lng: -46.3725, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 6200 },
  { nome: 'Monte Sião', codigoIbge: '3143401', lat: -22.4336, lng: -46.5731, uf: 'MG', regiao: 'Minas Gerais (Circuito das Malhas / Divisa SP)', populacao: 24100 },
  { nome: 'Jacutinga', codigoIbge: '3135100', lat: -22.2858, lng: -46.6117, uf: 'MG', regiao: 'Minas Gerais (Divisa SP)', populacao: 26300 },
  { nome: 'Ouro Fino', codigoIbge: '3146008', lat: -22.2831, lng: -46.3689, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 33900 },
  { nome: 'Pouso Alegre', codigoIbge: '3152501', lat: -22.2300, lng: -45.9364, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 152549 },
  { nome: 'Itajubá', codigoIbge: '3132404', lat: -22.4261, lng: -45.4528, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 97800 },
  { nome: 'Santa Rita do Sapucaí', codigoIbge: '3159605', lat: -22.2525, lng: -45.7036, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 43700 },
  { nome: 'Poços de Caldas', codigoIbge: '3151800', lat: -21.7850, lng: -46.5625, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 166085 },
  { nome: 'Andradas', codigoIbge: '3102605', lat: -22.0667, lng: -46.5694, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 41300 },
  { nome: 'Passos', codigoIbge: '3147907', lat: -20.7189, lng: -46.6097, uf: 'MG', regiao: 'Minas Gerais (Sudoeste de Minas)', populacao: 115900 },
  { nome: 'Varginha', codigoIbge: '3170701', lat: -21.5519, lng: -45.4303, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 136602 },
  { nome: 'Três Corações', codigoIbge: '3169307', lat: -21.6942, lng: -45.2575, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 80000 },
  { nome: 'Juiz de Fora', codigoIbge: '3136702', lat: -21.7642, lng: -43.3497, uf: 'MG', regiao: 'Minas Gerais (Zona da Mata)', populacao: 573285 },
  { nome: 'Uberaba', codigoIbge: '3170107', lat: -19.7483, lng: -47.9319, uf: 'MG', regiao: 'Minas Gerais (Triângulo Mineiro)', populacao: 337836 },
  { nome: 'Uberlândia', codigoIbge: '3170206', lat: -18.9186, lng: -48.2772, uf: 'MG', regiao: 'Minas Gerais (Triângulo Mineiro)', populacao: 699097 },
  { nome: 'Belo Horizonte', codigoIbge: '3106200', lat: -19.9167, lng: -43.9345, uf: 'MG', regiao: 'Minas Gerais (Capital)', populacao: 2315560 },
  { nome: 'Sapucaí-Mirim', codigoIbge: '3165305', lat: -22.7417, lng: -45.7417, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 6800 },
  { nome: 'Gonçalves', codigoIbge: '3127305', lat: -22.6583, lng: -45.8583, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 4800 },
  { nome: 'Paraisópolis', codigoIbge: '3147105', lat: -22.5542, lng: -45.7792, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 21500 },
  { nome: 'Itamonte', codigoIbge: '3133006', lat: -22.2858, lng: -44.8694, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 15700 },
  { nome: 'Passa Quatro', codigoIbge: '3147600', lat: -22.3900, lng: -44.9700, uf: 'MG', regiao: 'Minas Gerais (Sul de Minas)', populacao: 16400 },

  // Rio de Janeiro (RJ) - Vale do Paraíba / Costa Verde & Capital
  { nome: 'Resende', codigoIbge: '3304201', lat: -22.4689, lng: -44.4467, uf: 'RJ', regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 129600 },
  { nome: 'Itatiaia', codigoIbge: '3302254', lat: -22.4961, lng: -44.5631, uf: 'RJ', regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 32000 },
  { nome: 'Porto Real', codigoIbge: '3304151', lat: -22.4183, lng: -44.3414, uf: 'RJ', regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 20000 },
  { nome: 'Barra Mansa', codigoIbge: '3300407', lat: -22.5442, lng: -44.1714, uf: 'RJ', regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 184800 },
  { nome: 'Volta Redonda', codigoIbge: '3306305', lat: -22.5231, lng: -44.1042, uf: 'RJ', regiao: 'Rio de Janeiro (Sul Fluminense)', populacao: 273900 },
  { nome: 'Paraty', codigoIbge: '3303807', lat: -23.2178, lng: -44.7131, uf: 'RJ', regiao: 'Rio de Janeiro (Costa Verde / Divisa SP)', populacao: 44800 },
  { nome: 'Angra dos Reis', codigoIbge: '3300100', lat: -23.0067, lng: -44.3181, uf: 'RJ', regiao: 'Rio de Janeiro (Costa Verde)', populacao: 207000 },
  { nome: 'Rio de Janeiro', codigoIbge: '3304557', lat: -22.9068, lng: -43.1729, uf: 'RJ', regiao: 'Rio de Janeiro (Capital)', populacao: 6211423 },
  { nome: 'Niterói', codigoIbge: '3303302', lat: -22.8833, lng: -43.1036, uf: 'RJ', regiao: 'Rio de Janeiro (Metropolitana)', populacao: 515300 },
  { nome: 'Petrópolis', codigoIbge: '3303906', lat: -22.5050, lng: -43.1789, uf: 'RJ', regiao: 'Rio de Janeiro (Região Serrana)', populacao: 306600 },
  { nome: 'Duque de Caxias', codigoIbge: '3301702', lat: -22.7858, lng: -43.3061, uf: 'RJ', regiao: 'Rio de Janeiro (Baixada Fluminense)', populacao: 924600 },

  // Paraná (PR) - Norte Pioneiro / Curitiba / Norte PR
  { nome: 'Curitiba', codigoIbge: '4106902', lat: -25.4295, lng: -49.2712, uf: 'PR', regiao: 'Paraná (Capital)', populacao: 1773733 },
  { nome: 'São José dos Pinhais', codigoIbge: '4125506', lat: -25.5347, lng: -49.2064, uf: 'PR', regiao: 'Paraná (Região Metropolitana)', populacao: 329000 },
  { nome: 'Londrina', codigoIbge: '4113700', lat: -23.3045, lng: -51.1696, uf: 'PR', regiao: 'Paraná (Norte do Paraná)', populacao: 555937 },
  { nome: 'Maringá', codigoIbge: '4115200', lat: -23.4205, lng: -51.9333, uf: 'PR', regiao: 'Paraná (Norte Central)', populacao: 409657 },
  { nome: 'Jacarezinho', codigoIbge: '4111803', lat: -23.1600, lng: -49.9744, uf: 'PR', regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 40300 },
  { nome: 'Cambará', codigoIbge: '4103602', lat: -23.0461, lng: -50.0736, uf: 'PR', regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 25400 },
  { nome: 'Ribeirão Claro', codigoIbge: '4121703', lat: -23.1939, lng: -49.7578, uf: 'PR', regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 10800 },
  { nome: 'Carlópolis', codigoIbge: '4104501', lat: -23.4253, lng: -49.7225, uf: 'PR', regiao: 'Paraná (Norte Pioneiro / Divisa SP)', populacao: 14300 },
  { nome: 'Santo Antônio da Platina', codigoIbge: '4124103', lat: -23.2950, lng: -50.0817, uf: 'PR', regiao: 'Paraná (Norte Pioneiro)', populacao: 46200 },
  { nome: 'Paranaguá', codigoIbge: '4118204', lat: -25.5206, lng: -48.5092, uf: 'PR', regiao: 'Paraná (Litoral)', populacao: 156000 },
  { nome: 'Ponta Grossa', codigoIbge: '4119905', lat: -25.0950, lng: -50.1619, uf: 'PR', regiao: 'Paraná (Campos Gerais)', populacao: 358800 },
  { nome: 'Foz do Iguaçu', codigoIbge: '4108304', lat: -25.5161, lng: -54.5853, uf: 'PR', regiao: 'Paraná (Oeste)', populacao: 285400 },
  { nome: 'Cascavel', codigoIbge: '4104808', lat: -24.9578, lng: -53.4594, uf: 'PR', regiao: 'Paraná (Oeste)', populacao: 348000 },

  // Mato Grosso do Sul (MS) - Leste / Divisa Rio Paraná & Capital
  { nome: 'Três Lagoas', codigoIbge: '5008305', lat: -20.7850, lng: -51.7061, uf: 'MS', regiao: 'Mato Grosso do Sul (Divisa SP / Rio Paraná)', populacao: 132100 },
  { nome: 'Bataguassu', codigoIbge: '5001904', lat: -21.7139, lng: -52.4222, uf: 'MS', regiao: 'Mato Grosso do Sul (Divisa SP)', populacao: 23600 },
  { nome: 'Brasilândia', codigoIbge: '5002308', lat: -21.2561, lng: -52.0347, uf: 'MS', regiao: 'Mato Grosso do Sul (Divisa SP)', populacao: 12100 },
  { nome: 'Campo Grande', codigoIbge: '5002704', lat: -20.4428, lng: -54.6461, uf: 'MS', regiao: 'Mato Grosso do Sul (Capital)', populacao: 897938 },
  { nome: 'Dourados', codigoIbge: '5003702', lat: -22.2231, lng: -54.8056, uf: 'MS', regiao: 'Mato Grosso do Sul', populacao: 243300 },
  { nome: 'Corumbá', codigoIbge: '5003207', lat: -19.0097, lng: -57.6533, uf: 'MS', regiao: 'Mato Grosso do Sul (Pantanal)', populacao: 112000 },

  // Polos Nacionais & Capitais Estratégicas
  { nome: 'Brasília', codigoIbge: '5300108', lat: -15.7975, lng: -47.8919, uf: 'DF', regiao: 'Distrito Federal (Capital Federal)', populacao: 2817068 },
  { nome: 'Goiânia', codigoIbge: '5208707', lat: -16.6864, lng: -49.2646, uf: 'GO', regiao: 'Goiás (Capital)', populacao: 1437237 },
  { nome: 'Salvador', codigoIbge: '2927408', lat: -12.9718, lng: -38.5016, uf: 'BA', regiao: 'Bahia (Capital)', populacao: 2418005 },
  { nome: 'Recife', codigoIbge: '2611606', lat: -8.0476, lng: -34.8770, uf: 'PE', regiao: 'Pernambuco (Capital)', populacao: 1488920 },
  { nome: 'Fortaleza', codigoIbge: '2304400', lat: -3.7319, lng: -38.5267, uf: 'CE', regiao: 'Ceará (Capital)', populacao: 2428678 },
  { nome: 'Porto Alegre', codigoIbge: '4314902', lat: -30.0346, lng: -51.2177, uf: 'RS', regiao: 'Rio Grande do Sul (Capital)', populacao: 1332570 },
  { nome: 'Florianópolis', codigoIbge: '4205407', lat: -27.5954, lng: -48.5480, uf: 'SC', regiao: 'Santa Catarina (Capital)', populacao: 537213 },
  { nome: 'Joinville', codigoIbge: '4209102', lat: -26.3045, lng: -48.8487, uf: 'SC', regiao: 'Santa Catarina (Norte)', populacao: 616323 },
  { nome: 'Vitória', codigoIbge: '3205309', lat: -20.3155, lng: -40.3128, uf: 'ES', regiao: 'Espírito Santo (Capital)', populacao: 322800 },
  { nome: 'Cuiabá', codigoIbge: '5103403', lat: -15.6010, lng: -56.0979, uf: 'MT', regiao: 'Mato Grosso (Capital)', populacao: 650900 },
  { nome: 'Manaus', codigoIbge: '1302603', lat: -3.1190, lng: -60.0217, uf: 'AM', regiao: 'Amazonas (Capital)', populacao: 2063500 },
  { nome: 'Belém', codigoIbge: '1501402', lat: -1.4558, lng: -48.4902, uf: 'PA', regiao: 'Pará (Capital)', populacao: 1303300 }
];

/**
 * Finds a municipality across São Paulo or Any Brazilian State
 */
export function findMunicipioUniversal(cityName: string, targetUf?: string): MunicipioSP | undefined {
  if (!cityName) return undefined;

  const rawClean = cityName.trim()
    .replace(/^Prefeitura\s+Municipal\s+de\s+/i, '')
    .replace(/^Prefeitura\s+de\s+/i, '')
    .replace(/^Prefeitura\s+/i, '')
    .replace(/\s*-\s*[A-Za-z]{2}$/, '')
    .replace(/\s*\/[A-Za-z]{2}$/, '')
    .replace(/\s*\([A-Za-z]{2}\)$/, '')
    .trim();

  // 1. Try SP dataset first
  const spMatch = findMunicipioSP(rawClean);
  if (spMatch && (!targetUf || targetUf.toUpperCase() === 'SP')) {
    return { ...spMatch, uf: 'SP' };
  }

  // 2. Check Brazil-wide repository
  const brMatch = findMunicipioBrasil(cityName, targetUf);
  if (brMatch) {
    return {
      nome: brMatch.nome,
      codigoIbge: brMatch.codigoIbge,
      lat: brMatch.lat,
      lng: brMatch.lng,
      regiao: brMatch.regiao,
      populacao: brMatch.populacao,
      uf: brMatch.uf
    };
  }

  const normalized = normalizeCityName(rawClean);
  if (!normalized) return undefined;

  // 3. Search Interstate database
  const targetNormUf = targetUf ? targetUf.trim().toUpperCase() : undefined;

  let interstateMatch = BRAZIL_INTERSTATE_MUNICIPALITIES.find(m => {
    const mNorm = normalizeCityName(m.nome);
    const nameMatches = mNorm === normalized;
    if (nameMatches) {
      if (!targetNormUf) return true;
      return m.uf?.toUpperCase() === targetNormUf;
    }
    return false;
  });

  if (interstateMatch) {
    return interstateMatch;
  }

  // 4. Fallback to SP match if found previously
  if (spMatch) {
    return { ...spMatch, uf: 'SP' };
  }

  return undefined;
}

/**
 * Resolves municipality coordinates, with instant lookup for all Brazilian cities,
 * with fallback to official IBGE Localidades / OpenStreetMap geocoders.
 */
export async function resolveMunicipioCoordinates(
  cityName: string,
  uf?: string
): Promise<{ lat: number; lng: number; uf?: string; codigoIbge?: string } | undefined> {
  const trimmed = (cityName || '').trim();
  if (!trimmed) return undefined;

  // 1. Instant Synchronous Lookup in Built-in SP and Brazil datasets
  const universalMatch = findMunicipioUniversal(trimmed, uf);
  if (universalMatch) {
    return {
      lat: universalMatch.lat,
      lng: universalMatch.lng,
      uf: universalMatch.uf || 'SP',
      codigoIbge: universalMatch.codigoIbge
    };
  }

  // 2. Try official IBGE REST API
  try {
    const ibgeInfo = await fetchIbgeMunicipalityInfo(trimmed, uf);
    if (ibgeInfo) {
      return {
        lat: ibgeInfo.lat,
        lng: ibgeInfo.lng,
        uf: ibgeInfo.uf,
        codigoIbge: ibgeInfo.codigoIbge
      };
    }
  } catch {}

  const normalizedUf = (uf || '').trim().toUpperCase();

  // 3. Try OpenStreetMap Photon Geocoder (Fast and CORS-friendly)
  try {
    const cleanQuery = `${trimmed}${normalizedUf && normalizedUf !== 'SP' ? ` ${normalizedUf}` : ''} Brasil`;
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      const first = data?.features?.[0];
      if (first?.geometry?.coordinates) {
        const [lon, lat] = first.geometry.coordinates;
        if (typeof lat === 'number' && typeof lon === 'number') {
          return {
            lat,
            lng: lon,
            uf: first.properties?.state || normalizedUf || 'BR'
          };
        }
      }
    }
  } catch { }

  // 4. Fallback to state centroid if known
  const stateCenter = normalizedUf ? STATE_CENTERS[normalizedUf] : undefined;
  if (stateCenter) {
    return { ...stateCenter, uf: normalizedUf };
  }

  return undefined;
}

/**
 * Finds the exact or best matching São Paulo municipality object by city name
 */
export function findMunicipioSP(cityName: string): MunicipioSP | undefined {
  if (!cityName) return undefined;

  const rawClean = cityName.trim()
    .replace(/^Prefeitura\s+Municipal\s+de\s+/i, '')
    .replace(/^Prefeitura\s+de\s+/i, '')
    .replace(/^Prefeitura\s+/i, '')
    .replace(/\s*-\s*[A-Za-z]{2}$/, '')
    .replace(/\s*\/[A-Za-z]{2}$/, '')
    .replace(/\s*\([A-Za-z]{2}\)$/, '')
    .trim();
  const normalized = normalizeCityName(rawClean);

  if (!normalized) return undefined;

  let found: MunicipioSP | undefined;

  // 1. Direct alias lookup
  if (CITY_ALIASES[normalized]) {
    const aliasTarget = CITY_ALIASES[normalized];
    found = SP_MUNICIPALITIES.find(m => m.nome.toLowerCase() === aliasTarget.toLowerCase());
  }

  // 2. Exact match on normalized name
  if (!found) {
    found = SP_MUNICIPALITIES.find(
      m => normalizeCityName(m.nome) === normalized
    );
  }

  // 3. Normalized without hyphens/spaces match
  if (!found) {
    const strippedNorm = normalized.replace(/[-\s]/g, '');
    found = SP_MUNICIPALITIES.find(
      m => normalizeCityName(m.nome).replace(/[-\s]/g, '') === strippedNorm
    );
  }

  // 4. Word boundary start match (e.g. "São Paulo - Centro")
  if (!found) {
    found = SP_MUNICIPALITIES.find(
      m => normalized.startsWith(normalizeCityName(m.nome))
    );
  }

  if (found) {
    const ibgePop = getIbgePopulation(found.nome, found.codigoIbge);
    return {
      ...found,
      populacao: ibgePop || found.populacao,
      uf: 'SP'
    };
  }

  return undefined;
}

/**
 * Filter autocomplete suggestions across São Paulo and Brazil
 */
export function searchMunicipalities(query: string, limit = 10, ufFilter?: string): MunicipioSP[] {
  const brResults = searchMunicipalitiesBrasil(query, limit, ufFilter);
  return brResults.map(m => ({
    nome: m.nome,
    codigoIbge: m.codigoIbge,
    lat: m.lat,
    lng: m.lng,
    regiao: m.regiao,
    populacao: m.populacao,
    uf: m.uf
  }));
}

