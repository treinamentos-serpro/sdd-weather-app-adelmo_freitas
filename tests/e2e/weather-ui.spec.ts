import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://**/*', (route) => route.abort());
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WeatherView', level: 1 })).toBeVisible();
});

for (const { width, columns } of [
  { width: 320, columns: 2 },
  { width: 768, columns: 3 },
  { width: 1280, columns: 5 },
]) {
  test(`layout sem overflow em ${width}px e grid com ${columns} colunas`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = page.getByRole('combobox', { name: 'Simular estado' });
    for (const value of ['idle', 'loading', 'empty', 'error', 'success']) {
      await state.selectOption(value);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    const cards = page.getByRole('article');
    await expect(cards).toHaveCount(5);
    const gridColumns = await page
      .getByRole('list')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(gridColumns).toBe(columns);
    for (const card of await cards.all()) {
      expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
    }
    await expect(page.getByText('25,1 °C')).toBeVisible();
    for (const control of await page.locator('input, button, select').all()) {
      expect(
        await control.evaluate((element) => element.getBoundingClientRect().height),
      ).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: test.info().outputPath(`weather-${width}.png`), fullPage: true });
    await page.getByRole('button', { name: 'Fahrenheit' }).click();
    await expect(page.getByText('72,3 °F')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}

test('busca e alternância de unidade pelo teclado, sem API ou erros de execução', async ({
  page,
}) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.url().includes('open-meteo.com')) apiRequests.push(request.url());
  });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Tab');
  const input = page.getByRole('searchbox', { name: 'Cidade' });
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-style', 'solid');
  await page.keyboard.type('  Sao Paulo  ');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('Carregando');
  await expect(page.getByText('22,4 °C')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Clima de São Paulo carregado');
  const fahrenheit = page.getByRole('button', { name: 'Fahrenheit' });
  await fahrenheit.focus();
  await page.keyboard.press('Space');
  await expect(fahrenheit).toHaveAttribute('aria-pressed', 'true');
  await expect(fahrenheit).toHaveCSS('outline-style', 'solid');
  await expect(page.getByText('72,3 °F')).toBeVisible();
  await expect(page.getByRole('main').getByText(/\d.*°C/)).toHaveCount(0);
  await expect(page.getByText('12,5 km/h')).toBeVisible();
  await expect(page.getByText('10%', { exact: true })).toBeVisible();
  await input.fill('Recife');
  await input.press('Enter');
  await expect(page.getByText('72,3 °F')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('atalho de conteúdo, validação vazia e retry acessíveis', async ({ page }) => {
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  const input = page.getByRole('searchbox');
  await input.fill('   ');
  await input.press('Enter');
  await expect(page.getByRole('alert')).toHaveText('Digite o nome de uma cidade.');
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('combobox', { name: 'Simular estado' }).selectOption('error');
  await expect(page.getByRole('alert').filter({ hasText: 'Falha simulada' })).toBeVisible();
  const retry = page.getByRole('button', { name: 'Tentar novamente' });
  await retry.focus();
  await expect(retry).toHaveCSS('outline-style', 'solid');
  await retry.press('Enter');
  await expect(page.getByText('22,4 °C')).toBeVisible();
});

test('contraste de texto normal de pelo menos 4,5:1 no tema', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Simular estado' }).selectOption('success');
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
          // Pior caso do gradiente: night-800, seguido das camadas translúcidas.
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
