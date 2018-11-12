const puppeteer = require('puppeteer');

let browser, page;

beforeEach(async () => {
	browser = await puppeteer.launch({
		//setting headless to false opens browser WITH GUI
		//typically you will want to set this to true since it's faster
		headless: true,
		args: ['--no-sandbox']
	});
	
	page = await browser.newPage();
	await page.goto('http://localhost:3000');
});

afterEach(async () => {
	await browser.close();
});

test('the header has the correct test', async () => {	
	const text = await page.$eval('a.brand-logo', el => el.innerHTML);
	expect(text).toEqual('Blogster')
});

test('clicking login starts oauth flow', async () => {	
	await page.click('.right a');
	const url = await page.url();
	expect(url).toMatch('https:\/\/accounts\.google\.com');
})