import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

const state = (page: Page) => page.evaluate(async () => {
  const path='/src/store/boardDrawing.ts';
  const s=(await import(path)).useBoardDrawing.getState();
  return { strokes:s.strokes,current:s.current,keyboardDrawing:s.keyboardDrawing };
});
async function openBoard(page: Page) {
  await page.goto('/');
  await page.getByRole('button',{name:/Skip intro/}).waitFor({state:'visible',timeout:60_000});
  await page.keyboard.press('Escape');
  const draw=page.getByRole('button',{name:/Draw on board/});
  await draw.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'black marker',exact:true})).toBeEnabled({timeout:30_000});
}
async function clear(page: Page) {
  const button=page.getByRole('button',{name:'Clear',exact:true});
  if(await button.isEnabled()) await button.click();
}
async function move(page: Page,x:number,y:number) { await page.mouse.move(x,y); }

test('actual board: capture miss, four edges, re-entry, release, undo, tools and persistence',async({page})=>{
  const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('jordan-whiteboard-v1', JSON.stringify([{tool:'green',points:[[.2,.2],[.3,.3]]}])));
  await openBoard(page);
  expect((await state(page)).strokes[0].segments).toEqual([[[.2,.2],[.3,.3]]]);
  await clear(page);
  // This formerly appended the saved pointer-down UV after crossing the right edge.
  await move(page,400,300); await page.mouse.down();
  await move(page,400,600); await move(page,1200,600); await move(page,1400,600);
  await move(page,1000,300); await move(page,1100,300); await page.mouse.up();
  const drawn=await state(page);
  expect(drawn.strokes).toHaveLength(1);
  expect(drawn.strokes[0].segments).toHaveLength(2);
  expect(drawn.strokes[0].segments[0]).toHaveLength(3);
  await page.screenshot({path:'.private/whiteboard-fixed.png'});
  const {data,info}=await sharp(await page.screenshot()).raw().toBuffer({resolveWithObject:true});
  // The old diagonal crosses here; the actual intended strokes do not.
  const pixel=(x:number,y:number)=>Array.from(data.subarray((y*info.width+x)*info.channels,(y*info.width+x)*info.channels+3));
  expect(Math.min(...pixel(800,450))).toBeGreaterThan(120);
  expect(Math.max(...pixel(700,600))).toBeLessThan(100);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  expect((await state(page)).strokes).toHaveLength(0);
  for(const [inside,outside,back] of [
    [[210,400],[150,400],[250,450]], [[1230,400],[1300,400],[1200,450]],
    [[600,125],[600,80],[650,150]], [[600,875],[600,895],[650,850]],
  ]) {
    await move(page,...inside as [number,number]); await page.mouse.down();
    await move(page,...outside as [number,number]); await move(page,...back as [number,number]); await page.mouse.up();
    expect((await state(page)).strokes.at(-1).segments).toHaveLength(2);
  }
  await clear(page);
  for(let i=0;i<3;i++) { await move(page,400+i*100,300); await page.mouse.down(); await move(page,420+i*100,320); await page.mouse.up(); }
  expect((await state(page)).strokes).toHaveLength(3);
  await move(page,700,400); await page.mouse.down(); await move(page,1400,400); await page.mouse.up(); await move(page,800,400);
  expect((await state(page)).current).toBeNull();
  await page.getByRole('button',{name:'red marker',exact:true}).click();
  await move(page,500,500); await page.mouse.down(); await move(page,600,500); await page.mouse.up();
  expect((await state(page)).strokes.at(-1).tool).toBe('red');
  await page.getByRole('button',{name:'Eraser',exact:true}).click();
  await move(page,550,480); await page.mouse.down(); await move(page,550,520); await page.mouse.up();
  expect((await state(page)).strokes.at(-1).tool).toBe('eraser');
  const before=await state(page); await page.reload();
  expect((await state(page)).strokes).toEqual(before.strokes);
  expect(errors).toEqual([]);
});

test('cancellation, lost capture, blur, keyboard and resize do not connect gestures',async({page})=>{
  await openBoard(page);
  for(const event of ['pointercancel','lostpointercapture','blur']) {
    await move(page,500,400); await page.mouse.down(); await move(page,600,400);
    await page.evaluate(event=>{
      const canvas=document.querySelector('canvas')!;
      if(event==='blur') window.dispatchEvent(new Event('blur'));
      else canvas.dispatchEvent(new PointerEvent(event,{pointerId:1,bubbles:true}));
    },event);
    expect((await state(page)).current).toBeNull();
    await page.mouse.up(); await move(page,700,500);
  }
  const keyboard=page.getByLabel(/Whiteboard keyboard drawing/);
  await keyboard.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown');
  await page.getByRole('button',{name:'blue marker',exact:true}).click();
  expect((await state(page)).keyboardDrawing).toBe(false);
  await move(page,500,400); await page.mouse.down();
  await page.setViewportSize({width:1200,height:900});
  await page.waitForTimeout(1500);
  await move(page,600,450); await move(page,620,470); await page.mouse.up();
  expect((await state(page)).strokes.at(-1).segments).toHaveLength(2);
  const point=(await state(page)).strokes.at(-1).segments[1][0];
  expect(point[0]).toBeCloseTo(.5,1); expect(point[1]).toBeCloseTo(.5,1);
  await page.getByRole('button',{name:/Back to desk/}).click();
  await expect(page.getByRole('button',{name:/Draw on board/})).toBeAttached();
  await page.goto('/#/desktop/projects');
  await expect(page.getByRole('heading',{name:'HP Prime Emulator',exact:true})).toBeVisible();
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
});

