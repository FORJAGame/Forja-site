import type { Article, Game, Guild } from '@/payload-types'

type GuildSeed = Pick<Guild, 'name' | 'shortDescription'>
type GameSeed = Pick<Game, 'title' | 'synopsis' | 'developmentStatus' | 'platforms'> & { guildName: string }
type ArticleSeed = Pick<Article, 'title' | 'description' | 'authors' | 'date' | 'venue' | 'url'> & {
  guildName?: string
}

export const guilds: GuildSeed[] = [
  { name: 'Aurora', shortDescription: 'Narrativa e jogos de exploração.' },
  { name: 'Bigorna', shortDescription: 'Gameplay e sistemas.' },
  { name: 'Centelha', shortDescription: 'Jogos educativos.' },
  { name: 'Brasa', shortDescription: 'Arte e animação.' },
  { name: 'Têmpera', shortDescription: 'Áudio e trilha sonora.' },
  { name: 'Faísca', shortDescription: 'Game jams e protótipos rápidos.' },
  { name: 'Malha', shortDescription: 'Multiplayer e redes.' },
  { name: 'Fornalha', shortDescription: 'Engines e ferramentas.' },
]

export const games: GameSeed[] = [
  {
    title: 'Ecos de Ferro',
    synopsis: 'Um metroidvania sobre uma ferreira que reconstrói uma cidade mecânica peça por peça.',
    developmentStatus: 'in-development',
    platforms: ['pc', 'web'],
    guildName: 'Aurora',
  },
  {
    title: 'Maré Baixa',
    synopsis: 'Puzzle cooperativo para dois jogadores em uma vila de pescadores que afunda.',
    developmentStatus: 'released',
    platforms: ['pc'],
    guildName: 'Malha',
  },
  {
    title: 'Circuito 404',
    synopsis: 'Roguelike de cartas onde cada deck é um programa que você depura em tempo real.',
    developmentStatus: 'released',
    platforms: ['pc', 'web'],
    guildName: 'Fornalha',
  },
]

export const articles: ArticleSeed[] = [
  {
    title: 'Geração procedural de masmorras com gramáticas de grafos',
    description: 'Como gramáticas de grafos geram masmorras jogáveis e variadas.',
    authors: [{ name: 'Ana Lima' }, { name: 'Pedro Souza' }, { name: 'Júlia Rocha' }],
    date: '2026-09-01T00:00:00.000Z',
    venue: 'SBGames 2026',
    url: 'https://example.com/artigos/masmorras-procedurais',
    guildName: 'Bigorna',
  },
  {
    title: 'Jogos sérios no ensino de lógica: um estudo com 120 estudantes',
    description: 'Resultados de um experimento com jogos no ensino de lógica.',
    authors: [{ name: 'Carla Menezes' }, { name: 'Rafael Duarte' }],
    date: '2026-06-15T00:00:00.000Z',
    venue: 'Revista RBIE',
    url: 'https://example.com/artigos/jogos-serios-logica',
    guildName: 'Centelha',
  },
  {
    title: 'Áudio adaptativo em jogos de exploração: um framework leve',
    description: 'Um framework para trilhas que reagem ao estado do jogo.',
    authors: [{ name: 'Bruno Alves' }, { name: 'Letícia Prado' }],
    date: '2025-10-20T00:00:00.000Z',
    venue: 'SBGames 2025',
    url: 'https://example.com/artigos/audio-adaptativo',
  },
]
