import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import { convertMinutesToHourString } from './utils/cnvert-minutes-to-hour-string';
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';

const app = express();
app.use(express.json());
app.use(cors());

const prisma = new PrismaClient({ log: ['query'] });

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  });

  return response.status(200).json(games);
});

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return response.status(200).json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: convertMinutesToHourString(ad.hourStart),
      hourEnd: convertMinutesToHourString(ad.hourEnd),
    }
  }));
});

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;
  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId,
    },
  });

  return response.status(200).json({ discord: ad.discord });
});

app.post('/games/:id/ads', async (request, response) => {
  const { id: gameId } = request.params;
  const {
    body: {
      name,
      yearsPlaying,
      discord,
      weekDays,
      hourStart,
      hourEnd,
      useVoiceChannel,
    }
  } = request;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name,
      yearsPlaying,
      discord,
      weekDays: weekDays.join(','),
      hourStart: convertHourStringToMinutes(hourStart),
      hourEnd: convertHourStringToMinutes(hourEnd),
      useVoiceChannel,
    },
  });

  return response.status(201).json(ad);
});

app.listen(3333, () => console.log('Server is running in port 3333!'));
