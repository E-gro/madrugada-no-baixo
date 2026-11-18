export const GAME_CONFIG = {
  startingMoney: 180,
  startingSleep: 100,
  totalStoryWaves: 10,
  sellRefundRatio: 0.7
};

export const TOWER_TYPES = [
  {
    id: 'chinelo',
    hotkey: '1',
    emoji: '🩴',
    name: 'Seu Jorge da Chinelada',
    shortName: 'Seu Jorge',
    role: 'Longo Alcance • Anti-Moto',
    cost: 50,
    color: 0xffd166,
    description: 'Veterano da rua com mira teleguiada de Havaiana branca e azul. Bônus contra motos rápidas!',
    levels: [
      { damage: 24, range: 8.2, fireRate: 1.25, upgradeCost: 65, bonusMoto: 1.35, title: 'Chinelo Havaiana Tradicional' },
      { damage: 40, range: 9.4, fireRate: 1.55, upgradeCost: 110, bonusMoto: 1.45, title: 'Chinelo Duplo de Borracha Maciça' },
      { damage: 70, range: 11.0, fireRate: 2.0, upgradeCost: null, bonusMoto: 1.6, title: 'Mestre faixa-preta do Chinelo Bumerangue' }
    ]
  },
  {
    id: 'balde',
    hotkey: '2',
    emoji: '🪣',
    name: 'Dona Neide do Balde',
    shortName: 'Dona Neide',
    role: 'Área • Água Gelada (Slow)',
    cost: 65,
    color: 0x38bdf8,
    description: 'Joga baldes de água gelada na rua: molha em área e reduz a velocidade em até 45%!',
    levels: [
      { damage: 16, range: 6.4, fireRate: 0.85, splashRadius: 2.5, slowFactor: 0.62, slowDuration: 2.6, upgradeCost: 75, title: 'Balde de Água da Lavanderia' },
      { damage: 28, range: 7.2, fireRate: 1.05, splashRadius: 3.1, slowFactor: 0.54, slowDuration: 3.2, upgradeCost: 130, title: 'Balde com Gelo & Sabão em Pó' },
      { damage: 48, range: 8.2, fireRate: 1.3, splashRadius: 3.8, slowFactor: 0.45, slowDuration: 3.8, upgradeCost: null, title: 'Mangueira de Alta Pressão do Condomínio' }
    ]
  },
  {
    id: 'ovo',
    hotkey: '3',
    emoji: '🥚',
    name: 'República do Ovo',
    shortName: 'República',
    role: 'Tiro Rápido • Quebra Blindagem',
    cost: 85,
    color: 0xfbbf24,
    description: 'Estudantes virados no energético atirando rajadas de ovos que fazem o alvo receber +30% de dano!',
    levels: [
      { damage: 13, range: 7.0, fireRate: 2.6, vulnBonus: 0.25, vulnDuration: 3.0, upgradeCost: 90, title: 'Cartela de 30 Ovos' },
      { damage: 21, range: 7.8, fireRate: 3.3, vulnBonus: 0.35, vulnDuration: 3.6, upgradeCost: 150, title: 'Ovos + Tomates Maduros da Feira' },
      { damage: 34, range: 8.6, fireRate: 4.2, vulnBonus: 0.48, vulnDuration: 4.2, upgradeCost: null, title: 'Catapulta Universitária da Engenharia' }
    ]
  },
  {
    id: 'jammer',
    hotkey: '4',
    emoji: '📡',
    name: 'Síndico do Jammer EMP',
    shortName: 'Síndico EMP',
    role: 'Raio Elétrico • Anti-Paredão',
    cost: 120,
    color: 0xc084fc,
    description: 'Antena parabólica + transformador de micro-ondas que corta Bluetooth e frita Carros de Som em cadeia!',
    levels: [
      { damage: 46, range: 7.6, fireRate: 0.78, chainCount: 2, bonusSom: 1.5, upgradeCost: 135, title: 'Jammer de Bluetooth Caseiro' },
      { damage: 78, range: 8.6, fireRate: 0.95, chainCount: 3, bonusSom: 1.65, upgradeCost: 210, title: 'Bobina de Micro-ondas Turbinada' },
      { damage: 135, range: 9.8, fireRate: 1.18, chainCount: 4, bonusSom: 1.85, upgradeCost: null, title: 'Curto-Circuito Geral da Subestação' }
    ]
  }
];

export const ENEMY_TYPES = {
  moto_cg: {
    id: 'moto_cg',
    name: 'CG 125 sem Escapamento',
    category: 'moto',
    hp: 62,
    speed: 4.4,
    reward: 14,
    sleepDamage: 8,
    scale: 1.0,
    shout: ['RAN-DAN-DAN!', 'PÁ-PÁ-PÁ!', 'VRUUUM!']
  },
  moto_grau: {
    id: 'moto_grau',
    name: ' Rei do Grau & Corte de Giro',
    category: 'moto',
    hp: 95,
    speed: 5.7,
    reward: 20,
    sleepDamage: 10,
    scale: 1.05,
    shout: ['CORTE DE GIRO!', 'OLHA O GRAU!', 'RANDANDANDAN!']
  },
  carro_som: {
    id: 'carro_som',
    name: 'Golzinho Rebaixado Treme-Vidro',
    category: 'som',
    hp: 240,
    speed: 2.65,
    reward: 32,
    sleepDamage: 16,
    scale: 1.1,
    shout: ['TUTS TUTS!', 'GRAVE BATENDO!', 'TREME A JANELA!']
  },
  paredao: {
    id: 'paredao',
    name: 'Picape do Paredão Acústico',
    category: 'som',
    hp: 560,
    speed: 1.85,
    reward: 55,
    sleepDamage: 24,
    scale: 1.22,
    shout: ['PAREDÃO 20.000W!', 'ACORDA GERAL!', 'BUMM BUMM!']
  },
  trio_boss: {
    id: 'trio_boss',
    name: 'Trio Elétrico Clandestino 3AM',
    category: 'som',
    isBoss: true,
    hp: 1650,
    speed: 1.35,
    reward: 160,
    sleepDamage: 45,
    scale: 1.4,
    shout: ['CARNAVAL FORA DE ÉPOCA!', 'NINGUÉM DORME HOJE!', 'VOLUME MÁXIMO!']
  }
};