for(const mobile of [false,true]) test(`Projects navigation and offline inventory (${mobile?'mobile':'desktop'})`,async({page})=>{
  if(mobile) await page.setViewportSize({width:390,height:844});
  await page.route('https://api.github.com/**',route=>route.fulfill({status:403,body:'{}'}));
  await page.goto('/#/desktop/projects');
  for(const title of ['HP Prime Emulator','HP Prime Development Toolkit','SyncroEdit','Ubume','Codexa v3','Forest RPG v2','MyGUI','HTTP Server']) {
    await page.getByRole('button',{name:new RegExp('^'+title)}).click();
    await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
    await expect(page.getByRole('link',{name:'View source on GitHub'})).toHaveAttribute('href',/^https:\/\/github.com\/golba98\//);
    if(mobile) {
      await page.getByRole('link',{name:'View source on GitHub'}).hover();
      const back=await page.getByRole('button',{name:'Projects',exact:true}).boundingBox();
      const source=await page.getByRole('link',{name:'View source on GitHub'}).boundingBox();
      const headerTitle=await page.locator('header[data-platform="ios"]').getByText(title,{exact:true}).boundingBox();
      expect(back!.x).toBeGreaterThanOrEqual(0);
      expect(headerTitle!.x).toBeGreaterThanOrEqual(back!.x+back!.width);
      expect(headerTitle!.x+headerTitle!.width).toBeLessThanOrEqual(source!.x);
      expect(source!.x+source!.width).toBeLessThanOrEqual(390);
    }
    if(title==='HP Prime Development Toolkit') await page.screenshot({path:`.private/featured-${mobile?'mobile':'desktop'}.png`});
    if(title==='Codexa v3') { await expect(page.getByText('248,687,488',{exact:true})).toBeVisible(); await expect(page.getByText('Conversational SFT Validation Loss')).toHaveCount(0); }
    if(mobile) await page.getByRole('button',{name:'Projects',exact:true}).click();
  }
  await page.getByRole('button',{name:/All Repositories Public code/}).click();
  await expect(page.getByRole('status')).toContainText('snapshot verified');
  const list=page.getByRole('heading',{name:'On GitHub',exact:true}).locator('..');
  await expect(list.locator('a[href^="https://github.com/golba98/"]')).toHaveCount(14);
  await page.screenshot({path:`.private/projects-${mobile?'mobile':'desktop'}.png`});
  if(mobile) await page.getByRole('button',{name:'Projects',exact:true}).click();
  await page.getByRole('button',{name:/Earlier Projects Previous versions/}).click();
  await expect(page.getByRole('link',{name:/Forest RPG v1/})).toHaveAttribute('href','https://github.com/golba98/Game_Development');
});

test('mobile touch and pen, DPR changes, and return from another application',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await openBoard(page);
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:400}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:220,y:400}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:389,y:400}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:450}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect((await state(page)).strokes.at(-1).segments).toHaveLength(2);
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:150,y:420,button:'left',buttons:1,clickCount:1,pointerType:'pen'});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:220,y:420,button:'left',buttons:1,pointerType:'pen'});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:220,y:420,button:'left',buttons:0,clickCount:1,pointerType:'pen'});
  expect((await state(page)).strokes).toHaveLength(2);
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  await page.waitForTimeout(500);
  await page.touchscreen.tap(195,422);
  const center=(await state(page)).strokes.at(-1).segments[0][0];
  expect(center[0]).toBeCloseTo(.5,1); expect(center[1]).toBeCloseTo(.5,1);
  await page.screenshot({path:'.private/whiteboard-mobile.png'});
  const before=(await state(page)).strokes;
  // Enter another portfolio application without reloading the mounted scene.
  await page.getByRole('link',{name:'Skip to portfolio'}).focus(); await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Projects',exact:true}).first().click();
  await expect(page.getByRole('button',{name:/HP Prime Emulator/})).toBeVisible();
  await page.getByRole('button',{name:'Control Centre',exact:true}).click();
  await page.getByRole('button',{name:'Back to the 3D desk',exact:true}).click();
  await page.getByRole('button',{name:/Draw on board/}).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'black marker',exact:true})).toBeEnabled();
  expect((await state(page)).strokes).toEqual(before);
  await page.touchscreen.tap(195,422);
  expect((await state(page)).strokes).toHaveLength(before.length+1);
  await context.close();
});
