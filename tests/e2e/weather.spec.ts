import { expect, test, type Page } from '@playwright/test';

const city = {
  id: 1,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  country_code: 'BR',
  latitude: -23.5,
  longitude: -46.6,
  timezone: 'America/Sao_Paulo',
};

const forecast = {
  timezone: 'America/Sao_Paulo',
  current: {
    time: '2026-10-27T14:00',
    temperature_2m: 22.4,
    apparent_temperature: 23.1,
    weather_code: 2,
    relative_humidity_2m: 64,
    wind_speed_10m: 12.5,
  },
  daily: {
    time: ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'],
    weather_code: [2, 61, 3, 0, 1],
    temperature_2m_min: [17.2, 18, 19, 16, 17],
    temperature_2m_max: [25.1, 24.3, 26, 23, 24],
    precipitation_probability_max: [10, 70, 0, 5, 15],
  },
};

async function mockOpenMeteo(page: Page, failFirstSearch = false) {
  let searchCount = 0;
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    searchCount += 1;
    if (failFirstSearch && searchCount === 1) {
      await route.fulfill({ status: 503, body: '' });
      return;
    }

    const query = new URL(route.request().url()).searchParams.get('name');
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(query === 'Recife' || query === 'Atlantis' ? {} : { results: [city] }),
    });
  });
  await page.route('https://api.open-meteo.com/**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(forecast) });
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WeatherView', level: 1 })).toBeVisible();
});

test('exibe cinco dias em layout responsivo, inclusive no viewport mobile', async ({ page }) => {
  await mockOpenMeteo(page);
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' }).click();
  await expect(page.getByText('22,4 °C')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Clima atual · São Paulo, São Paulo, Brasil' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();

  for (const { width, columns } of [
    { width: 320, columns: 2 },
    { width: 768, columns: 3 },
    { width: 1280, columns: 5 },
  ]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    const cards = page.getByRole('article');
    await expect(cards).toHaveCount(5);
    const gridColumns = await page
      .getByRole('list')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(gridColumns).toBe(columns);
    for (const card of await cards.all()) {
      const dimensions = await card.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        content: element.textContent,
      }));
      expect(
        dimensions.scrollWidth,
        `overflow in ${width}px card: ${dimensions.content}`,
      ).toBeLessThanOrEqual(dimensions.clientWidth);
    }
    for (const control of await page.locator('input, button, select').all()) {
      expect(
        await control.evaluate((element) => element.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44);
    }
  }
});

test('exige seleção explícita, permite uso por teclado e limpa dados em nova busca', async ({
  page,
}) => {
  await mockOpenMeteo(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Tab');
  const input = page.getByRole('searchbox', { name: 'Cidade' });
  await expect(input).toBeFocused();
  await input.fill('São Paulo');
  await input.press('Enter');
  const selectCity = page.getByRole('button', {
    name: 'Selecionar São Paulo, São Paulo, Brasil',
  });
  await expect(selectCity).toBeVisible();
  await expect(page.getByText('22,4 °C')).toHaveCount(0);
  await selectCity.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('22,4 °C')).toBeVisible();

  const fahrenheit = page.getByRole('button', { name: 'Fahrenheit' });
  await fahrenheit.focus();
  await page.keyboard.press('Space');
  await expect(page.getByText('72,3 °F')).toBeVisible();
  await expect(page.getByRole('main').getByText(/\d.*°C/)).toHaveCount(0);

  await input.fill('Recife');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await expect(page.getByText('72,3 °F')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mostra o estado vazio quando o geocoding não retorna cidades', async ({ page }) => {
  await mockOpenMeteo(page);
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Atlantis');
  await page.getByRole('button', { name: 'Buscar' }).click();

  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Selecionar/ })).toHaveCount(0);
  await expect(page.getByText('22,4 °C')).toHaveCount(0);
});

test('completa a busca e mostra o clima em viewport mobile de 375 × 812', async ({ page }) => {
  await mockOpenMeteo(page);
  await page.setViewportSize({ width: 375, height: 812 });

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' }).click();

  await expect(page.getByText('22,4 °C')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Previsão de 5 dias' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('mantém contraste de texto normal de pelo menos 4,5:1', async ({ page }) => {
  await mockOpenMeteo(page);
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await page.getByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' }).click();
  await expect(page.getByText('22,4 °C')).toBeVisible();

  const contrasts = await page
    .locator('h1, h2, h3, p, dt, dd, label, button, select, input')
    .evaluateAll((elements) => {
      function rgb(color: string): number[] {
        return (color.match(/[\d.]+/g) ?? []).map(Number);
      }
      function luminance(color: number[]): number {
        const linear = color.slice(0, 3).map((value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      }
      return elements
        .filter((element) => element.getBoundingClientRect().width > 1)
        .map((element) => {
          const ancestors: Element[] = [];
          for (
            let ancestor: Element | null = element;
            ancestor;
            ancestor = ancestor.parentElement
          ) {
            ancestors.unshift(ancestor);
          }
          let background = [17, 22, 42];
          for (const ancestor of ancestors) {
            const color = rgb(getComputedStyle(ancestor).backgroundColor);
            const alpha = color[3] ?? 1;
            background = background.map(
              (channel, index) => color[index] * alpha + channel * (1 - alpha),
            );
          }
          const foreground = luminance(rgb(getComputedStyle(element).color));
          const backdrop = luminance(background);
          return {
            text: element.textContent?.trim().slice(0, 60),
            ratio:
              (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05),
          };
        });
    });

  expect(contrasts.length).toBeGreaterThan(20);
  expect(contrasts.filter(({ ratio }) => ratio < 4.5)).toEqual([]);
});

test('erro de geocoding oferece retry manual', async ({ page }) => {
  await mockOpenMeteo(page, true);
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('São Paulo');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('alert')).toContainText('Falha ao buscar cidades.');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(
    page.getByRole('button', { name: 'Selecionar São Paulo, São Paulo, Brasil' }),
  ).toBeVisible();
});
