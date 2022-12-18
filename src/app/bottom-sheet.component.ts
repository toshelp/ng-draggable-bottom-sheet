import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { merge, fromEvent, Subject, exhaustMap } from 'rxjs';
import { ElementRef } from '@angular/core';
import { takeUntil, tap } from 'rxjs';

@Component({
  selector: 'draggable-bottom-sheet',
  template: `
    <div [ngClass]="sheetClass()" [style.transform]="sheetTransform">
      <div [ngClass]="contentsClass()">
        <header>
          <div #draggableArea class="draggableArea">
            <div class="draggableThumb"></div>
          </div>
          <button class="closingButton" type="button" (click)="onCloseEvent()">x</button>
          <div class="dmzArea"></div>
        </header>
        <main class="main" [style.max-height]="mainHeight">
          <h2>Angular draggable bottom sheet</h2>
          <h2>configuration</h2>
          <label>topMagneticThreshold:</label>
          <input type="number" [(ngModel)]="topMagneticThreshold" style="max-width: 3rem;" />%<br />
          <label>bottomMagneticThreshold:</label>
          <input type="number" [(ngModel)]="bottomMagneticThreshold" style="max-width: 3rem;" />%<br />
          <label>topMarginThresholdPx:</label>
          <input type="number" [(ngModel)]="topMarginThresholdPx" style="max-width: 3rem;" />pixel<br />
          <label>bottomMarginThresholdPx:</label>
          <input type="number" [(ngModel)]="bottomMarginThresholdPx" style="max-width: 3rem;" />pixel<br />
          <label>bottomPaddingPx:</label>
          <input type="number" [(ngModel)]="bottomPaddingPx" style="max-width: 3rem;" />pixel<br />
          <label>enableDetectMotionMode:</label> true
          <input type="radio" [(ngModel)]="enableDetectMotionMode" [value]="true" name="motionMode" style="max-width: 3rem;" /> false
          <input type="radio" [(ngModel)]="enableDetectMotionMode" [value]="false" name="motionMode" style="max-width: 3rem;" /><br />
          <label>motionThresholdPx:</label>
          <input type="number" [(ngModel)]="motionThresholdPx" style="max-width: 3rem;" />pixel<br />
          <h2>MIT License</h2>
          Copyright (c) 2022 toshelp Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
          files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following
          conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE
          SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
          LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
          IN THE SOFTWARE.
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .sheet {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        word-break: break-word;
        min-height: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        align-items: center;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
      }

      .onSheetDragging {
        /* HACK: This transition has case of any jitter problems. */
        /* Use chromium only. */
        transition: transform 40ms linear;
        backface-visibility: hidden;
        will-change: transform;
      }

      .notSheetDragging {
        transition: transform 400ms ease;
        will-change: transform;
      }

      .inactive {
        opacity: 0;
        visibility: hidden;
        transition: 350ms;
        will-change: transform opacity;
      }

      .contents {
        background: #fff;
        position: relative;
        width: 100vw;
        max-width: 40rem;
        min-width: 16rem;
        min-height: 100%;
        padding: 1rem;
        padding-top: 42px;
        box-sizing: border-box;
        pointer-events: auto;
        transition: 300ms;
        will-change: transform;
      }

      .notFullScreen {
        border-radius: 1.2rem 1.2rem 0 0;
        will-change: border-radius;
      }

      .onContentsDragging {
        backdrop-filter: blur(3px);
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0px 0px 12px #777;
        border-radius: 1.2rem 1.2rem 0 0;
        will-change: border-radius backdrop-filter;
      }

      .notContentsDragging {
        background: rgba(255, 255, 255, 1);
      }

      .draggableArea {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width: 50%;
        margin: auto;
        padding: 1rem;
        cursor: grab;
        text-align: center;
        text-align: -moz-center;
        text-align: -webkit-center;
      }

      .draggableThumb {
        width: 4rem;
        height: 0.25rem;
        background: #ddd;
        border-radius: 0.125rem;
      }

      .dmzArea {
        position: absolute;
        top: 2rem;
        left: 0;
        right: 0;
        width: 100%;
        height: 1rem;
        pointer-events: auto;
        z-index: 11;
      }

      .closingButton {
        position: absolute;
        top: 9px;
        right: 11px;
        padding: 0.2rem;
        font-size: 1rem;
        border-radius: 1rem;
        background: rgba(0, 0, 0, 0);
        cursor: pointer;
        border-width: 0;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      }

      .closingButton:focus {
        outline: none;
      }

      .main {
        overflow: auto;
        padding: 0.8rem;
        height: 100%;
        scrollbar-gutter: stable;
        padding-bottom: 80px;
        transition: max-height 300ms;
        will-change: max-height;
      }

      .main::-webkit-scrollbar {
        width: 6px;
      }

      .main::-webkit-scrollbar-thumb {
        background: #aaa;
        border-radius: 4px;
      }

      .main::-webkit-scrollbar-track {
        background: #ddd;
        border-radius: 4px;
      }
    `,
  ],
})
export class BottomSheetComponent implements OnInit, OnDestroy {
  @ViewChild('draggableArea', { static: true }) draggableArea!: ElementRef;
  public topMagneticThreshold: number = 75; // configurable parameter
  public bottomMagneticThreshold: number = 25; // configurable parameter
  public topMarginThresholdPx: number = 0; // configurable parameter
  public bottomMarginThresholdPx: number = 0; // configurable parameter
  public bottomPaddingPx: number = 80; // configurable parameter
  public enableDetectMotionMode: boolean = true; // configurable parameter
  public motionThresholdPx: number = 60; // configurable parameter
  public sheetTransform = `translate3d(0, 100%, 0)`;
  public mainHeight = `100%`;
  private destroy$ = new Subject<void>();
  private isActive: boolean = false;
  private isDragging: boolean = false;
  private isFullScreen: boolean = false;
  private dragPositionYpx: number = 0;
  private currentPositionY: number = 0;
  private deltaYpx: number = 0;
  private deltaHeight: number = 0;
  private isChromium: boolean = false; // HACK: chromium only code should be removed.

