
import { test, expect } from '@playwright/test';

test.describe('Typing test app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://typing-test-five-blue.vercel.app/");
    
  });

  test('should load the page', async ({ page }) => {
    await expect(page).toHaveTitle("Typing test");
    await expect(page.locator("h1")).toHaveText("DONKEY TYPING");
    await expect(page.locator("#quoteDisplay")).not.toBeEmpty();
    await expect(page.locator("#quoteInput")).toBeEmpty();
    await expect(page.locator("#retryBtn")).toBeHidden();
    const timer=await page.locator("#timeDisplay").textContent();
    await expect(timer?.trim()).toBe('00:30:00');
  });

  test('should start timer when the typing begins',async({page})=>{
      const quote= await page.locator('#quoteDisplay').textContent();
      const quoteInput=page.locator("#quoteInput");
      const timerInitial=await page.locator("#timeDisplay").textContent();

      if (typeof quote==="string") {
       await quoteInput.press(quote.slice(0, 1), { delay: 100 }); 
     }
      const timeAfter=await page.locator("#timeDisplay").textContent();
      await expect(timerInitial).not.toBe(timeAfter);
  })

  test('timer should stop when the quote is typed completely',async({page})=>{
      const quote= await page.locator('#quoteDisplay').textContent();
      const quoteInput=page.locator("#quoteInput");

      if(quote){
        await quoteInput.type(quote,{delay:100})
        const finishTimer=await page.locator("#timeDisplay").textContent();
        await page.waitForTimeout(2000);
        const timeAfter = await page.locator("#timeDisplay").textContent();
        expect(finishTimer).toBe(timeAfter);
      }
  })

  test('should not type further if wrong character is typed',async({page})=>{
         const quote= await page.locator('#quoteDisplay').textContent();
         const quoteInput=page.locator("#quoteInput");

         if(quote){
            const correctLetter= quote.charAt(0);
            const wrongChar = correctLetter === 'a' ? 'b' : 'a';
            await quoteInput.type(correctLetter, { delay: 100 });
            await quoteInput.type(wrongChar, { delay: 100 });
            const nextChar = quote.charAt(2) || 'x';
            await quoteInput.type(nextChar, { delay: 100 });
             const currentValue = await quoteInput.inputValue();
            expect(currentValue.length).toBe(2);
            expect(currentValue).not.toContain(nextChar);
         }
  })

  test('different quote should come and timer should reset',async({page})=>{
      const quote= await page.locator('#quoteDisplay').textContent();
      const quoteInput=page.locator("#quoteInput");

      if (typeof quote==="string") {
       await quoteInput.press(quote.slice(0, 1), { delay: 100 }); 
     }
      const retrybtn= await page.locator("#retryBtn")
       await retrybtn.click();
       const quoteAfterRestart= await page.locator('#quoteDisplay').textContent();
       await expect(quote).not.toEqual(quoteAfterRestart);

       const timer=await page.locator("#timeDisplay").textContent();
       await expect(timer?.trim()).toBe('00:30:00');
  })

  test("leaderboard entry should match test results",async({page})=>{
        const quote= await page.locator('#quoteDisplay').textContent();
      const quoteInput=page.locator("#quoteInput");

      if(quote){
        await quoteInput.type(quote,{delay:100})
      }
      const popup = page.locator('#resultPopup');
      await expect(popup).toBeVisible();

      const popupWpm = (await page.locator('#popupWpm').textContent())?.trim();
      const popupAccuracy = (await page.locator('#popupAccuracy').textContent())?.trim();

      await page.locator('#closePopupBtn').click();
      await page.waitForTimeout(500);

      const LeaderboardEntry = await page.locator('#leaderboard li').first().textContent();
      expect(LeaderboardEntry).toContain(`${popupWpm} WPM`);
      expect(LeaderboardEntry).toContain(`${popupAccuracy} %`);
  })

});