export const STORY_WAVES = [
  {
    clock: '02:15',
    subtitle: 'Os primeiros motoqueiros sem filtro descobriram o atalho pelo Baixo!',
    groups: [
      { type: 'moto_cg', count: 6, interval: 1.35, delay: 0.5 }
    ]
  },
  {
    clock: '02:40',
    subtitle: 'Comboio da madrugada dando corte de giro na esquina!',
    groups: [
      { type: 'moto_cg', count: 7, interval: 1.05, delay: 0.4 },
      { type: 'moto_grau', count: 3, interval: 1.3, delay: 3.0 }
    ]
  },
  {
    clock: '03:05',
    subtitle: 'Alerta de Grave! Chegou o primeiro Golzinho Rebaixado com porta-malas aberto!',
    groups: [
      { type: 'moto_cg', count: 6, interval: 0.95, delay: 0.3 },
      { type: 'carro_som', count: 2, interval: 3.2, delay: 2.2 },
      { type: 'moto_grau', count: 4, interval: 1.1, delay: 2.0 }
    ]
  },
  {
    clock: '03:30',
    subtitle: 'Encontro clandestino de motos e som automotivo na rua de trás!',
    groups: [
      { type: 'moto_grau', count: 7, interval: 0.85, delay: 0.3 },
      { type: 'carro_som', count: 4, interval: 2.5, delay: 1.5 }
    ]
  },
  {
    clock: '03:55',
    subtitle: '⚠️ CHEFE À VISTA: A Picape do Paredão 20.000W entrou na avenida!',
    groups: [
      { type: 'moto_cg', count: 8, interval: 0.75, delay: 0.2 },
      { type: 'paredao', count: 2, interval: 4.5, delay: 2.0 },
      { type: 'moto_grau', count: 6, interval: 0.85, delay: 1.5 }
    ]
  },
  {
    clock: '04:20',
    subtitle: 'Revoada das 4h20! Enxame de motos furando sinal vermelho!',
    groups: [
      { type: 'moto_grau', count: 14, interval: 0.62, delay: 0.3 },
      { type: 'carro_som', count: 4, interval: 2.0, delay: 1.5 }
    ]
  },
  {
    clock: '04:45',
    subtitle: 'Caravana do Subwoofer! Os vidros dos sobrados estão tremendo!',
    groups: [
      { type: 'carro_som', count: 6, interval: 1.8, delay: 0.4 },
      { type: 'paredao', count: 3, interval: 3.4, delay: 2.0 },
      { type: 'moto_grau', count: 8, interval: 0.7, delay: 1.2 }
    ]
  },
  {
    clock: '05:10',
    subtitle: 'Saída de festa clandestina: todo mundo acelerando junto!',
    groups: [
      { type: 'moto_cg', count: 12, interval: 0.5, delay: 0.2 },
      { type: 'paredao', count: 4, interval: 2.8, delay: 1.5 },
      { type: 'moto_grau', count: 10, interval: 0.58, delay: 1.0 }
    ]
  },
  {
    clock: '05:35',
    subtitle: 'Quase amanhecendo! Os paredões estão tentando acordar o bairro inteiro!',
    groups: [
      { type: 'carro_som', count: 8, interval: 1.35, delay: 0.3 },
      { type: 'paredao', count: 5, interval: 2.4, delay: 1.5 },
      { type: 'moto_grau', count: 12, interval: 0.52, delay: 1.0 }
    ]
  },
  {
    clock: '05:55',
    subtitle: '🚨 CHEFÃO FINAL: O Trio Elétrico Clandestino invadiu o Baixo antes das 6h!',
    groups: [
      { type: 'moto_grau', count: 10, interval: 0.55, delay: 0.3 },
      { type: 'carro_som', count: 5, interval: 1.5, delay: 1.2 },
      { type: 'trio_boss', count: 1, interval: 1.0, delay: 2.5 },
      { type: 'paredao', count: 3, interval: 2.6, delay: 2.5 },
      { type: 'moto_grau', count: 8, interval: 0.5, delay: 1.0 }
    ]
  }
];

export function getWaveDefinition(waveNumber) {
  if (waveNumber <= STORY_WAVES.length) {
    const base = STORY_WAVES[waveNumber - 1];
    const hpMult = 1 + (waveNumber - 1) * 0.14;
    return { ...base, hpMult };
  }
  const extra = waveNumber - STORY_WAVES.length;
  const hpMult = 2.3 + extra * 0.42;
  return {
    clock: `06:${String((extra * 5) % 60).padStart(2, '0')}+`,
    subtitle: `Madrugada Infinita #${extra} — Eles não desistem nem depois do café!`,
    hpMult,
    groups: [
      { type: 'moto_grau', count: 12 + extra * 3, interval: Math.max(0.32, 0.55 - extra * 0.02), delay: 0.3 },
      { type: 'paredao', count: 4 + Math.floor(extra * 1.5), interval: 2.1, delay: 1.5 },
      { type: 'trio_boss', count: 1 + Math.floor(extra / 2), interval: 4.5, delay: 2.5 }
    ]
  };
}