  constructor() {
    this.isChromium = this.checkChromium();
  }

  private checkChromium(): boolean {
    // @ts-ignore
    if (navigator.userAgentData != undefined) {
      // @ts-ignore
      const browserInfo = navigator.userAgentData.brands.find((data: any) => data.brand === 'Chromium');
      if (browserInfo != undefined) {
        return true;
      }
    } else if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
      return true;
    }
    return false;
  }

  public sheetClass() {
    return {
      sheet: true,
      inactive: !this.isActive,
      onSheetDragging: this.isDragging && this.isChromium,
      notSheetDragging: !this.isDragging,
    };
  }

  public contentsClass() {
    return {
      contents: true,
      onContentsDragging: this.isDragging,
      notContentsDragging: !this.isDragging,
      notFullScreen: !this.isFullScreen,
    };
  }

  public ngOnInit(): void {
    const mousedown$ = fromEvent(this.draggableArea.nativeElement, 'mousedown');
    const mousemove$ = fromEvent(window, 'mousemove');
    const mouseup$ = fromEvent(window, 'mouseup');
    const touchstart$ = fromEvent(this.draggableArea.nativeElement, 'touchstart');
    const touchmove$ = fromEvent(window, 'touchmove');
    const touchend$ = fromEvent(window, 'touchend');
    const start$ = merge(touchstart$, mousedown$);
    const move$ = merge(touchmove$, mousemove$);
    const end$ = merge(touchend$, mouseup$);

    start$
      .pipe(
        tap((event) => {
          this.isDragging = true;
          this.deltaYpx = 0;
          this.deltaHeight = 0;
          this.dragPositionYpx = (event as TouchEvent).touches
            ? (event as TouchEvent).touches[0].pageY
            : (event as MouseEvent)
            ? (event as MouseEvent).pageY
            : 0;
        }),
        exhaustMap(() =>
          move$.pipe(
            tap((event) => {
              if ((event as TouchEvent).touches) {
                this.deltaYpx = this.dragPositionYpx - (event as TouchEvent).touches[0].pageY;
              } else {
                this.deltaYpx = this.dragPositionYpx - (event as MouseEvent).pageY;
              }
              this.deltaHeight = (this.deltaYpx / window.innerHeight) * 100;
              this.sheetTransform = `translate3d(0, calc(max(${this.topMarginThresholdPx}px, ${this.currentPositionY - this.deltaHeight}%)), 1px)`;
            }),
            takeUntil(end$)
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe();

    end$.subscribe(() => {
      if (this.isDragging) {
        this.isDragging = false;
        this.currentPositionY = this.currentPositionY - this.deltaHeight;
        this.setSheetHeight(this.detectMotion());
      }
    });

    this.isActive = false;

    // DELETEME: This setTimeout is demo implementation.
    setTimeout(() => {
      this.onActiveEvent(50);
    }, 1000);
  }

  private detectMotion(): number {
    if (this.enableDetectMotionMode) {
      let delta = 100 - this.currentPositionY;
      if (this.deltaHeight > (this.motionThresholdPx / window.innerHeight) * 100) {
        if (delta < 50) {
          return 50;
        }
        if (delta >= 50) {
          return 100;
        }
      }
      if (this.deltaHeight < (this.motionThresholdPx / window.innerHeight) * 100 * -1) {
        if (delta > 50) {
          return 50;
        }
        if (delta < 50) {
          return 0;
        }
      }
    }
    return 100 - this.currentPositionY;
  }

  private setSheetHeight(heightRatio: number): void {
    let targetRatio: number = 0;
    if (heightRatio > this.topMagneticThreshold) {
      this.isFullScreen = true;
      this.isActive = true;
      targetRatio = 100;
    } else if (heightRatio < this.bottomMagneticThreshold && this.bottomMarginThresholdPx <= 0) {
      this.isFullScreen = false;
      this.isActive = false;
      targetRatio = 0;
    } else if (heightRatio < this.bottomMagneticThreshold && this.bottomMarginThresholdPx > 0) {
      this.isFullScreen = false;
      this.isActive = true;
      targetRatio = 0;
    } else if (heightRatio <= this.topMagneticThreshold && heightRatio >= this.bottomMagneticThreshold) {
      this.isFullScreen = false;
      this.isActive = true;
      targetRatio = 50;
    }

    this.currentPositionY = 100 - targetRatio!;
    if (this.isFullScreen && this.isActive) {
      this.sheetTransform = `translate3d(0, calc(${this.currentPositionY}% + ${this.topMarginThresholdPx}px), 0)`;
      this.currentPositionY = 100 - ((window.innerHeight - this.topMarginThresholdPx) / window.innerHeight) * 100;
    } else if (!this.isFullScreen && !this.isActive) {
      this.sheetTransform = `translate3d(0, 100%, 0)`;
      this.currentPositionY = 100;
    } else if (!this.isFullScreen && this.isActive && targetRatio === 0) {
      this.sheetTransform = `translate3d(0, calc(${this.currentPositionY}% - ${this.bottomMarginThresholdPx}px), 0)`;
      this.currentPositionY = ((window.innerHeight - this.bottomMarginThresholdPx) / window.innerHeight) * 100;
    } else if (!this.isFullScreen && this.isActive && targetRatio === 50) {
      this.sheetTransform = `translate3d(0, ${this.currentPositionY}%, 0)`;
      this.currentPositionY = targetRatio;
    }
    this.mainHeight = `calc(100% - ${this.currentPositionY}% - ${this.bottomPaddingPx}px - 2rem)`;

    // DELETEME: This "if" block is demo implementation.
    if (!this.isActive) {
      setTimeout(() => {
        this.onActiveEvent(50);
      }, 1000);
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
  }

  public onActiveEvent(heightRatio: number): void {
    this.setSheetHeight(heightRatio);
  }

  public onCloseEvent(): void {
    this.setSheetHeight(0);
  }
}
