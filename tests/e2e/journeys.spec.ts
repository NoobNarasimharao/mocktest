import {test,expect} from '@playwright/test';
test('weekly test persists, submits, reviews, exports and reopens',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');
 await expect(page.getByRole('heading',{name:'Week 12',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Start Practice',exact:true}).first().click();
 await page.getByRole('button',{name:'Begin test'}).click();
 await page.getByRole('radio',{name:/Option C:/}).check();
 await page.getByRole('button',{name:'Mark for Review',exact:true}).click();
 await page.getByRole('button',{name:'Save & Next'}).click();await page.reload();
 await expect(page.getByRole('heading',{name:'Question 2 / 12'})).toBeVisible();
 await page.getByRole('button',{name:/Question 1, answered/}).click();
 await expect(page.getByRole('radio',{name:/Option C:/})).toBeChecked();
 await expect(page.getByText('From the solution sheet')).toHaveCount(0);
 await page.getByRole('button',{name:'Submit test',exact:true}).click();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect(page.getByRole('radio',{name:/Option C:/})).toBeEnabled();
 await page.getByRole('button',{name:'Submit test',exact:true}).click();await page.getByRole('button',{name:'Confirm submission'}).click();
 await expect(page.getByText('1 / 12 points')).toBeVisible();
 await page.getByRole('button',{name:'Review Answers'}).click();
 await page.getByRole('button',{name:'Marked for review',exact:true}).click();
 await expect(page.getByText('From the solution sheet')).toHaveCount(1);
 await page.getByRole('button',{name:'Return to Dashboard'}).click();
 await page.getByRole('link',{name:'Results history'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'JSON',exact:true}).click();expect((await download).suggestedFilename()).toBe('rsai-results.json');
 await page.getByRole('button',{name:/Weekly practice/}).click();await expect(page.getByText('1 / 12 points')).toBeVisible();expect(errors).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('numerical, multi-select and matching controls work; revision locks responses',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Start Practice',exact:true}).nth(4).click();await page.getByRole('button',{name:'Begin test'}).click();
 await page.getByRole('button',{name:/Question 6, /}).click();await expect(page.getByText('Choose the matching combination')).toBeVisible();await expect(page.getByRole('radio')).toHaveCount(4);await page.getByRole('radio',{name:/Option B:/}).check();
 await page.getByRole('button',{name:/Question 7, /}).click();await page.getByRole('checkbox',{name:/Option A:/}).check();await page.getByRole('checkbox',{name:/Option B:/}).check();await page.getByRole('checkbox',{name:/Option D:/}).check();
 await page.getByRole('button',{name:/Question 9, /}).click();await page.getByRole('spinbutton',{name:'Your numerical answer'}).fill('2');await page.reload();await expect(page.getByRole('spinbutton',{name:'Your numerical answer'})).toHaveValue('2');
 await page.getByRole('button',{name:'Submit test',exact:true}).click();await page.getByRole('button',{name:'Confirm submission'}).click();await expect(page.getByText('3 / 12 points')).toBeVisible();
 await page.getByRole('button',{name:'Return to Dashboard'}).click();await page.getByRole('button',{name:/Learn as you go/}).click();await page.getByRole('button',{name:'Begin test'}).click();await page.getByRole('radio',{name:/Option C:/}).check();await page.getByRole('button',{name:'Check answer'}).click();await expect(page.getByText('From the solution sheet')).toBeVisible();await expect(page.getByRole('radio').first()).toBeDisabled();
});
test('timer auto-submits once after refresh with expired deadline',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Start Mock Test',exact:true}).click();await page.getByLabel('Time limit (0 = untimed)').fill('1');await page.getByRole('button',{name:'Begin test'}).click();
 await page.evaluate(()=>{const a=JSON.parse(localStorage.getItem('rsai-2026:active')!);a.startedAt=Date.now()-61000;a.resumedAt=a.startedAt;a.endAt=Date.now()-1000;localStorage.setItem('rsai-2026:active',JSON.stringify(a));});await page.reload();
 await expect(page.getByText('0 / 140 points')).toBeVisible();await page.reload();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('rsai-2026:history')!).length)).toBe(1);
});
test('corrupt saved state falls back safely and images load',async({page})=>{
 await page.goto('./');await page.evaluate(()=>{localStorage.setItem('rsai-2026:active','{"version":1}');localStorage.setItem('rsai-2026:history','garbage');});await page.reload();await expect(page.getByRole('button',{name:'Start Mock Test',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Start Practice',exact:true}).nth(7).click();await page.getByRole('button',{name:'Begin test'}).click();await page.getByRole('button',{name:/Question 8, /}).click();await expect(page.locator('.source-image').first()).toBeVisible();for(const image of await page.locator('.source-image').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(i=>(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>0)).toBe(true);}
});
test('untimed pause, numerical clear, and weekly mode switching preserve valid state',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'Start Mock Test',exact:true}).click();await page.getByLabel('Test mode',{exact:true}).selectOption('Weekly practice');await page.getByLabel('Week',{exact:true}).selectOption('6');await page.getByRole('button',{name:'Begin test'}).click();
 await expect(page.getByRole('heading',{name:'Question 1 / 12'})).toBeVisible();await page.getByRole('button',{name:/Question 6, /}).click();await page.getByRole('spinbutton',{name:'Your numerical answer'}).fill('91');await page.getByRole('button',{name:'Clear Response'}).click();await page.reload();await expect(page.getByRole('spinbutton',{name:'Your numerical answer'})).toHaveValue('');
 await page.getByRole('button',{name:'Pause & exit'}).click();await expect(page.getByRole('button',{name:'Resume test'})).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('rsai-2026:active')!).resumedAt)).toBe(null);await page.getByRole('button',{name:'Resume test'}).click();await expect(page.getByRole('heading',{name:'Question 6 / 12'})).toBeVisible();await page.getByRole('button',{name:'Pause & exit'}).click();await page.goBack();await expect(page.getByRole('heading',{name:'Question 6 / 12'})).toBeVisible();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('rsai-2026:active')!).resumedAt)).not.toBe(null);
});
