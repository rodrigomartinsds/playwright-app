const express = require('express');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Teste simples - página inicial
app.get('/', (req, res) => {
  res.json({ 
    message: 'Playwright App funcionando! 🎉',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check para EasyPanel
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'playwright-app' });
});

// Tirar screenshot de uma página
app.get('/screenshot', async (req, res) => {
  let browser;
  try {
    console.log('Iniciando browser...');
    
    // Configuração otimizada para VPS
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu',
        '--memory-pressure-off'
      ]
    });
    
    const page = await browser.newPage();
    const url = req.query.url || 'https://example.com';
    
    console.log(`Acessando: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const screenshot = await page.screenshot({ 
      type: 'png',
      fullPage: false 
    });
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="screenshot.png"');
    res.send(screenshot);
    
    console.log('Screenshot gerado com sucesso!');
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser fechado');
    }
  }
});

// Obter título de uma página
app.get('/title', async (req, res) => {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const url = req.query.url || 'https://example.com';
    
    await page.goto(url, { waitUntil: 'networkidle' });
    const title = await page.title();
    
    res.json({ 
      url: url,
      title: title,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log(`📸 Screenshot: http://localhost:${PORT}/screenshot?url=https://google.com`);
  console.log(`📄 Title: http://localhost:${PORT}/title?url=https://google.com`);
});
