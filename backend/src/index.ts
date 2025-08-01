import { serve } from '@hono/node-server';
import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { IFactory } from '@climadex/types';
import { IDbFactory } from './types';

import { getMeanTemperatureWarmestQuarter, TIMEFRAMES } from './indicators';

const app = new Hono();

const dbClientPromise = open({
  filename: '../../db.sqlite3',
  driver: sqlite3.Database,
});

app.use('/*', cors());

app.get('/', (c) => {
  // Here is an example of how to read temperatures previsions from the dataset

  const values = [];

  for (const timeframe of TIMEFRAMES) {
    values.push({
      [timeframe]: `${getMeanTemperatureWarmestQuarter({
        latitude: 48.8711312,
        longitude: 2.3462203,
        timeframe: timeframe,
      })}°C`,
    });
  }

  return c.text(
    `Example evolution of temperatures over timeframes : ${JSON.stringify(
      values
    )}`
  );
});

app.get('/reports/:reportId', async (c: Context) => {
  const client = await dbClientPromise;
  const id = c.req.param('reportId');

  const factory = await client.get('SELECT * FROM factories WHERE id = ?;', id);
console.log(`FACTORY ID ✅ ${factory}`);
  return c.json({
      factory:{ 
        factoryName: factory.factory_name,
        address: factory.address,
        country: factory.country,
        latitude: factory.latitude,
        longitude: factory.longitude,
        yearlyRevenue: factory.yearly_revenue,
	riskAssessment: factory.risk_assessment,
      }
    });
});

app.get('/factories', async (c: Context) => {
  const client = await dbClientPromise;

  const query = c.req.query('q');

  const factories = query
    ? await client.all(
        `SELECT * FROM factories WHERE LOWER( factory_name ) LIKE ?;`,
        [`%${query.toLowerCase()}%`]
      )
    : await client.all('SELECT * FROM factories');

  return c.json(
    factories.map(
      (factory: IDbFactory): IFactory => ({
        id: factory.id,
        factoryName: factory.factory_name,
        address: factory.address,
        country: factory.country,
        latitude: factory.latitude,
        longitude: factory.longitude,
        yearlyRevenue: factory.yearly_revenue,
	riskAssessment: factory.risk_assessment,
      })
    )
  );
});

app.post('/factories', async (c: Context) => {
  const client = await dbClientPromise;

  const { factoryName, country, address, latitude, longitude, yearlyRevenue } =
    await c.req.json();
  if (!factoryName || !country || !address || !yearlyRevenue) {
    return c.text('Invalid body.', 400);
  }

/*
  const temperatures: number[] = [];

  for (const timeframe of TIMEFRAMES) {
    const value = getMeanTemperatureWarmestQuarter({
        latitude: +latitude,
        longitude: +longitude,
        timeframe,
      })
      if (value !== null)
	 temperatures.push(value);
      else
        return (null);
  }
*/

  const utils: Record<TIMEFRAMES, (lat: number, lon: number) => number | null> = {
    '2030': (lat, lon) => getMeanTemperatureWarmestQuarter({latitude: lat, longitude: lon, timeframe: '2030'}),
    '2050': (lat, lon) => getMeanTemperatureWarmestQuarter({latitude: lat, longitude: lon, timeframe: '2050'}),
    '2070': (lat, lon) => getMeanTemperatureWarmestQuarter({latitude: lat, longitude: lon, timeframe: '2070'}),
    '2090': (lat, lon) => getMeanTemperatureWarmestQuarter({latitude: lat, longitude: lon, timeframe: '2090'}),
  }

  const temperatures = TIMEFRAMES.map((tf) => utils[tf](+latitude, +longitude)).filter((t) => t !== null) as number[];
  const riskAssessment = temperatures.some((temp) => temp >= 35) ? 'High' : 'Low';

  const factory: IFactory = {
    factoryName,
    country,
    address,
    latitude: +latitude,
    longitude: +longitude,
    yearlyRevenue: +yearlyRevenue,
    riskAssessment, 
 }

  await client.run(
    `INSERT INTO factories (factory_name, address, country, latitude, longitude, yearly_revenue, risk_assessment)
VALUES (?, ?, ?, ?, ?, ?, ?);`,
    factory.factoryName,
    factory.address,
    factory.country,
    factory.latitude,
    factory.longitude,
    factory.yearlyRevenue,
    factory.riskAssessment
  );

  return c.json({ result: 'OK' });
});

serve(app);
